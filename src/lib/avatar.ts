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
import type { CSSProperties } from 'react'

export type UserAvatarStyle = Pick<CSSProperties, 'backgroundColor' | 'color'>

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

// [user-ui] 头像字母颜色按背景亮度选择（WCAG 2.1 AA，正文 ≥ 4.5:1）。
// 原实现一律白字，黄、绿、青等浅色背景上对比度只有约 2–3:1。
// 深色字用品牌近黑 #202226（styles/brand.css 的 --foreground 基色）；内联样式无法引用随明暗变化的 CSS 变量，
// 而头像背景本身不随主题变化，所以这里用固定色值。
const AVATAR_TEXT_DARK = '#202226'
const AVATAR_TEXT_LIGHT = 'white'
const MIN_TEXT_CONTRAST = 4.5
const DARK_TEXT_LUMINANCE = relativeLuminance([
  0x20 / 255,
  0x22 / 255,
  0x26 / 255,
])
const LIGHT_TEXT_LUMINANCE = 1

function hslToRgb(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100
  const l = lightness / 100
  const k = (n: number) => (n + hue / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)] as const
}

function relativeLuminance(rgb: readonly [number, number, number]): number {
  const [r, g, b] = rgb.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  )
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrastRatio(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export function getUserAvatarStyle(name: string): UserAvatarStyle {
  const hash = hashString(name)
  const hue = hash % 360
  const saturation = 54 + (hash % 8)
  let lightness = 52 + ((hash >> 4) % 8)

  // [user-ui] 先选对比度更高的字色；中间亮度的少数颜色两种字色都不到 4.5:1，
  // 再把背景亮度朝远离字色的方向逐步调整，直到达标（色相与饱和度不变）。
  const background = () =>
    relativeLuminance(hslToRgb(hue, saturation, lightness))
  const useDarkText =
    contrastRatio(background(), DARK_TEXT_LUMINANCE) >=
    contrastRatio(background(), LIGHT_TEXT_LUMINANCE)
  const textLuminance = useDarkText ? DARK_TEXT_LUMINANCE : LIGHT_TEXT_LUMINANCE
  while (
    contrastRatio(background(), textLuminance) < MIN_TEXT_CONTRAST &&
    lightness > 0 &&
    lightness < 100
  ) {
    lightness += useDarkText ? 1 : -1
  }

  return {
    backgroundColor: `hsl(${hue} ${saturation}% ${lightness}%)`,
    color: useDarkText ? AVATAR_TEXT_DARK : AVATAR_TEXT_LIGHT,
  }
}

export function getUserAvatarFallback(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}
