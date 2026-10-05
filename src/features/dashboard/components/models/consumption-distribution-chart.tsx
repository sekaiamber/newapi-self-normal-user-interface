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
import { VChart } from '@visactor/react-vchart'
import { AreaChart, BarChart3, WalletCards } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IconBadge } from '@/components/ui/icon-badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useThemeCustomization } from '@/context/theme-customization-provider'
import { useTheme } from '@/context/theme-provider'
import {
  CONSUMPTION_DISTRIBUTION_CHART_OPTIONS,
  DEFAULT_TIME_GRANULARITY,
} from '@/features/dashboard/constants'
import { processChartData } from '@/features/dashboard/lib'
import { readChartPalette } from '@/features/dashboard/lib/chart-palette'
import type {
  ConsumptionDistributionChartType,
  QuotaDataItem,
} from '@/features/dashboard/types'
import { formatQuota } from '@/lib/format'
import { useThemeRadiusPx } from '@/lib/theme-radius'
import type { TimeGranularity } from '@/lib/time'
import { VCHART_OPTION } from '@/lib/vchart'

let themeManagerPromise: Promise<
  (typeof import('@visactor/vchart'))['ThemeManager']
> | null = null

interface ConsumptionDistributionChartProps {
  data: QuotaDataItem[]
  loading?: boolean
  timeGranularity?: TimeGranularity
  defaultChartType?: ConsumptionDistributionChartType
}

const CHART_TYPE_ICONS: Record<
  ConsumptionDistributionChartType,
  typeof BarChart3
> = {
  bar: BarChart3,
  area: AreaChart,
}

export function ConsumptionDistributionChart(
  props: ConsumptionDistributionChartProps
) {
  const { t } = useTranslation()
  const { resolvedTheme } = useTheme()
  const { customization } = useThemeCustomization()
  const chartRadius = useThemeRadiusPx(
    '--radius-md',
    `${customization.preset}:${customization.radius}`
  )
  const [chartType, setChartType] = useState<ConsumptionDistributionChartType>(
    props.defaultChartType ?? 'bar'
  )
  const [themeReady, setThemeReady] = useState(false)
  const themeManagerRef = useRef<
    (typeof import('@visactor/vchart'))['ThemeManager'] | null
  >(null)
  const timeGranularity = props.timeGranularity ?? DEFAULT_TIME_GRANULARITY

  useEffect(() => {
    if (props.defaultChartType) setChartType(props.defaultChartType)
  }, [props.defaultChartType])

  useEffect(() => {
    const updateTheme = async () => {
      setThemeReady(false)

      if (!themeManagerPromise) {
        themeManagerPromise = import('@visactor/vchart').then(
          (m) => m.ThemeManager
        )
      }

      const ThemeManager = await themeManagerPromise
      themeManagerRef.current = ThemeManager
      ThemeManager.setCurrentTheme(resolvedTheme === 'dark' ? 'dark' : 'light')
      setThemeReady(true)
    }

    updateTheme()
  }, [resolvedTheme])

  // [user-ui] 配色取自主题 token（lib/chart-palette.ts）。明暗切换时 themeReady 先变 false、
  // 切换完成后变 true，此时重新读取，换上新主题的颜色
  const chartPalette = useMemo(
    () => (themeReady ? (readChartPalette() ?? undefined) : undefined),
    [themeReady]
  )
  const chartData = useMemo(
    () =>
      processChartData(
        props.loading ? [] : props.data,
        timeGranularity,
        t,
        chartRadius,
        chartPalette
      ),
    [props.data, props.loading, timeGranularity, t, chartRadius, chartPalette]
  )
  // [user-ui] 合计用与统计卡相同的格式（官方保留 2 位小数，小额会显示成 $0.01，与卡片对不上）
  const totalQuotaDisplay = useMemo(
    () =>
      formatQuota(
        props.loading
          ? 0
          : props.data.reduce((sum, item) => sum + (Number(item.quota) || 0), 0)
      ),
    [props.data, props.loading]
  )
  const spec = chartType === 'bar' ? chartData.spec_line : chartData.spec_area
  const specType = typeof spec?.type === 'string' ? spec.type : chartType
  const chartKey = [
    chartType,
    specType,
    props.loading ? 'loading' : 'ready',
    props.data.length,
    resolvedTheme,
    customization.preset,
  ].join('-')

  return (
    // [user-ui] 品牌 2px 边卡片；标题写明"按模型的消耗"（原"消耗分布"）；图表类型切换改用共享 Tabs
    // （原为手写按钮，没有选中状态的无障碍属性）
    <div className='bg-card border-edge-soft overflow-hidden rounded-lg border-2'>
      <div className='flex w-full flex-col gap-1.5 border-b px-3 py-2 sm:gap-3 sm:px-5 sm:py-3 lg:flex-row lg:items-center lg:justify-between'>
        <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <IconBadge tone='success' size='sm'>
            <WalletCards />
          </IconBadge>
          <div className='text-sm font-semibold'>
            {t('usage.stats.chart.spend')}
          </div>
          <span className='text-muted-foreground font-mono text-xs tabular-nums'>
            {t('Total:')} {totalQuotaDisplay}
          </span>
        </div>

        <Tabs
          value={chartType}
          onValueChange={(value) =>
            setChartType(value as ConsumptionDistributionChartType)
          }
          className='shrink-0'
        >
          <TabsList aria-label={t('usage.stats.chart.type')}>
            {CONSUMPTION_DISTRIBUTION_CHART_OPTIONS.map((item) => {
              const Icon = CHART_TYPE_ICONS[item.value]
              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className='gap-1.5 px-2.5 text-xs'
                >
                  <Icon data-icon='inline-start' aria-hidden='true' />
                  {t(item.labelKey)}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
      </div>

      <div className='h-[300px] p-1.5 sm:h-96 sm:p-2'>
        {themeReady && spec && (
          <VChart
            key={chartKey}
            spec={{
              ...spec,
              theme: resolvedTheme === 'dark' ? 'dark' : 'light',
              background: 'transparent',
            }}
            option={VCHART_OPTION}
          />
        )}
      </div>
    </div>
  )
}
