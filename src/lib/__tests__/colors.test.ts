/*
 * [user-ui] 语义色映射改用主题 token 的测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import { avatarColorMap, colorToBgClass, getBgColorClass } from '@/lib/colors'

const RAW_PALETTE_CLASS =
  /\b(?:bg|text)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/

describe('semantic color maps', () => {
  it('uses theme tokens for every background color', () => {
    for (const value of Object.values(colorToBgClass)) {
      expect(value).not.toMatch(RAW_PALETTE_CLASS)
    }
  })

  it('never uses the brand gold (chart-1) as a text color in avatars', () => {
    for (const value of Object.values(avatarColorMap)) {
      expect(value).not.toMatch(/\btext-chart-1\b/)
    }
  })

  it('falls back to the info token for unknown colors', () => {
    expect(getBgColorClass('not-a-color')).toBe('bg-info')
    expect(getBgColorClass()).toBe('bg-info')
  })
})
