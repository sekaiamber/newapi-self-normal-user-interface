/*
 * [user-ui] 头像配色测试（本仓库新增文件，非官方代码）。
 * 契约：头像字母与背景的对比度 ≥ 4.5:1（WCAG 2.1 AA 正文）；同一名字的配色稳定。
 */
import { describe, expect, it } from 'vitest'

import { getUserAvatarFallback, getUserAvatarStyle } from '../avatar'

// 独立的 WCAG 对比度计算（chroma 法 HSL→RGB），作为测试判据
function parseHsl(value: string): [number, number, number] {
  const match =
    /^hsl\((\d+(?:\.\d+)?) (\d+(?:\.\d+)?)% (\d+(?:\.\d+)?)%\)$/.exec(value)
  if (!match) throw new Error(`unexpected background ${value}`)
  const h = Number(match[1])
  const s = Number(match[2]) / 100
  const l = Number(match[3]) / 100
  const chroma = (1 - Math.abs(2 * l - 1)) * s
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - chroma / 2
  const sector = Math.floor(h / 60) % 6
  const table: Array<[number, number, number]> = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ]
  const [r, g, b] = table[sector]
  return [r + m, g + m, b + m]
}

function parseTextColor(value: string): [number, number, number] {
  if (value === 'white') return [1, 1, 1]
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  if (!hex) throw new Error(`unexpected text color ${value}`)
  return [hex[1], hex[2], hex[3]].map((c) => Number.parseInt(c, 16) / 255) as [
    number,
    number,
    number,
  ]
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastOf(name: string): number {
  const style = getUserAvatarStyle(name)
  const bg = luminance(parseHsl(String(style.backgroundColor)))
  const fg = luminance(parseTextColor(String(style.color)))
  return (Math.max(bg, fg) + 0.05) / (Math.min(bg, fg) + 0.05)
}

describe('getUserAvatarStyle', () => {
  it('keeps the letter at least 4.5:1 against the background for every hue', () => {
    // 2000 个名字覆盖全部 360 个色相与各档亮度
    const names = Array.from({ length: 2000 }, (_, i) => `user-${i}`)
    const failing = names.filter((name) => contrastOf(name) < 4.5)

    expect(failing).toEqual([])
  })

  it('uses dark text on the light yellow avatar the test account used to get with white text', () => {
    const style = getUserAvatarStyle('test')

    expect(style.color).toBe('#202226')
    expect(contrastOf('test')).toBeGreaterThanOrEqual(4.5)
  })

  it('returns the same colors for the same name', () => {
    expect(getUserAvatarStyle('alice')).toEqual(getUserAvatarStyle('alice'))
  })
})

describe('getUserAvatarFallback', () => {
  it('uses the upper-cased first letter, or ? for a blank name', () => {
    expect(getUserAvatarFallback('  alice')).toBe('A')
    expect(getUserAvatarFallback('   ')).toBe('?')
  })
})
