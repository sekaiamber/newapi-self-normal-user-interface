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
import {
  Hash,
  Coins,
  Layers,
  Gauge,
  Zap,
  Flame,
  TrendingUp,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { IconBadgeTone } from '@/components/ui/icon-badge'
import { safeDivide } from '@/features/dashboard/lib'

interface StatCardConfig {
  key: string
  title: string
  description: string
  icon: LucideIcon
  iconTone: IconBadgeTone
  getValue: (stat: Record<string, number>, days?: number) => number
}

// [user-ui] 统计卡文案改为面向使用者的说法（审计 2.3 #2）：标题写清"统计的是什么"，
// 说明写清时间窗，不再用"统计计数/统计配额"这类重复标题的副标题；字段与取值逻辑不变。
export function useModelStatCardsConfig(): StatCardConfig[] {
  const { t } = useTranslation()

  return [
    {
      key: 'count',
      title: t('usage.stats.card.requests'),
      description: t('usage.stats.card.inRange'),
      icon: Hash,
      iconTone: 'info',
      getValue: (stat) => stat?.rpm ?? 0,
    },
    {
      key: 'quota',
      title: t('usage.stats.card.spend'),
      description: t('usage.stats.card.inRange'),
      icon: Coins,
      iconTone: 'success',
      getValue: (stat) => stat?.quota ?? 0,
    },
    {
      key: 'tokens',
      title: t('usage.stats.card.tokens'),
      description: t('usage.stats.card.inRange'),
      icon: Layers,
      iconTone: 'chart-4',
      getValue: (stat) => stat?.tpm ?? 0,
    },
    {
      key: 'avgRpm',
      title: t('usage.stats.card.avgRpm'),
      description: t('usage.stats.card.avgRpmHint'),
      icon: Gauge,
      iconTone: 'chart-2',
      getValue: (stat, timeRangeMinutes = 1) =>
        safeDivide(stat?.rpm ?? 0, timeRangeMinutes),
    },
    {
      key: 'avgTpm',
      title: t('usage.stats.card.avgTpm'),
      description: t('usage.stats.card.avgTpmHint'),
      icon: Zap,
      iconTone: 'warning',
      getValue: (stat, timeRangeMinutes = 1) =>
        safeDivide(stat?.tpm ?? 0, timeRangeMinutes),
    },
  ]
}

// [user-ui] 概览用量卡：每个数字都写明时间窗（近 24 小时 / 累计），审计 2.1、2.2 #5。
// 去掉了货币单位后缀（金额已带货币符号；不显示金额时原来会显示成容易误解的 "Tokens"）。
export function useSummaryCardsConfig(totals: {
  todayUsageDisplay: string
  todayRequestCountDisplay: string
  usedDisplay: string
  requestCountDisplay: string
}) {
  const { t } = useTranslation()

  return [
    {
      key: 'todayUsage',
      title: t('usage.overview.tile.todaySpend'),
      value: totals.todayUsageDisplay,
      description: t('usage.overview.tile.todayRequests', {
        requests: totals.todayRequestCountDisplay,
      }),
      icon: Flame,
    },
    {
      key: 'usage',
      title: t('usage.overview.tile.totalSpend'),
      value: totals.usedDisplay,
      description: t('usage.overview.tile.sinceSignUp'),
      icon: TrendingUp,
    },
    {
      key: 'requests',
      title: t('usage.overview.tile.totalRequests'),
      value: totals.requestCountDisplay,
      description: t('usage.overview.tile.sinceSignUp'),
      icon: Activity,
    },
  ]
}
