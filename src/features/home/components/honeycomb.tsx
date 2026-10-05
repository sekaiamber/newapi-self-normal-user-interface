/*
 * [user-ui] 首页蜂巢图形（本仓库新增文件，非官方代码）。
 *
 * 全部是内联 SVG，颜色只用主题 token（fill-primary / fill-foreground / stroke-edge 等），
 * 明暗主题自动切换，不加载图片。几何比例见 ../lib/honeycomb.ts。
 */
import { useId, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

import {
  BRAND_MARK_HEXES,
  HEX_COLUMN_STEP,
  HEX_ROW_STEP,
  hexPoints,
} from '../lib/honeycomb'

/** 品牌图标的 7 格蜂巢，作为 SVG 片段嵌进其他图形（例如路由图的中心节点）。 */
export function BrandMarkShape(props: {
  x: number
  y: number
  scale?: number
}) {
  const scale = props.scale ?? 1
  return (
    <g transform={`translate(${props.x} ${props.y}) scale(${scale})`}>
      {BRAND_MARK_HEXES.map((hex) => (
        <polygon
          key={`${hex.cx}-${hex.cy}`}
          points={hexPoints(hex.cx, hex.cy)}
          className={hex.tone === 'gold' ? 'fill-primary' : 'fill-foreground'}
        />
      ))}
    </g>
  )
}

/** 小号六边形标记：用于小标题前的符号和步骤序号。 */
export function HexBadge(props: { className?: string; children?: ReactNode }) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        props.className
      )}
    >
      <svg
        aria-hidden='true'
        viewBox='-21 -19 42 38'
        className='absolute inset-0 size-full overflow-visible'
      >
        <polygon
          points={hexPoints(0, 0)}
          className='fill-primary stroke-primary-edge'
          strokeWidth={3}
          strokeLinejoin='round'
        />
      </svg>
      {props.children !== undefined && (
        <span className='text-primary-foreground relative font-mono text-sm font-bold tabular-nums'>
          {props.children}
        </span>
      )}
    </span>
  )
}

// 底纹图块（两列一行）。跨出图块边界的六边形在对侧再画一次，拼接处才不会缺角。
const TILE_FIRST_COLUMN_X = 19.36
const TILE_SECOND_COLUMN_X = TILE_FIRST_COLUMN_X + HEX_COLUMN_STEP
const BACKDROP_TILE_CENTERS: ReadonlyArray<[number, number]> = [
  [TILE_FIRST_COLUMN_X, HEX_ROW_STEP / 2],
  [TILE_SECOND_COLUMN_X, 0],
  [TILE_SECOND_COLUMN_X, HEX_ROW_STEP],
  [TILE_SECOND_COLUMN_X - HEX_COLUMN_STEP * 2, 0],
  [TILE_SECOND_COLUMN_X - HEX_COLUMN_STEP * 2, HEX_ROW_STEP],
]

/**
 * 很淡的蜂巢底纹（与 logo 同比例的六边形描边），用 mask 向四周淡出。
 * 颜色取 currentColor，由调用方用 text-* 类控制深浅。
 */
export function HoneycombBackdrop(props: { className?: string }) {
  const patternId = `home-hex-${useId().replaceAll(/[^a-zA-Z0-9_-]/g, '')}`
  return (
    <svg
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute inset-0 size-full',
        props.className
      )}
    >
      <defs>
        <pattern
          id={patternId}
          width={HEX_COLUMN_STEP * 2}
          height={HEX_ROW_STEP}
          patternUnits='userSpaceOnUse'
          patternTransform='scale(1.25)'
        >
          <g fill='none' stroke='currentColor' strokeWidth={1.2}>
            {BACKDROP_TILE_CENTERS.map(([cx, cy]) => (
              <polygon key={`${cx}-${cy}`} points={hexPoints(cx, cy)} />
            ))}
          </g>
        </pattern>
      </defs>
      <rect width='100%' height='100%' fill={`url(#${patternId})`} />
    </svg>
  )
}
