/*
 * [user-ui] SwarmRouter 品牌资源路径与判断（本仓库新增文件，非官方代码）。
 *
 * public/brand/ 下是 owner 提供的 SVG（原文件不改）；*-dark.svg 是暗色背景用的派生版。
 */
import { DEFAULT_LOGO } from '@/lib/constants'

export const BRAND_NAME = 'SwarmRouter'

export const BRAND_ASSETS = {
  icon: '/brand/swarmrouter-icon.svg',
  iconDark: '/brand/swarmrouter-icon-dark.svg',
  logo: '/brand/swarmrouter-logo.svg',
  logoDark: '/brand/swarmrouter-logo-dark.svg',
} as const

/** 后台没有配置 Logo（或仍是默认值）时为 true，此时显示品牌标识。 */
export function isDefaultLogo(logo: string | undefined | null): boolean {
  return !logo || logo === DEFAULT_LOGO
}
