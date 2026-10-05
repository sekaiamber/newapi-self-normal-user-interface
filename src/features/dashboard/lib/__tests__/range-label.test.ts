/*
 * [user-ui] 用量统计时间范围文字的测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import { describeDashboardRange, matchRangePresetDays } from '../range-label'

const t = (key: string, options?: Record<string, unknown>) =>
  options?.count === undefined ? key : `${key}:${String(options.count)}`

const END = new Date(2026, 9, 5, 12, 0)

function daysBefore(days: number): Date {
  return new Date(END.getTime() - days * 86_400_000)
}

describe('describeDashboardRange', () => {
  it('names a one-day preset as the last 24 hours with its granularity', () => {
    expect(
      describeDashboardRange(
        {
          start_timestamp: daysBefore(1),
          end_timestamp: END,
          time_granularity: 'hour',
        },
        t
      )
    ).toBe('usage.stats.range.last24h · usage.stats.range.byHour')
  })

  it('names multi-day presets by their day count', () => {
    expect(
      describeDashboardRange(
        {
          start_timestamp: daysBefore(7),
          end_timestamp: END,
          time_granularity: 'day',
        },
        t
      )
    ).toBe('usage.stats.range.lastDays:7 · usage.stats.range.byDay')
  })

  it('shows the exact dates for a custom range', () => {
    expect(
      describeDashboardRange(
        {
          start_timestamp: new Date(2026, 9, 1, 8, 30),
          end_timestamp: END,
          time_granularity: 'week',
        },
        t
      )
    ).toBe('10-01 08:30 – 10-05 12:00 · usage.stats.range.byWeek')
  })

  it('falls back to the default label when no range is applied', () => {
    expect(describeDashboardRange(undefined, t)).toBe(
      'usage.stats.range.default'
    )
  })
})

describe('matchRangePresetDays', () => {
  it('returns null when the range does not match a preset', () => {
    expect(
      matchRangePresetDays({
        start_timestamp: daysBefore(3),
        end_timestamp: END,
      })
    ).toBeNull()
  })
})
