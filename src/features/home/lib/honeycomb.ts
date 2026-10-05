/*
 * [user-ui] 蜂巢几何（本仓库新增文件，非官方代码）。
 *
 * 数值取自品牌图标 public/brand/swarmrouter-icon.svg（viewBox 104.72 × 109.74）：
 * 平顶正六边形，外接圆半径 19.36；列距 33、行距 38.1，相邻列错开半行。
 * 首页的蜂巢底纹、路由图中心节点和步骤序号都用这一套比例，与 logo 保持一致。
 */

/** 品牌图标里单个六边形的外接圆半径 */
export const HEX_RADIUS = 19.36
/** 列距（中心点水平间隔） */
export const HEX_COLUMN_STEP = 33
/** 行距（中心点垂直间隔） */
export const HEX_ROW_STEP = 38.1

export const BRAND_MARK_SIZE = { width: 104.72, height: 109.74 } as const

/** 平顶正六边形的 polygon points，(cx, cy) 为中心。 */
export function hexPoints(cx: number, cy: number, radius = HEX_RADIUS): string {
  const halfHeight = (radius * Math.sqrt(3)) / 2
  const half = radius / 2
  const points: Array<[number, number]> = [
    [cx + radius, cy],
    [cx + half, cy + halfHeight],
    [cx - half, cy + halfHeight],
    [cx - radius, cy],
    [cx - half, cy - halfHeight],
    [cx + half, cy - halfHeight],
  ]
  return points
    .map(([x, y]) => `${Number(x.toFixed(2))},${Number(y.toFixed(2))}`)
    .join(' ')
}

export type BrandHexTone = 'gold' | 'ink'

/** 品牌图标的 7 个六边形：中心与左上、右下三格为金色，其余为近黑（暗色主题为纸白）。 */
export const BRAND_MARK_HEXES: ReadonlyArray<{
  cx: number
  cy: number
  tone: BrandHexTone
}> = [
  { cx: 52.36, cy: 16.76, tone: 'ink' },
  { cx: 19.36, cy: 35.82, tone: 'gold' },
  { cx: 85.36, cy: 35.82, tone: 'ink' },
  { cx: 52.36, cy: 54.87, tone: 'gold' },
  { cx: 19.36, cy: 73.92, tone: 'ink' },
  { cx: 85.36, cy: 73.92, tone: 'gold' },
  { cx: 52.36, cy: 92.98, tone: 'ink' },
]
