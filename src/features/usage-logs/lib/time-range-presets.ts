/*
 * [user-ui] 日志时间范围的快捷预设（本仓库新增文件，非官方代码）。
 *
 * Shared by the range picker (preset buttons + preset name on the trigger)
 * and the empty states ("show the last 30 days"). The ranges are the ones the
 * upstream picker used inline (web/src/features/usage-logs/components/
 * compact-date-time-range-picker.tsx @ v1.0.0-rc.37), moved here unchanged.
 */
import dayjs from '@/lib/dayjs'

export type RangePresetKind = 'today' | '7d' | 'week' | '30d' | 'month'

export const RANGE_PRESETS: ReadonlyArray<{
  kind: RangePresetKind
  /** Label on the preset button inside the picker popover. */
  buttonKey: string
  /** Name shown on the picker trigger when the range equals this preset. */
  nameKey: string
}> = [
  { kind: 'today', buttonKey: 'Today', nameKey: 'Today' },
  { kind: '7d', buttonKey: '7 Days', nameKey: 'logs.range.last7Days' },
  { kind: 'week', buttonKey: 'This week', nameKey: 'This week' },
  { kind: '30d', buttonKey: '30 Days', nameKey: 'logs.range.last30Days' },
  { kind: 'month', buttonKey: 'Current month', nameKey: 'Current month' },
]

export function getPresetRange(kind: RangePresetKind): {
  start: Date
  end: Date
} {
  const now = dayjs()
  switch (kind) {
    case 'today':
      return {
        start: now.startOf('day').toDate(),
        end: now.endOf('day').toDate(),
      }
    case '7d':
      return {
        start: now.subtract(6, 'day').startOf('day').toDate(),
        end: now.endOf('day').toDate(),
      }
    case 'week':
      return {
        start: now.startOf('week').toDate(),
        end: now.endOf('week').toDate(),
      }
    case '30d':
      return {
        start: now.subtract(29, 'day').startOf('day').toDate(),
        end: now.endOf('day').toDate(),
      }
    case 'month':
      return {
        start: now.startOf('month').toDate(),
        end: now.endOf('month').toDate(),
      }
  }
}

/**
 * Returns the preset whose range equals [start, end] at minute precision (the
 * picker inputs only keep minutes), or undefined for a custom range.
 */
export function matchRangePreset(
  start?: Date,
  end?: Date
): RangePresetKind | undefined {
  if (!start || !end) return undefined
  return RANGE_PRESETS.find(({ kind }) => {
    const range = getPresetRange(kind)
    return (
      dayjs(start).isSame(range.start, 'minute') &&
      dayjs(end).isSame(range.end, 'minute')
    )
  })?.kind
}
