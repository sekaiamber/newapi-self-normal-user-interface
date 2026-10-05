/*
 * [user-ui] "密钥已创建"对话框（本仓库新增文件，非官方代码）。
 *
 * 审计 2.5 K1：创建成功后直接给出用户接入需要的全部信息——完整密钥、接口地址
 * （useApiBaseUrl / toOpenAiBaseUrl）、可复制的 curl 示例（buildChatCurl），
 * 以及已有的一键接入入口（CC Switch、聊天应用预设）。批量创建时列出全部密钥。
 * 创建接口不返回新密钥，按名称找回（见 ../lib/created-keys.ts）；完整密钥通过
 * provider 的 resolveRealKey 获取，与列表里的复制按钮共用缓存。
 */
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronDown, ExternalLink, Loader2, Terminal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Dialog } from '@/components/dialog'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { getUserModels } from '@/lib/api'
import {
  buildChatCurl,
  toOpenAiBaseUrl,
  useApiBaseUrl,
} from '@/lib/api-endpoint'
import { requireServerSuccess } from '@/lib/server-error-message'

import { useChatPresetLauncher } from '../hooks/use-chat-preset-launcher'
import { locateCreatedApiKeys } from '../lib/created-keys'
import type { ApiKey } from '../types'
import { useApiKeys } from './api-keys-provider'
import { CCSwitchDialog } from './dialogs/cc-switch-dialog'

/** 没有任何可用模型时 curl 示例里的占位模型名。 */
const MODEL_PLACEHOLDER = 'your-model-name'

type CreatedKey = { apiKey: ApiKey; fullKey: string | null }

function pickExampleModel(apiKey: ApiKey, models: readonly string[]): string {
  if (apiKey.model_limits_enabled && apiKey.model_limits) {
    const limited = apiKey.model_limits.split(',').find(Boolean)
    if (limited) return limited
  }
  return models[0] ?? MODEL_PLACEHOLDER
}

function CopyField(props: {
  label: string
  value: string
  copyLabel: string
  hint?: ReactNode
  multiline?: boolean
}) {
  return (
    <div className='space-y-1.5'>
      <div className='text-sm font-semibold'>{props.label}</div>
      <div className='border-edge-soft bg-muted/40 flex items-start gap-2 rounded-lg border-2 py-1.5 pr-1.5 pl-3'>
        {props.multiline ? (
          <pre className='min-w-0 flex-1 overflow-x-auto py-1 font-mono text-xs leading-relaxed whitespace-pre'>
            {props.value}
          </pre>
        ) : (
          <code className='min-w-0 flex-1 py-1 font-mono text-sm break-all'>
            {props.value}
          </code>
        )}
        <CopyButton
          value={props.value}
          variant='ghost'
          size='icon'
          className='size-8'
          tooltip={props.copyLabel}
          aria-label={props.copyLabel}
        />
      </div>
      {props.hint && (
        <p className='text-muted-foreground text-xs leading-relaxed'>
          {props.hint}
        </p>
      )}
    </div>
  )
}

function SingleKeyDetails(props: { created: CreatedKey; apiBaseUrl: string }) {
  const { t } = useTranslation()
  const { presets, launch } = useChatPresetLauncher()
  const [ccSwitchOpen, setCcSwitchOpen] = useState(false)
  const { data: models } = useQuery({
    queryKey: ['user-models'],
    queryFn: async () => requireServerSuccess(await getUserModels()),
    select: (res) => res.data ?? [],
  })

  const fullKey = props.created.fullKey
  const openAiBaseUrl = toOpenAiBaseUrl(props.apiBaseUrl)

  return (
    <div className='space-y-5'>
      {fullKey ? (
        <CopyField
          label={t('API Key')}
          value={fullKey}
          copyLabel={t('keys.created.copyKey')}
          hint={t('keys.created.keyHint')}
        />
      ) : (
        <p className='border-warning/40 bg-warning/10 text-warning rounded-lg border-2 px-3 py-2 text-sm'>
          {t('keys.created.keyUnavailable')}
        </p>
      )}

      <CopyField
        label={t('keys.created.baseUrlLabel')}
        value={openAiBaseUrl}
        copyLabel={t('keys.page.copyBaseUrl')}
        hint={t('keys.created.baseUrlHint', { root: props.apiBaseUrl })}
      />

      {fullKey && (
        <CopyField
          label={t('keys.created.curlLabel')}
          value={buildChatCurl({
            apiBaseUrl: props.apiBaseUrl,
            apiKey: fullKey,
            model: pickExampleModel(props.created.apiKey, models ?? []),
          })}
          copyLabel={t('keys.created.copyCurl')}
          multiline
        />
      )}

      {fullKey && (
        <section className='space-y-2'>
          <h4 className='text-sm font-semibold'>
            {t('keys.created.oneClickTitle')}
          </h4>
          <div className='flex flex-wrap gap-2'>
            <Button variant='outline' onClick={() => setCcSwitchOpen(true)}>
              <Terminal />
              {t('keys.menu.cliTools')}
            </Button>
            {presets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant='outline' />}>
                  {t('keys.menu.chatApps')}
                  <ChevronDown />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-56'>
                  {presets.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      onClick={() => launch(preset, fullKey)}
                    >
                      {preset.name}
                      {preset.type !== 'web' && (
                        <DropdownMenuShortcut>
                          <ExternalLink size={16} />
                        </DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <p className='text-muted-foreground text-xs'>
            {t('keys.created.oneClickHint')}
          </p>
          <CCSwitchDialog
            open={ccSwitchOpen}
            onOpenChange={setCcSwitchOpen}
            tokenKey={fullKey}
          />
        </section>
      )}
    </div>
  )
}

function BatchKeyDetails(props: { created: CreatedKey[]; apiBaseUrl: string }) {
  const { t } = useTranslation()
  const lines = props.created.flatMap((item) =>
    item.fullKey ? [`${item.apiKey.name}\t${item.fullKey}`] : []
  )

  return (
    <div className='space-y-5'>
      <div className='space-y-1.5'>
        <div className='flex items-center justify-between gap-2'>
          <div className='text-sm font-semibold'>{t('API Keys')}</div>
          {lines.length > 0 && (
            <CopyButton
              value={lines.join('\n')}
              variant='outline'
              size='sm'
              aria-label={t('keys.created.copyAll')}
            >
              {t('keys.created.copyAll')}
            </CopyButton>
          )}
        </div>
        <ul className='border-edge-soft divide-border divide-y rounded-lg border-2'>
          {props.created.map((item) => (
            <li
              key={item.apiKey.id}
              className='flex items-center gap-2 py-1.5 pr-1.5 pl-3'
            >
              <span className='w-28 shrink-0 truncate text-sm font-medium sm:w-36'>
                {item.apiKey.name}
              </span>
              <code className='text-muted-foreground min-w-0 flex-1 truncate font-mono text-xs'>
                {item.fullKey ?? `sk-${item.apiKey.key}`}
              </code>
              {item.fullKey && (
                <CopyButton
                  value={item.fullKey}
                  className='size-8'
                  aria-label={t('keys.created.copyKey')}
                />
              )}
            </li>
          ))}
        </ul>
        <p className='text-muted-foreground text-xs'>
          {t('keys.created.keyHint')}
        </p>
      </div>
      <CopyField
        label={t('keys.created.baseUrlLabel')}
        value={toOpenAiBaseUrl(props.apiBaseUrl)}
        copyLabel={t('keys.page.copyBaseUrl')}
        hint={t('keys.created.baseUrlHint', { root: props.apiBaseUrl })}
      />
    </div>
  )
}

export function ApiKeyCreatedDialog() {
  const { t } = useTranslation()
  const { open, setOpen, createdBatch, resolveRealKey, resolveRealKeysBatch } =
    useApiKeys()
  const apiBaseUrl = useApiBaseUrl()
  const isOpen = open === 'created' && createdBatch !== null
  const requestedCount = createdBatch?.names.length ?? 0

  const { data: created, isPending } = useQuery({
    queryKey: ['api-keys', 'created', createdBatch?.id],
    enabled: isOpen,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    retry: false,
    queryFn: async (): Promise<CreatedKey[]> => {
      const located = await locateCreatedApiKeys(createdBatch?.names ?? [])
      if (located.length === 1) {
        const fullKey = await resolveRealKey(located[0].id)
        return [{ apiKey: located[0], fullKey }]
      }
      if (located.length === 0) return []
      const keys = await resolveRealKeysBatch(located.map((item) => item.id))
      return located.map((item) => ({
        apiKey: item,
        fullKey: keys[item.id] ?? null,
      }))
    },
  })

  let body: ReactNode
  if (isPending) {
    body = (
      <div className='text-muted-foreground flex items-center gap-2 py-6 text-sm'>
        <Loader2 className='size-4 animate-spin motion-reduce:animate-none' />
        {t('keys.created.loading')}
      </div>
    )
  } else if (!created || created.length === 0) {
    body = (
      <div className='space-y-5'>
        <p className='border-warning/40 bg-warning/10 text-warning rounded-lg border-2 px-3 py-2 text-sm'>
          {t('keys.created.keyUnavailable')}
        </p>
        <CopyField
          label={t('keys.created.baseUrlLabel')}
          value={toOpenAiBaseUrl(apiBaseUrl)}
          copyLabel={t('keys.page.copyBaseUrl')}
          hint={t('keys.created.baseUrlHint', { root: apiBaseUrl })}
        />
      </div>
    )
  } else if (requestedCount > 1) {
    body = <BatchKeyDetails created={created} apiBaseUrl={apiBaseUrl} />
  } else {
    body = <SingleKeyDetails created={created[0]} apiBaseUrl={apiBaseUrl} />
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) setOpen(null)
      }}
      title={
        requestedCount > 1
          ? t('keys.created.titleBatch', { count: requestedCount })
          : t('keys.created.title')
      }
      description={t('keys.created.description')}
      contentClassName='sm:max-w-xl'
      footer={
        <>
          {/* 用链接语义（不是按钮），外观沿用 outline 按钮 */}
          <Link to='/docs' className={buttonVariants({ variant: 'outline' })}>
            {t('keys.created.docs')}
          </Link>
          <Button onClick={() => setOpen(null)}>
            {t('keys.created.done')}
          </Button>
        </>
      }
    >
      {body}
    </Dialog>
  )
}
