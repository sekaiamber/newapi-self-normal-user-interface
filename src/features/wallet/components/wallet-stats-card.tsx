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
// [user-ui] 钱包统计重绘：余额作为主数字放大，累计消耗与请求次数降为次要；
// 改用品牌 Card（2px 边）代替手绘 1px 框；文案改为新 key（覆盖层 wallet.*）。
import { Activity, BarChart3, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/ui/card'
import { IconBadge, type IconBadgeTone } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { UserWalletData } from '../types'

interface WalletStatsCardProps {
  user: UserWalletData | null
  loading?: boolean
}

// 窄屏：余额独占一行，另外两项并排；sm 起三列，余额列更宽
const GRID =
  'grid grid-cols-2 gap-0 py-0 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]'
const CELL = 'min-w-0 px-4 py-3.5 sm:px-5 sm:py-4'
const BALANCE_CELL =
  'col-span-2 border-b border-border sm:col-span-1 sm:border-r sm:border-b-0'
const MIDDLE_CELL = 'border-r border-border'

interface StatProps {
  label: string
  value: string
  hint?: string
  icon: typeof WalletCards
  tone: IconBadgeTone
  primary?: boolean
  className?: string
}

function Stat(props: StatProps) {
  return (
    <div className={cn(CELL, props.className)}>
      <div className='flex items-center gap-2'>
        <IconBadge tone={props.tone} size='sm'>
          <props.icon />
        </IconBadge>
        <div className='text-muted-foreground truncate text-xs font-medium sm:text-sm'>
          {props.label}
        </div>
      </div>
      <div
        className={cn(
          'text-foreground mt-2 font-mono font-bold tracking-tight break-all tabular-nums',
          props.primary ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
        )}
      >
        {props.value}
      </div>
      {props.hint && (
        <div className='text-muted-foreground mt-1 text-xs'>{props.hint}</div>
      )}
    </div>
  )
}

export function WalletStatsCard(props: WalletStatsCardProps) {
  const { t } = useTranslation()

  if (props.loading) {
    return (
      <Card data-card-hover='false' className={GRID}>
        {['balance', 'usage', 'requests'].map((key, index) => (
          <div
            key={key}
            className={cn(
              CELL,
              index === 0 && BALANCE_CELL,
              index === 1 && MIDDLE_CELL
            )}
          >
            <Skeleton className='h-4 w-24' />
            <Skeleton
              className={cn('mt-2 w-28', index === 0 ? 'h-8' : 'h-6')}
            />
          </div>
        ))}
      </Card>
    )
  }

  return (
    <Card data-card-hover='false' className={GRID}>
      <Stat
        primary
        label={t('wallet.stats.balance')}
        value={formatQuota(props.user?.quota ?? 0)}
        hint={t('wallet.stats.balanceHint')}
        icon={WalletCards}
        tone='primary'
        className={BALANCE_CELL}
      />
      <Stat
        label={t('wallet.stats.used')}
        value={formatQuota(props.user?.used_quota ?? 0)}
        icon={BarChart3}
        tone='info'
        className={MIDDLE_CELL}
      />
      <Stat
        label={t('wallet.stats.requests')}
        value={(props.user?.request_count ?? 0).toLocaleString()}
        icon={Activity}
        tone='chart-3'
      />
    </Card>
  )
}
