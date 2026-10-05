/*
 * [user-ui] 首页路由示意图（本仓库新增文件，非官方代码）。
 *
 * 三种请求格式（左）→ 站点（中，品牌蜂巢）→ 上游模型（右）。只画格式与路径，
 * 不画具体模型或厂商（能用哪些模型由管理员配置决定）。
 * 动效：每隔几秒有一个金色六边形沿线路经过蜂巢；prefers-reduced-motion 时完全静止（不渲染动画元素）。
 */
import { useTranslation } from 'react-i18next'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import {
  API_FORMAT_FAMILY_KEYS,
  type ApiFormatFamily,
} from '../lib/api-formats'
import { BRAND_MARK_SIZE, hexPoints } from '../lib/honeycomb'
import { BrandMarkShape } from './honeycomb'

const VIEW_WIDTH = 520
const VIEW_HEIGHT = 330
const UPSTREAM_ROW_Y = [90, 180, 270] as const
const HUB_CENTER = { x: 300, y: 180 }
const HUB_SCALE = 1.35
const INPUT_BOX = { x: 1, width: 178, height: 58 }
const INPUT_EDGE = INPUT_BOX.x + INPUT_BOX.width
const HUB_LEFT = HUB_CENTER.x - (BRAND_MARK_SIZE.width / 2) * HUB_SCALE
const HUB_TOP = HUB_CENTER.y - (BRAND_MARK_SIZE.height / 2) * HUB_SCALE
// 线路接到中心金色六边形的左右顶点（图标坐标 x = 33 与 71.72），被蜂巢遮住的部分即"经过站点"
const HUB_IN = HUB_LEFT + 33 * HUB_SCALE
const HUB_OUT = HUB_LEFT + 71.72 * HUB_SCALE
const UPSTREAM_X = 464
const UPSTREAM_RADIUS = 24
const UPSTREAM_EDGE = UPSTREAM_X - UPSTREAM_RADIUS
const PULSE_CYCLE_SECONDS = 6

const INPUTS: ReadonlyArray<{ family: ApiFormatFamily; path: string }> = [
  { family: 'openai', path: '/v1/chat/completions' },
  { family: 'claude', path: '/v1/messages' },
  { family: 'gemini', path: '/v1beta/models/…' },
]

const INPUT_ROW_Y = [80, 180, 280] as const

function inputPath(y: number): string {
  if (y === HUB_CENTER.y) return `M${INPUT_EDGE} ${y} L${HUB_IN} ${y}`
  const mid = (INPUT_EDGE + HUB_IN) / 2
  return `M${INPUT_EDGE} ${y} C${mid} ${y} ${mid} ${HUB_CENTER.y} ${HUB_IN} ${HUB_CENTER.y}`
}

function outputSegment(y: number): string {
  if (y === HUB_CENTER.y) return `L${UPSTREAM_EDGE} ${y}`
  const mid = (HUB_OUT + UPSTREAM_EDGE) / 2
  return `C${mid} ${HUB_CENTER.y} ${mid} ${y} ${UPSTREAM_EDGE} ${y}`
}

function outputPath(y: number): string {
  return `M${HUB_OUT} ${HUB_CENTER.y} ${outputSegment(y)}`
}

/** 从输入框经过蜂巢到上游节点的整条线路（脉冲沿它移动）。 */
function routePath(index: number): string {
  return `${inputPath(INPUT_ROW_Y[index])} L${HUB_OUT} ${HUB_CENTER.y} ${outputSegment(UPSTREAM_ROW_Y[index])}`
}

interface RouteDiagramProps {
  siteName: string
  className?: string
}

export function RouteDiagram(props: RouteDiagramProps) {
  const { t } = useTranslation()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const hubBottom = HUB_TOP + BRAND_MARK_SIZE.height * HUB_SCALE

  return (
    <svg
      role='img'
      aria-label={t('home.diagram.label', { siteName: props.siteName })}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={cn('h-auto w-full font-sans select-none', props.className)}
      data-testid='home-route-diagram'
    >
      <text
        x={0}
        y={18}
        fontSize={11}
        className='fill-muted-foreground font-mono tracking-wider uppercase'
      >
        {t('home.diagram.requests')}
      </text>
      <text
        x={UPSTREAM_X}
        y={18}
        fontSize={11}
        textAnchor='middle'
        className='fill-muted-foreground font-mono tracking-wider uppercase'
      >
        {t('home.diagram.upstream')}
      </text>

      <g fill='none' strokeWidth={2} className='stroke-edge-soft'>
        {INPUT_ROW_Y.map((y) => (
          <path key={`in-${y}`} d={inputPath(y)} />
        ))}
        <path d={`M${HUB_IN} ${HUB_CENTER.y} L${HUB_OUT} ${HUB_CENTER.y}`} />
        {UPSTREAM_ROW_Y.map((y) => (
          <path key={`out-${y}`} d={outputPath(y)} />
        ))}
      </g>

      {!reduceMotion &&
        INPUTS.map((input, index) => {
          const begin = `${index * (PULSE_CYCLE_SECONDS / INPUTS.length)}s`
          return (
            <g
              key={`pulse-${input.family}`}
              opacity={0}
              data-testid='home-route-pulse'
            >
              <polygon
                points={hexPoints(0, 0, 6.5)}
                strokeWidth={1.5}
                className='fill-primary stroke-primary-edge'
              />
              <animateMotion
                path={routePath(index)}
                dur={`${PULSE_CYCLE_SECONDS}s`}
                begin={begin}
                repeatCount='indefinite'
                calcMode='linear'
                keyPoints='0;1;1'
                keyTimes='0;0.42;1'
              />
              <animate
                attributeName='opacity'
                values='0;1;1;0;0'
                keyTimes='0;0.03;0.39;0.42;1'
                dur={`${PULSE_CYCLE_SECONDS}s`}
                begin={begin}
                repeatCount='indefinite'
              />
            </g>
          )
        })}

      {INPUTS.map((input, index) => {
        const y = INPUT_ROW_Y[index]
        return (
          <g key={input.family}>
            <rect
              x={INPUT_BOX.x}
              y={y - INPUT_BOX.height / 2}
              width={INPUT_BOX.width}
              height={INPUT_BOX.height}
              rx={4}
              strokeWidth={2}
              className='fill-card stroke-edge'
            />
            <text
              x={16}
              y={y - 4}
              fontSize={14}
              fontWeight={600}
              className='fill-foreground'
            >
              {t(API_FORMAT_FAMILY_KEYS[input.family])}
            </text>
            <text
              x={16}
              y={y + 16}
              fontSize={11.5}
              className='fill-muted-foreground font-mono'
            >
              {input.path}
            </text>
          </g>
        )
      })}

      <BrandMarkShape x={HUB_LEFT} y={HUB_TOP} scale={HUB_SCALE} />
      <text
        x={HUB_CENTER.x}
        y={hubBottom + 24}
        fontSize={12}
        fontWeight={600}
        textAnchor='middle'
        className='fill-foreground font-mono'
      >
        {props.siteName}
      </text>

      {UPSTREAM_ROW_Y.map((y) => (
        <g key={`up-${y}`}>
          <polygon
            points={hexPoints(UPSTREAM_X, y, UPSTREAM_RADIUS)}
            strokeWidth={2}
            strokeLinejoin='round'
            className='fill-card stroke-edge'
          />
          <polygon
            points={hexPoints(UPSTREAM_X, y, 8)}
            className='fill-muted-foreground'
          />
        </g>
      ))}
    </svg>
  )
}
