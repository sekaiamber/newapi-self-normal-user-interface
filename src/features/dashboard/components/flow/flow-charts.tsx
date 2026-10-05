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
import { useQuery } from '@tanstack/react-query'
import { VChart } from '@visactor/react-vchart'
import type { EventParamsDefinition, IVChart } from '@visactor/vchart'
import {
  Activity,
  ChevronRight,
  CircleAlert,
  EyeOff,
  GitBranch,
  Hash,
  Info,
  Loader2,
  Route,
  WalletCards,
} from 'lucide-react'
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'

import { MultiSelect } from '@/components/multi-select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toggle } from '@/components/ui/toggle'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getFlowQuotaDates } from '@/features/dashboard/api'
import {
  buildDashboardFlowData,
  buildFlowSankeySpec,
  buildQueryParams,
  flowNodeFilterFromSankeyDatum,
  flowSankeyDatumValue,
  getDefaultDays,
  getFlowStages,
} from '@/features/dashboard/lib'
import {
  readChartPalette,
  readThemeColor,
} from '@/features/dashboard/lib/chart-palette'
import {
  compactFlowSelectionLabel,
  flowDisplayState,
  requireSuccessfulFlowRows,
} from '@/features/dashboard/lib/flow-selection'
import type {
  DashboardFilters,
  FlowLinkSelection,
  FlowMetric,
  FlowNodeFilter,
  FlowNodeKind,
  FlowOverflowMode,
  FlowRole,
} from '@/features/dashboard/types'
import { formatQuota } from '@/lib/format'
import { ROLE } from '@/lib/roles'
import { requireServerSuccess } from '@/lib/server-error-message'
import { computeTimeRange } from '@/lib/time'
import { useChartTheme } from '@/lib/use-chart-theme'
import { cn } from '@/lib/utils'
import { VCHART_OPTION } from '@/lib/vchart'
import { useAuthStore } from '@/stores/auth-store'

import { FlowNodeFilterControl } from './flow-node-filter'

interface FlowChartsProps {
  filters?: DashboardFilters
  // When false, sensitive node labels are masked in the rendered Sankey.
  sensitiveVisible?: boolean
}

// [user-ui] 度量名称改为用户说法：消耗 / Tokens / 请求次数（原"按额度"等）
const FLOW_METRIC_OPTIONS = [
  { value: 'quota', labelKey: 'usage.flow.metric.spend', icon: WalletCards },
  { value: 'tokens', labelKey: 'Tokens', icon: Hash },
  { value: 'requests', labelKey: 'usage.flow.metric.requests', icon: Activity },
] as const

const FLOW_METRIC_LABEL_KEYS: Record<FlowMetric, string> = {
  quota: 'usage.flow.metric.spend',
  tokens: 'Tokens',
  requests: 'usage.flow.metric.requests',
}

const FLOW_TOP_LIMIT_OPTIONS = [10, 20, 50, 100] as const

// [user-ui] 每列节点数都不超过最小的显示数量时，"显示数量"/"其余项目"两个控件不起作用，隐藏它们
const FLOW_MIN_TOP_LIMIT = Math.min(...FLOW_TOP_LIMIT_OPTIONS)

const DEFAULT_FLOW_TOP_NODE_LIMIT = 50

const FLOW_OVERFLOW_MODE_OPTIONS = [
  { value: 'aggregate', labelKey: 'Merge into Other' },
  { value: 'hide', labelKey: 'Hide' },
] as const

// A Sankey needs at least two columns to render any link.
const MIN_VISIBLE_STAGES = 2

const FLOW_STAGE_META: Record<
  FlowNodeKind,
  { labelKey: string; descKey: string }
> = {
  user: {
    labelKey: 'User',
    descKey: 'The user who made the requests',
  },
  node: {
    labelKey: 'Node',
    descKey: 'The deployment node that handled the requests',
  },
  // [user-ui] 列名与说明改为用户说法："令牌"统一叫"API 密钥"；后端的"分组"（default、vip…）
  // 用本包自己的 key 显示（owner 定为"分组 / Group"；以后改词只需改 usage.* 覆盖层一处），并说明它是什么
  token: {
    labelKey: 'usage.flow.stage.token',
    descKey: 'usage.flow.stage.tokenDescription',
  },
  group: {
    labelKey: 'usage.flow.stage.group',
    descKey: 'usage.flow.stage.groupDescription',
  },
  model: {
    labelKey: 'Model',
    descKey: 'usage.flow.stage.modelDescription',
  },
  channel: {
    labelKey: 'Channel',
    descKey: 'The upstream channel that served the requests',
  },
}

const FLOW_STAGE_LABEL_KEYS: Record<FlowNodeKind, string> = {
  user: FLOW_STAGE_META.user.labelKey,
  node: FLOW_STAGE_META.node.labelKey,
  token: FLOW_STAGE_META.token.labelKey,
  group: FLOW_STAGE_META.group.labelKey,
  model: FLOW_STAGE_META.model.labelKey,
  channel: FLOW_STAGE_META.channel.labelKey,
}

const FLOW_OTHER_NODE_LABEL_KEYS: Record<FlowNodeKind, string> = {
  user: 'Other users',
  node: 'Other nodes',
  token: 'usage.flow.other.tokens', // [user-ui] "其他密钥"
  group: 'usage.flow.other.groups', // [user-ui] "其他分组"，用词同上
  model: 'Other models',
  channel: 'Other channels',
}

type FlowChartPointerEvent = EventParamsDefinition['pointerdown']

function chartRecordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined
}

function looksLikeFlowDatum(value: unknown): boolean {
  const record = chartRecordValue(value)
  if (!record) return false
  return (
    (record.key !== undefined && record.kind !== undefined) ||
    (record.source !== undefined && record.target !== undefined)
  )
}

function chartGraphicDatum(value: unknown): unknown {
  const record = chartRecordValue(value)
  const context = chartRecordValue(record?.context)
  const data = context?.data
  if (Array.isArray(data)) return data[0]
  return data
}

function flowChartEventDatum(event: FlowChartPointerEvent): unknown {
  const record = chartRecordValue(event)
  if (!record) return undefined

  if (record.datum !== undefined && record.datum !== null) return record.datum

  const itemRecord = chartRecordValue(record.item)
  if (itemRecord?.datum !== undefined && itemRecord.datum !== null) {
    return itemRecord.datum
  }

  const graphicDatum = chartGraphicDatum(record.item)
  if (graphicDatum !== undefined && graphicDatum !== null) return graphicDatum

  const itemData = itemRecord?.data
  if (Array.isArray(itemData)) return itemData[0]
  if (itemData !== undefined && itemData !== null) return itemData

  return looksLikeFlowDatum(record) ? record : undefined
}

function flowNodeFilterKey(filter: FlowNodeFilter): string {
  return `${filter.kind}\u0000${filter.id}`
}

function isSameFlowNodeFilter(
  a: FlowNodeFilter | undefined,
  b: FlowNodeFilter
): boolean {
  return Boolean(a && a.kind === b.kind && a.id === b.id)
}

function toggleSelectedValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

function toggleSelectedNodeFilter(
  filters: FlowNodeFilter[],
  filter: FlowNodeFilter
): FlowNodeFilter[] {
  const key = flowNodeFilterKey(filter)
  const hasFilter = filters.some((item) => flowNodeFilterKey(item) === key)
  return hasFilter
    ? filters.filter((item) => flowNodeFilterKey(item) !== key)
    : [...filters, filter]
}

function formatFlowMetricNumber(value: number): string {
  return Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    value
  )
}

export function FlowCharts(props: FlowChartsProps) {
  const { t } = useTranslation()
  const { resolvedTheme, themeReady } = useChartTheme()
  const chartInstanceRef = useRef<IVChart | null>(null)
  const user = useAuthStore((state) => state.auth.user)
  const isRoot = Boolean(user?.role && user.role >= ROLE.SUPER_ADMIN)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)
  let flowRole: FlowRole = 'user'
  if (isRoot) {
    flowRole = 'root'
  } else if (isAdmin) {
    flowRole = 'admin'
  }
  const [metric, setMetric] = useState<FlowMetric>('quota')
  const [topNodeLimit, setTopNodeLimit] = useState(DEFAULT_FLOW_TOP_NODE_LIMIT)
  const [overflowMode, setOverflowMode] =
    useState<FlowOverflowMode>('aggregate')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedNodes, setSelectedNodes] = useState<FlowNodeFilter[]>([])
  const [activeFlowNode, setActiveFlowNode] = useState<
    FlowNodeFilter | undefined
  >()
  const [activeFlowLink, setActiveFlowLink] = useState<
    FlowLinkSelection | undefined
  >()
  // [user-ui] null = 用户还没手动切换过列；此时按数据自动决定（见下方 autoHiddenStages）
  const [hiddenStagesOverride, setHiddenStagesOverride] = useState<
    FlowNodeKind[] | null
  >(null)

  const timeRange = useMemo(
    () =>
      computeTimeRange(
        getDefaultDays(props.filters?.time_granularity),
        props.filters?.start_timestamp,
        props.filters?.end_timestamp
      ),
    [
      props.filters?.end_timestamp,
      props.filters?.start_timestamp,
      props.filters?.time_granularity,
    ]
  )
  const flowQueryParams = useMemo(
    () => buildQueryParams(timeRange, props.filters),
    [props.filters, timeRange]
  )

  const {
    data: flowRows,
    error: flowError,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ['dashboard', 'flow', flowQueryParams, flowRole],
    queryFn: async () =>
      requireServerSuccess(await getFlowQuotaDates(flowQueryParams, isAdmin)),
    select: (res) =>
      requireSuccessfulFlowRows(res, t('Please try again later.')),
    staleTime: 60_000,
  })

  const stages = useMemo(() => getFlowStages(flowRole), [flowRole])
  // [user-ui] 只有一个分组时"分组"列没有信息量（且是计费概念，审计 2.4 #1），默认隐藏；
  // 用户仍可点列名把它显示出来
  const autoHiddenStages = useMemo<FlowNodeKind[]>(() => {
    if (!stages.includes('group') || !flowRows?.length) return []
    const groups = new Set(flowRows.map((row) => row.use_group ?? ''))
    return groups.size <= 1 ? ['group'] : []
  }, [flowRows, stages])
  const hiddenStages = hiddenStagesOverride ?? autoHiddenStages
  const visibleStages = useMemo(
    () => stages.filter((stage) => !hiddenStages.includes(stage)),
    [stages, hiddenStages]
  )
  useEffect(() => {
    const visible = new Set(visibleStages)
    setSelectedNodes((prev) => {
      const next = prev.filter((filter) => visible.has(filter.kind))
      return next.length === prev.length ? prev : next
    })
    setActiveFlowNode((prev) =>
      prev && visible.has(prev.kind) ? prev : undefined
    )
    // The graph reshapes when columns are toggled, so any highlighted edge may
    // no longer exist. Drop the link selection rather than leave it dangling.
    setActiveFlowLink(undefined)
  }, [visibleStages])
  const toggleStage = (stage: FlowNodeKind) => {
    const hidden = new Set(hiddenStages)
    if (hidden.has(stage)) {
      hidden.delete(stage)
    } else {
      const remaining = stages.filter((item) => !hidden.has(item)).length
      if (remaining <= MIN_VISIBLE_STAGES) return
      hidden.add(stage)
    }
    setHiddenStagesOverride(stages.filter((item) => hidden.has(item)))
  }

  const maskSensitive = props.sensitiveVisible === false
  // [user-ui] 节点配色与标签文字颜色取自主题 token（明暗两套），主题切换完成后重新读取
  const chartPalette = useMemo(
    () => (themeReady ? (readChartPalette() ?? undefined) : undefined),
    [themeReady]
  )
  const chartLabelColor = useMemo(
    () => (themeReady ? readThemeColor('--muted-foreground') : null),
    [themeReady]
  )
  // [user-ui] 没有关联密钥的调用（token_id 为 0）官方显示英文 "Unknown Token"，这里换成可翻译的说明
  const displayRows = useMemo(
    () =>
      (flowRows ?? []).map((row) =>
        !row.token_name && !(Number(row.token_id) > 0)
          ? { ...row, token_name: t('usage.flow.noKey') }
          : row
      ),
    [flowRows, t]
  )
  const flowData = useMemo(
    () =>
      buildDashboardFlowData(isLoading ? [] : displayRows, metric, {
        role: flowRole,
        colorPalette: chartPalette,
        selectedUsers,
        selectedNodes,
        activeNode: activeFlowNode,
        activeLink: activeFlowLink,
        visibleStages,
        topNodeLimit,
        overflowMode,
        maskSensitive,
        deletedTokenLabel: (tokenId) => t('Deleted ({{id}})', { id: tokenId }),
        otherNodeLabel: (kind) => t(FLOW_OTHER_NODE_LABEL_KEYS[kind]),
      }),
    [
      chartPalette,
      displayRows,
      flowRole,
      isLoading,
      metric,
      overflowMode,
      activeFlowNode,
      activeFlowLink,
      selectedNodes,
      selectedUsers,
      topNodeLimit,
      visibleStages,
      maskSensitive,
      t,
    ]
  )
  const userFilterOptions = useMemo(
    () =>
      flowData.filterOptions.users.map((user) => ({
        label: `${user.label} · ${user.valueLabel}`,
        value: user.value,
      })),
    [flowData.filterOptions.users]
  )
  const nodeFilterStages = useMemo(
    () => visibleStages.filter((stage) => stage !== 'user'),
    [visibleStages]
  )
  const nodeFilterOptions = useMemo(
    () =>
      flowData.filterOptions.nodes.filter((option) => option.kind !== 'user'),
    [flowData.filterOptions.nodes]
  )
  // [user-ui] 有数据才显示控件；每列节点都不超过最小显示数量时隐藏"显示数量"/"其余项目"
  const showFlowControls = (flowRows?.length ?? 0) > 0
  const showNodeLimitControls = useMemo(() => {
    const counts = new Map<FlowNodeKind, number>()
    for (const option of flowData.filterOptions.nodes) {
      counts.set(option.kind, (counts.get(option.kind) ?? 0) + 1)
    }
    counts.set('user', flowData.filterOptions.users.length)
    return visibleStages.some(
      (stage) => (counts.get(stage) ?? 0) > FLOW_MIN_TOP_LIMIT
    )
  }, [flowData.filterOptions, visibleStages])
  const metricLabel = t(FLOW_METRIC_LABEL_KEYS[metric])
  const formatNodeMetricValue = useCallback(
    (value: number) =>
      metric === 'quota' ? formatQuota(value) : formatFlowMetricNumber(value),
    [metric]
  )
  // Explicit filters (the chips/dropdown control) narrow the rows that feed the
  // chart. They are intentionally independent from the click-to-highlight state
  // below so selecting a filter never dims a node, it removes unrelated rows.
  const toggleFlowNodeFilter = useCallback((filter: FlowNodeFilter) => {
    if (filter.kind === 'user') {
      setSelectedUsers((prev) => toggleSelectedValue(prev, filter.id))
      return
    }
    setSelectedNodes((prev) => toggleSelectedNodeFilter(prev, filter))
  }, [])
  const removeFlowNodeFilter = useCallback((filter: FlowNodeFilter) => {
    if (filter.kind === 'user') {
      setSelectedUsers((prev) => prev.filter((item) => item !== filter.id))
      return
    }
    const key = flowNodeFilterKey(filter)
    setSelectedNodes((prev) =>
      prev.filter((item) => flowNodeFilterKey(item) !== key)
    )
  }, [])
  const clearFlowNodeFilters = useCallback(() => {
    setSelectedNodes([])
  }, [])
  // Clicking a node only drives the highlight: keep every node/link on screen
  // but emphasize the full paths through the clicked node and dim the rest.
  // Clicking the active node again, or clicking empty space, clears it.
  const handleChartPointerDown = useCallback((event: FlowChartPointerEvent) => {
    const datum = flowChartEventDatum(event)
    const filter = flowNodeFilterFromSankeyDatum(datum)
    if (filter) {
      setActiveFlowLink(undefined)
      setActiveFlowNode((prev) =>
        isSameFlowNodeFilter(prev, filter) ? undefined : filter
      )
      return
    }

    const source = flowSankeyDatumValue(datum, 'source')
    const target = flowSankeyDatumValue(datum, 'target')
    if (typeof source === 'string' && typeof target === 'string') {
      setActiveFlowNode(undefined)
      setActiveFlowLink((prev) =>
        prev && prev.source === source && prev.target === target
          ? undefined
          : { source, target }
      )
      return
    }

    setActiveFlowNode(undefined)
    setActiveFlowLink(undefined)
    chartInstanceRef.current?.clearState('selected')
    chartInstanceRef.current?.clearState('blur')
  }, [])
  // [user-ui] 图表标题说清楚内容（原"分流"）
  const chartTitle = t('usage.flow.title')
  const flowSpec = useMemo(
    () =>
      buildFlowSankeySpec(flowData.flow, chartTitle, formatQuota, {
        quota: t('usage.flow.metric.spend'),
        tokens: t('Tokens'),
        requests: t('usage.flow.metric.requests'),
        share: t('Share'),
      }),
    [chartTitle, flowData.flow, t]
  )
  const chartTheme = resolvedTheme === 'dark' ? 'dark' : 'light'
  const chartKey = [
    metric,
    topNodeLimit,
    overflowMode,
    flowRole,
    activeFlowNode ? flowNodeFilterKey(activeFlowNode) : '',
    activeFlowLink
      ? `${activeFlowLink.source}\u0000${activeFlowLink.target}`
      : '',
    selectedNodes.map(flowNodeFilterKey).join(','),
    selectedUsers.join(','),
    visibleStages.join(','),
    maskSensitive ? 'masked' : 'plain',
    flowRows?.length ?? 0,
    resolvedTheme,
  ].join('-')
  const displayState = flowDisplayState({
    isLoading,
    isError,
    linkCount: flowData.flow.links.length,
    themeReady,
  })
  const flowErrorMessage =
    flowError instanceof Error
      ? flowError.message
      : t('Please try again later.')
  let chartContent = (
    <VChart
      key={`flow-${chartKey}`}
      spec={{
        ...flowSpec,
        // [user-ui] 标签文字用主题色（官方写死的 #475569 在暗色下对比度不足）
        label:
          chartLabelColor == null
            ? flowSpec.label
            : {
                ...flowSpec.label,
                style: { ...flowSpec.label?.style, fill: chartLabelColor },
              },
        theme: chartTheme,
        background: 'transparent',
      }}
      option={VCHART_OPTION}
      onReady={(instance: IVChart) => {
        chartInstanceRef.current = instance
      }}
      onPointerDown={handleChartPointerDown}
    />
  )
  if (displayState === 'loading') {
    chartContent = <Skeleton className='h-full w-full' />
  } else if (displayState === 'error') {
    chartContent = (
      <div className='flex h-full items-center justify-center p-4'>
        <Alert variant='destructive' className='max-w-md'>
          <CircleAlert />
          <AlertTitle>{t('Failed to load')}</AlertTitle>
          <AlertDescription>{flowErrorMessage}</AlertDescription>
        </Alert>
      </div>
    )
  } else if (displayState === 'empty') {
    chartContent = (
      <Empty className='h-full border-0 py-12'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Route />
          </EmptyMedia>
          {/* [user-ui] 原为两行重复的"暂无数据"，改为说明原因（审计 2.4 #3） */}
          <EmptyTitle>{t('usage.stats.empty.title')}</EmptyTitle>
          <EmptyDescription>
            {t('usage.flow.emptyDescription')}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className='flex flex-col gap-3'>
      {/* [user-ui] 没有任何数据时不显示这些控件（它们对空图不起作用） */}
      {showFlowControls && (
        <div className='flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between'>
          <div className='flex min-w-0 flex-wrap items-end gap-2'>
            <div className='flex min-w-0 flex-col gap-1.5'>
              <div className='flex items-center gap-1.5'>
                <span className='text-muted-foreground text-xs font-medium'>
                  {t('usage.flow.metric.label')}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type='button'
                          className='text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded-md'
                          aria-label={t('usage.flow.metric.label')}
                        />
                      }
                    >
                      <Info className='size-3.5' />
                    </TooltipTrigger>
                    <TooltipContent className='max-w-[14rem]'>
                      {t('usage.flow.metric.hint')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Tabs
                value={metric}
                onValueChange={(value) => setMetric(value as FlowMetric)}
                className='shrink-0'
              >
                <TabsList aria-label={t('usage.flow.metric.label')}>
                  {FLOW_METRIC_OPTIONS.map((option) => {
                    const Icon = option.icon
                    return (
                      <TabsTrigger
                        key={option.value}
                        value={option.value}
                        className='gap-1.5 px-2.5 text-xs'
                      >
                        <Icon data-icon='inline-start' aria-hidden='true' />
                        {t(option.labelKey)}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>
            </div>

            {showNodeLimitControls && (
              <>
                <div className='flex min-w-0 flex-col gap-1.5'>
                  <span className='text-muted-foreground text-xs font-medium'>
                    {t('usage.flow.limit.label')}
                  </span>
                  <Tabs
                    value={String(topNodeLimit)}
                    onValueChange={(value) => setTopNodeLimit(Number(value))}
                    className='shrink-0'
                  >
                    <TabsList aria-label={t('usage.flow.limit.label')}>
                      {FLOW_TOP_LIMIT_OPTIONS.map((limit) => (
                        <TabsTrigger
                          key={limit}
                          value={String(limit)}
                          className='px-2.5 text-xs'
                        >
                          {t('Top {{count}}', { count: limit })}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>

                <div className='flex min-w-0 flex-col gap-1.5'>
                  <span className='text-muted-foreground text-xs font-medium'>
                    {t('usage.flow.overflow.label')}
                  </span>
                  <Tabs
                    value={overflowMode}
                    onValueChange={(value) =>
                      setOverflowMode(value as FlowOverflowMode)
                    }
                    className='shrink-0'
                  >
                    <TabsList aria-label={t('usage.flow.overflow.label')}>
                      {FLOW_OVERFLOW_MODE_OPTIONS.map((option) => (
                        <TabsTrigger
                          key={option.value}
                          value={option.value}
                          className='px-2.5 text-xs'
                        >
                          {t(option.labelKey)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </>
            )}

            <FlowNodeFilterControl
              stages={nodeFilterStages}
              stageLabels={FLOW_STAGE_LABEL_KEYS}
              metricLabel={metricLabel}
              formatMetricValue={formatNodeMetricValue}
              options={nodeFilterOptions}
              selectedNodes={selectedNodes}
              onToggleNode={toggleFlowNodeFilter}
              onRemoveNode={removeFlowNodeFilter}
              onClearNodes={clearFlowNodeFilters}
            />
          </div>

          <div className='flex min-w-0 items-center gap-2 xl:justify-end'>
            {isAdmin && (
              <div className='flex min-w-0 flex-col gap-2 sm:flex-row xl:w-[min(24rem,34vw)]'>
                <MultiSelect
                  options={userFilterOptions}
                  selected={selectedUsers}
                  onChange={setSelectedUsers}
                  placeholder={t('All users')}
                  emptyText={t('No users')}
                  maxVisibleChips={2}
                  renderSelectedSummary={(values) =>
                    compactFlowSelectionLabel(values.length)
                  }
                />
              </div>
            )}
            {isLoading && (
              <Loader2 className='text-muted-foreground size-4 animate-spin' />
            )}
          </div>
        </div>
      )}

      {/* [user-ui] 品牌 2px 边卡片 */}
      <div className='bg-card border-edge-soft overflow-hidden rounded-lg border-2'>
        <div className='flex w-full flex-col gap-2 border-b px-3 py-2 sm:px-5 sm:py-3 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex min-w-0 items-center gap-2'>
            <IconBadge tone='info' size='sm'>
              <GitBranch />
            </IconBadge>
            <div className='text-sm font-semibold'>{chartTitle}</div>
          </div>
          <TooltipProvider>
            <div className='flex min-w-0 items-center gap-1 overflow-x-auto pb-1 lg:justify-end lg:pb-0'>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type='button'
                      className='text-muted-foreground hover:text-foreground flex size-6 shrink-0 items-center justify-center rounded-md'
                      aria-label={t('Show or hide flow columns')}
                    />
                  }
                >
                  <Info className='size-3.5' />
                </TooltipTrigger>
                <TooltipContent className='max-w-[16rem]'>
                  {t('Click a stage to show or hide that column')}
                </TooltipContent>
              </Tooltip>
              {stages.map((stage, index) => {
                const meta = FLOW_STAGE_META[stage]
                const visible = !hiddenStages.includes(stage)
                return (
                  <Fragment key={stage}>
                    {index > 0 && (
                      <ChevronRight className='text-muted-foreground/40 size-3.5 shrink-0' />
                    )}
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Toggle
                            variant='outline'
                            size='sm'
                            pressed={visible}
                            onPressedChange={() => toggleStage(stage)}
                            aria-label={t(meta.labelKey)}
                            className={cn('shrink-0', !visible && 'opacity-50')}
                          />
                        }
                      >
                        {!visible && <EyeOff className='size-3' />}
                        {t(meta.labelKey)}
                      </TooltipTrigger>
                      <TooltipContent>{t(meta.descKey)}</TooltipContent>
                    </Tooltip>
                  </Fragment>
                )
              })}
            </div>
          </TooltipProvider>
        </div>
        {/* [user-ui] 窄屏下三列桑基图的标签会互相遮挡：给图一个最小宽度，横向滚动查看；
            空状态不需要整张图的高度 */}
        <div className='overflow-x-auto'>
          <div
            className={
              displayState === 'empty'
                ? 'h-72 p-1.5 sm:p-2'
                : 'h-[520px] min-w-[640px] p-1.5 sm:h-[680px] sm:min-w-0 sm:p-2 2xl:h-[760px]'
            }
          >
            {chartContent}
          </div>
        </div>
      </div>
    </div>
  )
}
