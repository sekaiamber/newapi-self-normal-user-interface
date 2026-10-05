/*
 * [user-ui] 图表色板读取主题 token 的测试（本仓库新增文件，非官方代码）。
 */
import { afterEach, describe, expect, it } from 'vitest'

import {
  CHART_PALETTE_TOKENS,
  parseCssColor,
  readChartPalette,
  readThemeColor,
} from '../chart-palette'
import { getDashboardChartColors, processChartData } from '../charts'

// 浅色模式的品牌 token（src/styles/brand.css :root）
const LIGHT_TOKENS: Record<string, string> = {
  '--chart-1': 'oklch(0.68 0.13 82)',
  '--chart-2': 'oklch(0.45 0.06 264)',
  '--chart-3': 'oklch(0.52 0.085 195)',
  '--chart-4': 'oklch(0.55 0.15 40)',
  '--chart-5': 'oklch(0.52 0.14 300)',
}

function setTokens(tokens: Record<string, string>) {
  for (const [name, value] of Object.entries(tokens)) {
    document.documentElement.style.setProperty(name, value)
  }
}

afterEach(() => {
  document.documentElement.removeAttribute('style')
})

describe('parseCssColor', () => {
  it('parses oklch tokens with plain and percentage lightness the same way', () => {
    expect(parseCssColor('oklch(0.68 0.13 82)')).toEqual({
      l: 0.68,
      c: 0.13,
      h: 82,
    })
    expect(parseCssColor(' oklch(68% 0.13 82 / 50%) ')).toEqual({
      l: 0.68,
      c: 0.13,
      h: 82,
    })
  })

  it('parses the lab() values that the production CSS build emits', () => {
    // 构建后 --chart-1 的值（oklch(0.68 0.13 82) 被转写为 lab）
    const parsed = parseCssColor('lab(62.9569% 12.1807 59.8758)')

    expect(parsed?.l).toBeCloseTo(0.68, 2)
    expect(parsed?.c).toBeCloseTo(0.13, 2)
    expect(parsed?.h).toBeCloseTo(82, 0)
    expect(readThemeColor('--unset')).toBeNull()
  })

  it('returns null for values it cannot convert', () => {
    expect(parseCssColor('')).toBeNull()
    expect(parseCssColor('var(--other)')).toBeNull()
  })
})

describe('readChartPalette', () => {
  it('returns the five brand colors in validated order followed by five derived shades', () => {
    setTokens(LIGHT_TOKENS)

    const palette = readChartPalette()

    expect(palette).toEqual([
      '#c08f22',
      '#445577',
      '#b74b21',
      '#117878',
      '#7652ac',
      '#916200',
      '#6e80a5',
      '#eb7a52',
      '#4da6a5',
      '#a37fde',
    ])
    expect(new Set(palette).size).toBe(palette?.length)
  })

  it('returns null when any chart token is missing', () => {
    setTokens({ ...LIGHT_TOKENS })
    document.documentElement.style.removeProperty(CHART_PALETTE_TOKENS[4])

    expect(readChartPalette()).toBeNull()
  })
})

describe('getDashboardChartColors', () => {
  it('uses the theme palette when the chart tokens are available', () => {
    setTokens(LIGHT_TOKENS)

    expect(getDashboardChartColors(3).slice(0, 2)).toEqual([
      '#c08f22',
      '#445577',
    ])
  })

  it('falls back to the built-in chart scheme when tokens are unavailable', () => {
    const colors = getDashboardChartColors(3)

    expect(colors.length).toBeGreaterThan(0)
    expect(colors[0]).not.toBe('#c08f22')
  })
})

describe('processChartData', () => {
  it('colors model series with the palette passed by the caller', () => {
    const palette = ['#c08f22', '#445577']
    const data = [
      { model_name: 'a', quota: 10, count: 1, token_used: 5, created_at: 0 },
      { model_name: 'b', quota: 20, count: 2, token_used: 5, created_at: 0 },
    ]

    const charts = processChartData(data, 'day', undefined, undefined, palette)

    expect(charts.spec_line.color.range).toEqual(palette)
    expect(charts.spec_model_line.color.range).toEqual(palette)
  })
})

describe('readThemeColor', () => {
  it('converts a theme token to hex and returns null when it is not set', () => {
    document.documentElement.style.setProperty('--foreground', '#202226')

    expect(readThemeColor('--foreground')).toBe('#202226')
    expect(readThemeColor('--missing-token')).toBeNull()
  })
})
