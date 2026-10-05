/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
// [user-ui] 概览页重排（审计 2.1、2.2）：
// - "开始使用"引导：一个主按钮 = 下一步要做的事；去掉装饰性背景与假代码、三个伪状态指标、
//   重复的"创建 API 密钥"入口和"保持平台就绪"推荐卡；文案改为面向使用者。
// - 示例请求：接口地址与 curl 统一取自 src/lib/api-endpoint.ts（useApiBaseUrl / buildChatCurl），
//   不再用本地的 origin / curl 拼接副本；复制时仍会取完整密钥生成可直接运行的命令。
// - 公告 / 常见问题 / 接口地址 / 服务状态：有内容才显示（原来只看后台开关，空卡片占满首屏）。
// 引导的展开/收起、进度判断、记忆偏好等行为沿用官方实现。
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  FileText,
  KeyRound,
  ListChecks,
  TerminalSquare,
  type LucideIcon,
} from 'lucide-react'
import { useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CopyButton } from '@/components/copy-button'
import { SectionPageLayout } from '@/components/layout'
import {
  CardStaggerContainer,
  CardStaggerItem,
} from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { isUserUiFeatureEnabled } from '@/config/user-ui-features'
import { fetchTokenKey, getApiKeys } from '@/features/keys/api'
import type { ApiKey } from '@/features/keys/types'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { getUserModels } from '@/lib/api'
import {
  buildChatCurl,
  toOpenAiBaseUrl,
  useApiBaseUrl,
} from '@/lib/api-endpoint'
import { handleServerError } from '@/lib/handle-server-error'
import { ROLE } from '@/lib/roles'
import { requireServerSuccess } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import {
  useAnnouncements,
  useApiInfo,
  useDashboardContentVisibility,
  useFAQ,
} from '../../hooks/use-status-data'
import { useUptimeGroups } from '../../hooks/use-uptime-groups'
import { AnnouncementsPanel } from './announcements-panel'
import { ApiInfoPanel } from './api-info-panel'
import { FAQPanel } from './faq-panel'
import { PerformanceHealthPanel } from './performance-health-panel'
import { SummaryCards } from './summary-cards'
import { UptimePanel } from './uptime-panel'

const SETUP_GUIDE_VISIBILITY_STORAGE_KEY =
  'dashboard_overview_setup_guide_expanded'

// [user-ui] 不知道可用模型时用占位符，而不是写死一个可能不存在的模型名（审计 2.2 #9）
const MODEL_PLACEHOLDER = '<model>'

type DashboardActionPath =
  | '/keys'
  | '/wallet'
  | '/playground'
  | '/usage-logs'
  | '/pricing'
  | '/docs'

interface StartStep {
  id: string
  title: string
  description: string
  actionLabel: string
  to: DashboardActionPath
  icon: LucideIcon
  completed: boolean
}

interface QuickAction {
  title: string
  to: DashboardActionPath
  icon: LucideIcon
  adminOnly?: boolean
}

interface RequestExample {
  apiBaseUrl: string
  model: string
  keyName: string
  keyId?: number
  displayKey: string
  ready: boolean
}

function getSavedSetupGuideExpanded(): boolean | null {
  if (typeof window === 'undefined') return null
  const saved = window.localStorage.getItem(SETUP_GUIDE_VISIBILITY_STORAGE_KEY)
  if (saved === 'expanded') return true
  if (saved === 'collapsed') return false
  return null
}

function saveSetupGuideExpanded(expanded: boolean): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    SETUP_GUIDE_VISIBILITY_STORAGE_KEY,
    expanded ? 'expanded' : 'collapsed'
  )
}

function getPreferredKey(keys: ApiKey[]): ApiKey | null {
  return keys.find((item) => item.status === 1) ?? keys[0] ?? null
}

function formatDisplayKey(key?: string): string {
  if (!key) return 'sk-...'
  if (key.length <= 14) return key
  return `${key.slice(0, 7)}...${key.slice(-4)}`
}

function StartStepItem(props: {
  step: StartStep
  index: number
  current: boolean
}) {
  const { t } = useTranslation()
  const Icon = props.step.icon

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5',
        props.current && 'bg-accent'
      )}
      aria-current={props.current ? 'step' : undefined}
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-lg border-2',
          props.step.completed && 'border-success bg-success/10 text-success',
          !props.step.completed && props.current && 'border-edge bg-card',
          !props.step.completed &&
            !props.current &&
            'border-edge-soft text-muted-foreground'
        )}
      >
        {props.step.completed ? (
          <Check className='size-4' aria-hidden='true' />
        ) : (
          <span className='font-mono text-xs font-semibold tabular-nums'>
            {props.index + 1}
          </span>
        )}
      </span>

      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <span className='flex items-center gap-1.5 text-sm font-semibold'>
          <Icon
            className='text-muted-foreground size-3.5 shrink-0'
            aria-hidden='true'
          />
          <span className='truncate'>{props.step.title}</span>
        </span>
        <span className='text-muted-foreground text-xs leading-relaxed'>
          {props.step.description}
        </span>
      </div>

      {props.step.completed ? (
        <span className='text-success shrink-0 text-xs font-semibold'>
          {t('usage.guide.done')}
        </span>
      ) : (
        <Button
          size='sm'
          variant={props.current ? 'default' : 'outline'}
          className='shrink-0'
          render={<Link to={props.step.to} />}
        >
          {props.step.actionLabel}
        </Button>
      )}
    </li>
  )
}

function RequestPreview(props: { example: RequestExample }) {
  const { t } = useTranslation()
  const [isCopying, setIsCopying] = useState(false)
  const { copyToClipboard } = useCopyToClipboard({ notify: false })
  const baseUrl = toOpenAiBaseUrl(props.example.apiBaseUrl)
  const previewCurl = buildChatCurl({
    apiBaseUrl: props.example.apiBaseUrl,
    apiKey: props.example.displayKey,
    model: props.example.model,
  })
  const handleCopyRequest = async () => {
    if (!props.example.keyId || isCopying) return

    setIsCopying(true)
    try {
      const result = await fetchTokenKey(props.example.keyId)
      const key = result.success && result.data?.key ? result.data.key : ''
      if (!key) {
        handleServerError(result, t('Failed to copy to clipboard'))
        return
      }

      const realCurl = buildChatCurl({
        apiBaseUrl: props.example.apiBaseUrl,
        apiKey: `sk-${key}`,
        model: props.example.model,
      })
      const copied = await copyToClipboard(realCurl)
      if (copied) {
        toast.success(t('Copied to clipboard'))
      } else {
        toast.error(t('Failed to copy to clipboard'))
      }
    } catch (error) {
      handleServerError(error, t('Failed to copy to clipboard'))
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className='flex min-w-0 flex-col gap-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <TerminalSquare
            className='text-muted-foreground size-4 shrink-0'
            aria-hidden='true'
          />
          <div className='min-w-0'>
            <div className='truncate text-sm font-semibold'>
              {t('usage.guide.request.title')}
            </div>
            <div className='text-muted-foreground truncate text-xs'>
              {props.example.ready
                ? t('usage.guide.request.usingKey', {
                    name: props.example.keyName,
                  })
                : t('usage.guide.request.needKey')}
            </div>
          </div>
        </div>
        {props.example.ready && (
          <Button
            variant='outline'
            size='sm'
            className='shrink-0'
            disabled={isCopying}
            onClick={handleCopyRequest}
            aria-label={t('Copy ready-to-run curl')}
          >
            <Copy data-icon='inline-start' />
            {isCopying ? t('Loading') : t('usage.guide.request.copy')}
          </Button>
        )}
      </div>

      <div className='border-edge-soft flex min-w-0 items-center gap-2 rounded-lg border-2 py-1 pr-1 pl-3'>
        <span className='text-muted-foreground shrink-0 text-xs font-medium'>
          Base URL
        </span>
        <code className='min-w-0 flex-1 truncate font-mono text-xs'>
          {baseUrl}
        </code>
        <CopyButton
          value={baseUrl}
          variant='ghost'
          size='sm'
          className='size-7 shrink-0 p-0'
          iconClassName='size-3.5'
          tooltip={t('usage.guide.request.copyBaseUrl')}
          aria-label={t('usage.guide.request.copyBaseUrl')}
        />
      </div>

      <pre className='bg-muted text-muted-foreground rounded-lg p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap'>
        <code>{previewCurl}</code>
      </pre>
    </div>
  )
}

export function OverviewDashboard() {
  const { t } = useTranslation()
  const setupGuideId = useId()
  const setupGuideToggleRef = useRef<HTMLButtonElement>(null)
  const user = useAuthStore((state) => state.auth.user)
  const apiBaseUrl = useApiBaseUrl()
  const { items: apiInfoItems } = useApiInfo()
  const { items: announcementItems } = useAnnouncements()
  const { items: faqItems } = useFAQ()
  const {
    apiInfo: apiInfoEnabled,
    announcements: announcementsEnabled,
    faq: faqEnabled,
    uptimeKuma: uptimeEnabled,
  } = useDashboardContentVisibility()
  const uptimeQuery = useUptimeGroups(uptimeEnabled)
  const [manualSetupGuideExpanded, setManualSetupGuideExpanded] = useState<
    boolean | null
  >(() => getSavedSetupGuideExpanded())

  const requestCount = Number(user?.request_count ?? 0)
  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)

  const apiKeysQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'api-keys'],
    queryFn: async () => {
      const result = requireServerSuccess(await getApiKeys({ p: 1, size: 10 }))
      return result.success ? (result.data?.items ?? []) : []
    },
    staleTime: 60 * 1000,
  })

  const modelsQuery = useQuery({
    queryKey: ['dashboard', 'overview', 'user-models'],
    queryFn: async () => {
      const result = requireServerSuccess(await getUserModels())
      return result.success ? (result.data ?? []) : []
    },
    staleTime: 5 * 60 * 1000,
  })

  const preferredKey = useMemo(
    () => getPreferredKey(apiKeysQuery.data ?? []),
    [apiKeysQuery.data]
  )

  const startSteps = useMemo<StartStep[]>(
    () =>
      [
        {
          id: 'key',
          title: t('usage.guide.step.key.title'),
          description: t('usage.guide.step.key.description'),
          actionLabel: t('usage.guide.step.key.action'),
          to: '/keys' as const,
          icon: KeyRound,
          completed: Boolean(preferredKey),
        },
        {
          id: 'credits',
          title: t('usage.guide.step.credits.title'),
          description: t('usage.guide.step.credits.description'),
          actionLabel: t('usage.guide.step.credits.action'),
          to: '/wallet' as const,
          icon: CreditCard,
          completed: remainQuota > 0 || usedQuota > 0,
        },
        {
          id: 'request',
          title: t('usage.guide.step.request.title'),
          description: t('usage.guide.step.request.description'),
          actionLabel: t('usage.guide.step.request.action'),
          to: '/playground' as const,
          icon: TerminalSquare,
          completed: requestCount > 0,
        },
        // [user-ui] 功能开关：钱包禁用时去掉"充值"步骤
      ].filter(
        (step) => step.to !== '/wallet' || isUserUiFeatureEnabled('wallet')
      ),
    [preferredKey, remainQuota, requestCount, t, usedQuota]
  )

  // [user-ui] 引导底部的相关链接：不再重复"API 密钥"（已是第 1 步），新增"接入文档"
  const quickActions = useMemo<QuickAction[]>(
    () => [
      // [user-ui] "Channels" 快捷入口（管理员）已移除
      {
        title: t('usage.guide.links.docs'),
        to: '/docs',
        icon: BookOpen,
      },
      {
        title: t('usage.guide.links.logs'),
        to: '/usage-logs',
        icon: FileText,
      },
      {
        title: t('usage.guide.links.pricing'),
        to: '/pricing',
        icon: CreditCard,
      },
    ],
    [t]
  )

  const visibleQuickActions = useMemo(
    () =>
      quickActions
        .filter((action) => !action.adminOnly || isAdmin)
        // [user-ui] 功能开关：模型广场禁用时去掉"定价"快捷入口
        .filter(
          (action) =>
            action.to !== '/pricing' || isUserUiFeatureEnabled('pricing')
        ),
    [isAdmin, quickActions]
  )

  const requestExample = useMemo<RequestExample>(() => {
    const model = modelsQuery.data?.[0] ?? MODEL_PLACEHOLDER
    const keyName = preferredKey?.name ?? ''

    return {
      apiBaseUrl,
      model,
      keyName,
      keyId: preferredKey?.id,
      displayKey: preferredKey
        ? formatDisplayKey(`sk-${preferredKey.key}`)
        : 'sk-...',
      ready: Boolean(preferredKey?.id),
    }
  }, [apiBaseUrl, modelsQuery.data, preferredKey])

  const completedStepCount = startSteps.filter((step) => step.completed).length
  const setupComplete = completedStepCount === startSteps.length
  const nextStep = startSteps.find((step) => !step.completed)
  const setupStatusReady = apiKeysQuery.isFetched && Boolean(user)
  const setupGuideExpanded =
    manualSetupGuideExpanded ?? (setupStatusReady && !setupComplete)

  // [user-ui] 有内容才显示（审计 2.2 #7）
  const showApiInfoPanel = apiInfoEnabled && apiInfoItems.length > 0
  const showAnnouncementsPanel =
    announcementsEnabled && announcementItems.length > 0
  const showFAQPanel = faqEnabled && faqItems.length > 0
  const showUptimePanel = uptimeEnabled && (uptimeQuery.data?.length ?? 0) > 0
  const showContentPanels =
    isAdmin ||
    showAnnouncementsPanel ||
    showApiInfoPanel ||
    showFAQPanel ||
    showUptimePanel

  const handleSetupGuideToggle = () => {
    const nextExpanded = !setupGuideExpanded
    setManualSetupGuideExpanded(nextExpanded)
    saveSetupGuideExpanded(nextExpanded)
    if (!nextExpanded && setupComplete) {
      setupGuideToggleRef.current?.focus()
    }
  }

  const progressLabel = t('Setup progress: {{completed}}/{{total}}', {
    completed: completedStepCount,
    total: startSteps.length,
  })

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Overview')}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        {setupStatusReady && setupComplete && (
          <Button
            ref={setupGuideToggleRef}
            variant='ghost'
            size='sm'
            className='text-muted-foreground hover:text-foreground h-auto min-h-7 max-w-[60vw] whitespace-normal'
            aria-expanded={setupGuideExpanded}
            aria-controls={setupGuideId}
            onClick={handleSetupGuideToggle}
          >
            {t('Setup guide')}
          </Button>
        )}
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='flex flex-col gap-4'>
          <SummaryCards />

          <div id={setupGuideId} hidden={!setupGuideExpanded}>
            {setupGuideExpanded && (
              <CardStaggerContainer>
                <CardStaggerItem>
                  <Card className='gap-0 py-0'>
                    <div className='flex flex-col gap-4 p-4 sm:p-5'>
                      <div className='flex flex-wrap items-start justify-between gap-3'>
                        <div className='flex max-w-2xl flex-col gap-1'>
                          <div className='text-muted-foreground flex items-center gap-2 text-xs font-medium'>
                            <ListChecks
                              className='size-3.5'
                              aria-hidden='true'
                            />
                            {t('usage.guide.eyebrow')}
                            <span className='font-mono tabular-nums'>
                              {completedStepCount}/{startSteps.length}
                            </span>
                          </div>
                          <h3 className='text-lg font-semibold tracking-tight sm:text-xl'>
                            {t('usage.guide.title')}
                          </h3>
                          <p className='text-muted-foreground text-sm leading-relaxed'>
                            {t('usage.guide.description')}
                          </p>
                        </div>
                        <Button
                          variant='outline'
                          size='sm'
                          aria-expanded={setupGuideExpanded}
                          aria-controls={setupGuideId}
                          onClick={handleSetupGuideToggle}
                        >
                          <ChevronUp data-icon='inline-start' />
                          {t('Hide setup guide')}
                        </Button>
                      </div>

                      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]'>
                        <ol className='flex flex-col gap-1'>
                          {startSteps.map((step, index) => (
                            <StartStepItem
                              key={step.id}
                              step={step}
                              index={index}
                              current={step.id === nextStep?.id}
                            />
                          ))}
                        </ol>

                        <RequestPreview example={requestExample} />
                      </div>

                      {visibleQuickActions.length > 0 && (
                        <nav
                          aria-label={t('usage.guide.links.label')}
                          className='flex flex-wrap items-center gap-x-1 gap-y-1 border-t pt-3'
                        >
                          <span className='text-muted-foreground mr-2 text-xs'>
                            {t('usage.guide.links.label')}
                          </span>
                          {visibleQuickActions.map((action) => {
                            const Icon = action.icon
                            return (
                              <Button
                                key={action.to}
                                variant='ghost'
                                size='sm'
                                render={<Link to={action.to} />}
                              >
                                <Icon data-icon='inline-start' />
                                {action.title}
                              </Button>
                            )
                          })}
                        </nav>
                      )}
                    </div>
                  </Card>
                </CardStaggerItem>
              </CardStaggerContainer>
            )}
          </div>
          {!setupGuideExpanded && !setupComplete && (
            <CardStaggerContainer>
              <CardStaggerItem>
                <Card className='gap-0 py-0'>
                  <div className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5'>
                    <div className='flex min-w-0 items-center gap-3'>
                      <span className='border-edge-soft flex size-9 shrink-0 items-center justify-center rounded-lg border-2'>
                        <ListChecks className='size-4' aria-hidden='true' />
                      </span>
                      <div className='min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <h3 className='truncate text-sm font-semibold'>
                            {t('Setup guide')}
                          </h3>
                          <span className='text-muted-foreground rounded-sm border px-1.5 py-0.5 font-mono text-xs tabular-nums'>
                            {progressLabel}
                          </span>
                        </div>
                        <p className='text-muted-foreground line-clamp-2 text-xs'>
                          {t('Setup guide is collapsed. Expand it anytime.')}
                        </p>
                      </div>
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                      {nextStep && (
                        <Button size='sm' render={<Link to={nextStep.to} />}>
                          {nextStep.actionLabel}
                        </Button>
                      )}
                      <Button
                        variant='outline'
                        size='sm'
                        aria-expanded={setupGuideExpanded}
                        aria-controls={setupGuideId}
                        onClick={handleSetupGuideToggle}
                      >
                        <ChevronDown data-icon='inline-start' />
                        {t('Show setup guide')}
                      </Button>
                    </div>
                  </div>
                </Card>
              </CardStaggerItem>
            </CardStaggerContainer>
          )}

          {showContentPanels && (
            <CardStaggerContainer className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
              {isAdmin && (
                <CardStaggerItem className='lg:col-span-2'>
                  <PerformanceHealthPanel />
                </CardStaggerItem>
              )}
              {showAnnouncementsPanel && (
                <CardStaggerItem>
                  <AnnouncementsPanel />
                </CardStaggerItem>
              )}
              {showApiInfoPanel && (
                <CardStaggerItem>
                  <ApiInfoPanel />
                </CardStaggerItem>
              )}
              {showFAQPanel && (
                <CardStaggerItem>
                  <FAQPanel />
                </CardStaggerItem>
              )}
              {showUptimePanel && (
                <CardStaggerItem>
                  <UptimePanel />
                </CardStaggerItem>
              )}
            </CardStaggerContainer>
          )}
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
