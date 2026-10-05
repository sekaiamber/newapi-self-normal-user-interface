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
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatLogQuota } from '@/lib/format'
import { requireServerSuccess } from '@/lib/server-error-message'

import { getLogStats, getUserLogStats } from '../api'
import { DEFAULT_LOG_STATS } from '../constants'
import { buildApiParams } from '../lib/utils'
import { useLogsViewScope, useUsageLogsContext } from './usage-logs-provider'

const route = getRouteApi('/_authenticated/usage-logs/$section')

// [user-ui] Plain-language statistics (audit 2.6 L5): "用量 / RPM / TPM"
// became "spend in this range" and "last minute: n requests · m tokens", each
// with an explanation (meaning per guide/feature-guide/user/log.md "Page
// Statistics"). The colored accent bars (palette classes) were dropped.
function StatItem(props: { label: string; value: string; hint: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className='focus-visible:ring-ring inline-flex h-7 cursor-help items-baseline gap-1.5 rounded-sm text-xs outline-none focus-visible:ring-2'
          />
        }
      >
        <span className='text-muted-foreground'>{props.label}</span>
        <span className='text-foreground font-mono font-semibold tabular-nums'>
          {props.value}
        </span>
      </TooltipTrigger>
      <TooltipContent className='max-w-64'>{props.hint}</TooltipContent>
    </Tooltip>
  )
}

export function CommonLogsStats() {
  const { t } = useTranslation()
  const { isAdminView: isAdmin } = useLogsViewScope()
  const searchParams = route.useSearch()
  const { sensitiveVisible } = useUsageLogsContext()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['usage-logs-stats', isAdmin, searchParams],
    queryFn: async () => {
      const params = buildApiParams({
        page: 1,
        pageSize: 1,
        searchParams,
        columnFilters: [],
        isAdmin,
      })

      const result = isAdmin
        ? requireServerSuccess(await getLogStats(params))
        : requireServerSuccess(await getUserLogStats(params))

      return result.success
        ? result.data || DEFAULT_LOG_STATS
        : DEFAULT_LOG_STATS
    },
    placeholderData: (previousData) => previousData,
  })

  if (isLoading) {
    return (
      <div className='flex items-center gap-4'>
        <Skeleton className='h-5 w-[120px] rounded-sm' />
        <Skeleton className='h-5 w-[180px] rounded-sm' />
      </div>
    )
  }

  return (
    <div className='flex flex-wrap items-center gap-x-4 gap-y-1'>
      <StatItem
        label={t('logs.stats.spend')}
        value={sensitiveVisible ? formatLogQuota(stats?.quota || 0) : '••••'}
        hint={t('logs.stats.spendHint')}
      />
      <StatItem
        label={t('logs.stats.lastMinute')}
        value={t('logs.stats.lastMinuteValue', {
          requests: stats?.rpm || 0,
          tokens: stats?.tpm || 0,
        })}
        hint={t('logs.stats.lastMinuteHint')}
      />
    </div>
  )
}
