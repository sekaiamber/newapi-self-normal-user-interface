/*
 * [user-ui] 日志默认时间范围与快捷预设测试（本仓库新增文件，非官方代码）。
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getPresetRange, matchRangePreset } from '../time-range-presets'
import { getDefaultTimeRange } from '../utils'

afterEach(() => {
  vi.useRealTimers()
})

describe('log time range defaults', () => {
  it('defaults to the last 7 calendar days including today', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 5, 8, 30))
    expect(getDefaultTimeRange()).toEqual({
      start: new Date(2026, 8, 29, 0, 0, 0, 0),
      end: new Date(2026, 9, 5, 23, 59, 59, 999),
    })
  })

  it('names the default range as the 7-day preset', () => {
    const range = getDefaultTimeRange()
    expect(matchRangePreset(range.start, range.end)).toBe('7d')
  })

  it('matches presets at minute precision and leaves custom ranges unnamed', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 5, 8, 30))
    const thirty = getPresetRange('30d')
    // the picker inputs drop seconds: 23:59:00 still counts as end of day
    const end = new Date(thirty.end)
    end.setSeconds(0, 0)
    expect(matchRangePreset(thirty.start, end)).toBe('30d')
    expect(
      matchRangePreset(new Date(2026, 9, 1), new Date(2026, 9, 3))
    ).toBeUndefined()
    expect(matchRangePreset(undefined, thirty.end)).toBeUndefined()
  })
})
