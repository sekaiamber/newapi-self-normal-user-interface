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
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { GroupBadge, GroupMultiplierBadge } from '@/components/group-badge'
import { cn } from '@/lib/utils'

export type GroupRatio = number | string | null | undefined

// [user-ui] 去掉阴影光晕（品牌规范：不要旧版的装饰性光效）
export const AUTO_GROUP_FRAME_CLASS_NAME =
  'border-primary/40 relative overflow-visible border'

type AutoGroupFlowBorderProps = {
  shouldReduceMotion: boolean
  appearance?: 'default' | 'subtle'
}

// [user-ui] 自动分组的"流光边框"动画属于装饰性动效，品牌规范要求克制，不再渲染。
// 保留组件与参数，调用方无需改动；恢复官方效果时还原本函数即可。
export function AutoGroupFlowBorder(_props: AutoGroupFlowBorderProps) {
  return null
}

type AutoGroupFrameProps = {
  children: ReactNode
  className?: string
  effect: 'badge' | 'ratio'
  shouldReduceMotion: boolean
}

export function AutoGroupFrame(props: AutoGroupFrameProps) {
  return (
    <span
      data-auto-group-frame='true'
      data-auto-group-effect={props.effect}
      className={cn(
        AUTO_GROUP_FRAME_CLASS_NAME,
        // [user-ui] 方角（品牌圆角 4px），原为 rounded-4xl 胶囊
        'inline-flex max-w-full shrink-0 rounded-lg p-px',
        props.className
      )}
    >
      <AutoGroupFlowBorder shouldReduceMotion={props.shouldReduceMotion} />
      {props.children}
    </span>
  )
}

type GroupRatioBadgeProps = {
  isAuto?: boolean
  ratio: GroupRatio
  shouldReduceMotion?: boolean
}

/**
 * [user-ui] 倍率是管理端的计费概念（审计 2.5 K5）：用户侧写成"价格 ×1.5"，
 * 标准价（×1）不显示徽章；方角，不用胶囊；说明放在 title 提示里。
 */
export function GroupRatioBadge(props: GroupRatioBadgeProps) {
  const { t } = useTranslation()

  if (props.ratio === undefined || props.ratio === null || props.ratio === '') {
    return null
  }

  if (typeof props.ratio !== 'number') {
    return (
      <GroupMultiplierBadge
        label={t('Auto')}
        className={cn(
          'min-w-0 rounded-sm',
          props.isAuto && 'border-primary/30 bg-primary/10 text-primary-ink'
        )}
      />
    )
  }

  if (props.ratio === 1) return null

  return (
    <span
      className='inline-flex shrink-0'
      title={t('keys.group.priceRatioHint', { ratio: props.ratio })}
    >
      <GroupMultiplierBadge
        ratio={props.ratio}
        label={t('keys.group.priceRatio', { ratio: props.ratio })}
        className='min-w-0 rounded-sm tabular-nums'
      />
    </span>
  )
}

export function AutoGroupBadge(props: { shouldReduceMotion: boolean }) {
  return (
    <AutoGroupFrame
      effect='badge'
      shouldReduceMotion={props.shouldReduceMotion}
    >
      <GroupBadge group='auto' />
    </AutoGroupFrame>
  )
}
