/*
 * [user-ui] 用量统计当前时间范围的文字描述（本仓库新增文件，非官方代码）。
 *
 * 官方页面上任何地方都不显示当前统计的时间范围，只能打开"筛选"弹窗查看（审计 2.3 #1）。
 * 这里把已应用的筛选条件转成一句短文字，显示在时间范围按钮上，例如"近 24 小时 · 按小时"。
 */
import { TIME_RANGE_PRESETS } from '@/features/dashboard/constants'
import type { DashboardFilters } from '@/features/dashboard/types'
import dayjs from '@/lib/dayjs'
import type { TimeGranularity } from '@/lib/time'

type Translate = (key: string, options?: Record<string, unknown>) => string

const DAY_MS = 86_400_000

const GRANULARITY_LABEL_KEYS: Record<TimeGranularity, string> = {
  hour: 'usage.stats.range.byHour',
  day: 'usage.stats.range.byDay',
  week: 'usage.stats.range.byWeek',
}

/** 已应用的范围正好是某个快捷预设（1/7/14/29 天）时返回天数，否则返回 null。 */
export function matchRangePresetDays(
  filters: DashboardFilters | undefined
): number | null {
  const start = filters?.start_timestamp
  const end = filters?.end_timestamp
  if (!start || !end) return null
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS)
  return TIME_RANGE_PRESETS.some((preset) => preset.days === days) ? days : null
}

export function describeDashboardRange(
  filters: DashboardFilters | undefined,
  t: Translate
): string {
  const presetDays = matchRangePresetDays(filters)
  let range: string
  if (presetDays === 1) {
    range = t('usage.stats.range.last24h')
  } else if (presetDays !== null) {
    range = t('usage.stats.range.lastDays', { count: presetDays })
  } else if (filters?.start_timestamp && filters.end_timestamp) {
    range = `${dayjs(filters.start_timestamp).format('MM-DD HH:mm')} – ${dayjs(
      filters.end_timestamp
    ).format('MM-DD HH:mm')}`
  } else {
    range = t('usage.stats.range.default')
  }

  const granularity = filters?.time_granularity
  if (!granularity) return range
  return `${range} · ${t(GRANULARITY_LABEL_KEYS[granularity])}`
}
