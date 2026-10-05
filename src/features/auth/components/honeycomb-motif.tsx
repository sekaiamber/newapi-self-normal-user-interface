/*
 * [user-ui] 认证页品牌区的蜂巢底纹（本仓库新增文件，非官方代码）。
 *
 * 平顶六边形网格，与 SwarmRouter 图标的六边形同向；颜色取 currentColor（调用方传金色 token），
 * 静态 SVG、无动画，装饰性（aria-hidden）。几何在模块加载时算好，渲染时不重复计算。
 */
import { cn } from '@/lib/utils'

const R = 22 // 网格六边形外接圆半径
const H = Math.sqrt(3) * R // 平顶六边形高度
const DRAW_R = R * 0.86 // 留缝
const COLS = 8
const ROWS = 8

function hexPoints(cx: number, cy: number, r: number): string {
  const h = (Math.sqrt(3) / 2) * r
  return [
    [cx + r, cy],
    [cx + r / 2, cy + h],
    [cx - r / 2, cy + h],
    [cx - r, cy],
    [cx - r / 2, cy - h],
    [cx + r / 2, cy - h],
  ]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')
}

type Cell = { key: string; points: string; tone: 'grid' | 'ring' | 'fill' }

// 与图标一样的 7 格簇：中心与左上为实心金，其余描边加重
const FILLED = new Set(['5:4', '4:4'])
const RING = new Set(['5:3', '5:5', '4:5', '6:4', '6:5'])

const CELLS: Cell[] = []
for (let col = 0; col < COLS; col++) {
  for (let row = 0; row < ROWS; row++) {
    const cx = R + col * 1.5 * R
    const cy = H / 2 + row * H + (col % 2 === 1 ? H / 2 : 0)
    const key = `${col}:${row}`
    let tone: Cell['tone'] = 'grid'
    if (FILLED.has(key)) tone = 'fill'
    else if (RING.has(key)) tone = 'ring'
    CELLS.push({ key, points: hexPoints(cx, cy, DRAW_R), tone })
  }
}

const VIEW_W = 2 * R + (COLS - 1) * 1.5 * R
const VIEW_H = ROWS * H + H / 2

export function HoneycombMotif(props: { className?: string }) {
  return (
    <svg
      aria-hidden='true'
      focusable='false'
      viewBox={`0 0 ${VIEW_W.toFixed(1)} ${VIEW_H.toFixed(1)}`}
      className={cn(
        // 向左上方淡出，只在角落留一点纹理
        '[mask-image:radial-gradient(circle_at_61%_59%,black_18%,transparent_62%)]',
        props.className
      )}
    >
      {CELLS.map((cell) => (
        <polygon
          key={cell.key}
          points={cell.points}
          fill={cell.tone === 'fill' ? 'currentColor' : 'none'}
          stroke='currentColor'
          strokeWidth={cell.tone === 'grid' ? 1.5 : 2}
          strokeOpacity={cell.tone === 'grid' ? 0.12 : 0.4}
          fillOpacity={cell.tone === 'fill' ? 0.8 : undefined}
          strokeLinejoin='round'
        />
      ))}
    </svg>
  )
}

/** 列表项目符号：一个实心平顶六边形。 */
export function HexBullet(props: { className?: string }) {
  return (
    <svg
      aria-hidden='true'
      focusable='false'
      viewBox='0 0 24 22'
      className={props.className}
    >
      <polygon points={hexPoints(12, 11, 11.5)} fill='currentColor' />
    </svg>
  )
}
