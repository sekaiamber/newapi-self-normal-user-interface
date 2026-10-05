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
// [user-ui] 概览的"账户状态"卡（审计 2.1、2.2 #4–#6）：
// - 余额排在最前（窄屏也在最上面），大字显示，并给出按近 24 小时用量估算的可用天数；
// - 去掉重复的"近 24 小时消耗"（原来余额块和用量卡各显示一次）；
// - 每个用量数字都写明时间窗（近 24 小时 / 累计）；"累计"类数字不再配近 24 小时的迷你图；
// - 余额偏低或用完时，钱包入口变为主按钮；钱包关闭时改为提示联系管理员。
// 余额、用量、请求数的取值与计算逻辑沿用官方实现。
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useId, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { StaggerContainer, StaggerItem } from '@/components/page-transition'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { isUserUiFeatureEnabled } from '@/config/user-ui-features'
import { getUserQuotaDates } from '@/features/dashboard/api'
import { useSummaryCardsConfig } from '@/features/dashboard/hooks/use-dashboard-config'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { useStatus } from '@/hooks/use-status'
import { isCurrencyDisplayEnabled } from '@/lib/currency'
import { formatNumber, formatQuota } from '@/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'
import { computeTimeRange } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { StatCard } from '../ui/stat-card'

const SUMMARY_SPARKLINE_BUCKETS = 12

type SummarySparklineKey = 'balance' | 'usage' | 'requests'

function getBucketIndex(
  timestamp: number,
  start: number,
  end: number,
  bucketCount: number
): number {
  if (end <= start) return 0
  const ratio = (timestamp - start) / (end - start)
  return Math.min(bucketCount - 1, Math.max(0, Math.floor(ratio * bucketCount)))
}

function buildSummarySparklines(
  data: QuotaDataItem[],
  currentBalance: number,
  start: number,
  end: number
): Record<SummarySparklineKey, number[]> {
  const usage = Array.from({ length: SUMMARY_SPARKLINE_BUCKETS }, () => 0)
  const requests = Array.from({ length: SUMMARY_SPARKLINE_BUCKETS }, () => 0)

  for (const item of data) {
    const timestamp = Number(item.created_at) || start
    const index = getBucketIndex(
      timestamp,
      start,
      end,
      SUMMARY_SPARKLINE_BUCKETS
    )
    usage[index] += Number(item.quota) || 0
    requests[index] += Number(item.count) || 0
  }

  let balance = currentBalance
  const balanceTrend = Array.from(
    { length: SUMMARY_SPARKLINE_BUCKETS },
    () => 0
  )

  for (let index = SUMMARY_SPARKLINE_BUCKETS - 1; index >= 0; index--) {
    balanceTrend[index] = Math.max(0, balance)
    balance += usage[index]
  }

  return {
    balance: balanceTrend,
    usage,
    requests,
  }
}

function getRunwayDays(
  remainQuota: number,
  recentUsage: number
): number | null {
  if (remainQuota <= 0 || recentUsage <= 0) return null
  const days = remainQuota / recentUsage
  if (!Number.isFinite(days)) return null
  return days
}

type HealthLevel = 'healthy' | 'caution' | 'critical'

function getHealthLevel(remainQuota: number, recentUsage: number): HealthLevel {
  if (remainQuota <= 0) return 'critical'
  const days = getRunwayDays(remainQuota, recentUsage)
  if (days !== null && days < 3) return 'caution'
  return 'healthy'
}

// [user-ui] 状态文字改为面向使用者的说法（"充足 / 余额偏低 / 已用完"）
const HEALTH_CONFIG: Record<
  HealthLevel,
  { dotClass: string; textClass: string; labelKey: string }
> = {
  healthy: {
    dotClass: 'bg-success',
    textClass: 'text-success',
    labelKey: 'usage.overview.health.healthy',
  },
  caution: {
    dotClass: 'bg-warning',
    textClass: 'text-warning',
    labelKey: 'usage.overview.health.low',
  },
  critical: {
    dotClass: 'bg-destructive',
    textClass: 'text-destructive',
    labelKey: 'usage.overview.health.depleted',
  },
}

function useRunwayText(remainQuota: number, runwayDays: number | null): string {
  const { t } = useTranslation()
  if (remainQuota <= 0) return t('usage.overview.runway.depleted')
  if (runwayDays === null) return t('usage.overview.runway.noRecentUsage')
  if (runwayDays < 1) return t('usage.overview.runway.lessThanOneDay')
  if (runwayDays > 999) return t('usage.overview.runway.moreThan999')
  return t('usage.overview.runway.days', {
    days: formatNumber(Math.floor(runwayDays)),
  })
}

export function SummaryCards() {
  const { t } = useTranslation()
  const balanceHeadingId = useId()
  const usageHeadingId = useId()
  const user = useAuthStore((state) => state.auth.user)
  const { status } = useStatus()

  const summaryTimeRange = useMemo(() => computeTimeRange(1), [])
  const remainQuota = Number(user?.quota ?? 0)
  const usedQuota = Number(user?.used_quota ?? 0)
  const requestCount = Number(user?.request_count ?? 0)

  const usageTrendQuery = useQuery({
    queryKey: [
      'dashboard',
      'overview',
      'summary-sparklines',
      summaryTimeRange.start_timestamp,
      summaryTimeRange.end_timestamp,
    ],
    queryFn: async () =>
      requireServerSuccess(
        await getUserQuotaDates({
          start_timestamp: summaryTimeRange.start_timestamp,
          end_timestamp: summaryTimeRange.end_timestamp,
          default_time: 'hour',
        })
      ),
    staleTime: 60 * 1000,
  })

  const currencyEnabledFromStore = isCurrencyDisplayEnabled()
  const statusCurrencyFlag =
    typeof status?.display_in_currency === 'boolean'
      ? Boolean(status.display_in_currency)
      : undefined
  const currencyEnabled =
    statusCurrencyFlag !== undefined
      ? statusCurrencyFlag
      : currencyEnabledFromStore

  const recentRows = usageTrendQuery.data?.data
  const sparklineData = useMemo(
    () =>
      buildSummarySparklines(
        recentRows ?? [],
        remainQuota,
        summaryTimeRange.start_timestamp,
        summaryTimeRange.end_timestamp
      ),
    [
      remainQuota,
      summaryTimeRange.end_timestamp,
      summaryTimeRange.start_timestamp,
      recentRows,
    ]
  )

  const recentTotals = useMemo(
    () =>
      (recentRows ?? []).reduce(
        (total, item) => ({
          quota: total.quota + (Number(item.quota) || 0),
          count: total.count + (Number(item.count) || 0),
        }),
        { quota: 0, count: 0 }
      ),
    [recentRows]
  )
  const recentUsage = recentTotals.quota

  const healthLevel = getHealthLevel(remainQuota, recentUsage)
  const healthCfg = HEALTH_CONFIG[healthLevel]
  const runwayDays = getRunwayDays(remainQuota, recentUsage)
  const runwayText = useRunwayText(remainQuota, runwayDays)
  const walletEnabled = isUserUiFeatureEnabled('wallet')

  const items = useSummaryCardsConfig({
    todayUsageDisplay: formatQuota(recentUsage),
    todayRequestCountDisplay: formatNumber(recentTotals.count),
    usedDisplay: formatQuota(usedQuota),
    requestCountDisplay: formatNumber(requestCount),
  }).map((config, index) => {
    const tones = ['accent-1', 'accent-2', 'accent-3'] as const
    const isRecent = config.key === 'todayUsage'

    return {
      key: config.key,
      title: config.title,
      value: config.value,
      desc: config.description,
      icon: config.icon,
      tone: tones[index] ?? 'accent-3',
      // [user-ui] 只有"近 24 小时"的数字有时间序列；累计数字不配迷你图
      sparkline: isRecent ? sparklineData.usage : undefined,
      loading: isRecent && usageTrendQuery.isLoading,
    }
  })

  return (
    <Card className='gap-0 py-0'>
      <div className='grid lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)]'>
        <section
          aria-labelledby={balanceHeadingId}
          className='border-edge-soft flex flex-col gap-3 border-b-2 p-4 sm:p-5 lg:border-r-2 lg:border-b-0'
        >
          <div className='flex items-center justify-between gap-2'>
            <h3
              id={balanceHeadingId}
              className='text-muted-foreground text-sm font-medium'
            >
              {currencyEnabled
                ? t('usage.overview.balance')
                : t('usage.overview.balanceQuota')}
            </h3>
            <span
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold',
                healthCfg.textClass
              )}
            >
              <span
                className={cn('size-2 rounded-full', healthCfg.dotClass)}
                aria-hidden='true'
              />
              {t(healthCfg.labelKey)}
            </span>
          </div>

          <div className='font-mono text-3xl font-semibold tracking-tight break-all tabular-nums'>
            {formatQuota(remainQuota)}
          </div>
          <p className='text-muted-foreground text-sm'>{runwayText}</p>

          {walletEnabled ? (
            <Button
              className='mt-auto justify-between'
              variant={healthLevel === 'healthy' ? 'outline' : 'default'}
              render={<Link to='/wallet' />}
            >
              <span>
                {healthLevel === 'healthy'
                  ? t('usage.overview.openWallet')
                  : t('usage.overview.topUp')}
              </span>
              <ArrowRight data-icon='inline-end' />
            </Button>
          ) : (
            healthLevel !== 'healthy' && (
              <p className='text-muted-foreground mt-auto text-xs'>
                {t('usage.overview.contactAdmin')}
              </p>
            )
          )}
        </section>

        <section
          aria-labelledby={usageHeadingId}
          className='flex min-w-0 flex-col gap-3 p-4 sm:p-5'
        >
          <div className='flex flex-col gap-0.5'>
            <h3 id={usageHeadingId} className='text-sm font-semibold'>
              {t('usage.overview.usageTitle')}
            </h3>
            <p className='text-muted-foreground text-xs sm:text-sm'>
              {t('usage.overview.usageDescription')}
            </p>
          </div>
          <StaggerContainer className='grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3'>
            {items.map((it) => (
              <StaggerItem key={it.key} className='bg-muted/50 rounded-lg p-3'>
                <StatCard
                  title={it.title}
                  value={it.value}
                  description={it.desc}
                  icon={it.icon}
                  tone={it.tone}
                  sparkline={it.sparkline}
                  sparklineVariant='line'
                  loading={it.loading}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </section>
      </div>
    </Card>
  )
}
