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
import { useTranslation } from 'react-i18next'

import { BadgeCell, TruncatedCell } from '@/components/data-table'
import { GroupBadge } from '@/components/group-badge'
import { StatusBadge } from '@/components/status-badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useMediaQuery } from '@/hooks'
import { cn } from '@/lib/utils'

import { GroupRatioBadge, type GroupRatio } from './auto-group-visuals'

type ApiKeyGroupCellProps = {
  crossGroupRetry: boolean
  group: string
  ratio?: GroupRatio
  /** [user-ui] 管理员给分组写的说明（/api/user/self/groups 的 desc），放进提示 */
  description?: string
  shouldReduceMotion: boolean
}

// [user-ui] "线路"单元格（审计 2.5 K5）：不再给每行挂 "1x" 胶囊；只有价格不是标准价时
// 显示方角的"价格 ×N"，分组说明和价格系数都放在提示里，数据仍可查看。
export function ApiKeyGroupCell(props: ApiKeyGroupCellProps) {
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 640px)')

  const group = props.group?.trim() || ''
  if (group !== 'auto') {
    const ratio =
      group && typeof props.ratio === 'number' ? props.ratio : undefined
    const description =
      props.description && props.description !== group
        ? props.description
        : undefined
    let priceText: string | undefined
    if (ratio === 1) priceText = t('keys.group.standardPrice')
    else if (ratio !== undefined) {
      priceText = t('keys.group.priceRatioHint', { ratio })
    }
    return (
      <TruncatedCell
        className={isMobile ? 'w-full' : 'max-w-50'}
        tabIndex={0}
        tooltipContent={
          <span className='flex flex-col gap-0.5'>
            <span>
              {group || t('keys.group.followAccountHint')}
              {description && ` · ${description}`}
            </span>
            {priceText && <span>{priceText}</span>}
          </span>
        }
        tooltipClassName='break-all'
      >
        <span
          className={cn(
            'inline-flex max-w-full min-w-0 items-center gap-2 text-sm',
            isMobile && 'w-full justify-between'
          )}
        >
          <GroupBadge
            group={group}
            label={group ? undefined : t('keys.group.followAccount')}
            className='px-0'
          />
          <GroupRatioBadge ratio={ratio} />
        </span>
      </TruncatedCell>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <BadgeCell
            data-api-key-group-cell='auto'
            tabIndex={0}
            className={cn(
              'ml-0 gap-3 overflow-visible text-xs',
              isMobile ? 'w-full justify-between' : 'max-w-50'
            )}
          />
        }
      >
        <StatusBadge
          label={t('keys.group.auto')}
          variant='info'
          copyable={false}
          className='px-0'
        />
      </TooltipTrigger>
      <TooltipContent>
        <span className='text-xs'>{t('keys.group.autoHint')}</span>
      </TooltipContent>
    </Tooltip>
  )
}
