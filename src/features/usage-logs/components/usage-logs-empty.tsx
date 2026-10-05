/*
 * [user-ui] 调用记录 / 任务记录的空状态（本仓库新增文件，非官方代码）。
 *
 * Upstream showed one sentence for every log page ("No usage logs available.
 * Logs will appear here once API calls are made."), also on the task pages and
 * also when a filter simply matched nothing (audit 2.6 L7, 2.7 T4). Here the
 * message depends on why the list is empty:
 * - a filter is set → "nothing matches", with a button that clears filters;
 * - only the time range is set → say what will appear here and offer the
 *   last 30 days, the docs and (when enabled) the playground.
 */
/* eslint-disable react-refresh/only-export-components */
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import type { NavGroup } from '@/components/layout/types'
import { Button } from '@/components/ui/button'
import { useSidebarConfig } from '@/hooks/use-sidebar-config'

import { LOG_TYPE_ALL_VALUE } from '../constants'
import { getPresetRange } from '../lib/time-range-presets'
import { getDefaultTimeRange } from '../lib/utils'
import type { LogCategory } from '../types'

const route = getRouteApi('/_authenticated/usage-logs/$section')

const DAY_MS = 24 * 60 * 60 * 1000

// The playground can be switched off by the admin or the user (sidebar
// modules); only link to it when the sidebar would show it.
const PLAYGROUND_NAV: NavGroup[] = [
  { title: 'playground', items: [{ title: 'playground', url: '/playground' }] },
]

type UsageLogsSearch = ReturnType<typeof route.useSearch>

function hasValue(value: unknown): boolean {
  return value != null && value !== ''
}

/** Whether any filter other than the time range is applied. */
export function hasNonTimeFilters(
  logCategory: LogCategory,
  search: UsageLogsSearch
): boolean {
  if (logCategory !== 'common') {
    return hasValue(search.filter) || hasValue(search.channel)
  }
  const types: unknown[] = Array.isArray(search.type) ? search.type : []
  const hasType = types.some((type) => String(type) !== LOG_TYPE_ALL_VALUE)
  return (
    hasType ||
    [
      search.model,
      search.token,
      search.group,
      search.channel,
      search.username,
      search.requestId,
      search.upstreamRequestId,
    ].some(hasValue)
  )
}

export interface UsageLogsEmptyState {
  title: string
  description: string
  action: ReactNode
}

export function useUsageLogsEmptyState(
  logCategory: LogCategory
): UsageLogsEmptyState {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = route.useSearch()
  const playgroundVisible =
    (useSidebarConfig(PLAYGROUND_NAV)[0]?.items.length ?? 0) > 0

  const filtered = hasNonTimeFilters(logCategory, search)
  const coversLast30Days = useMemo(() => {
    const fallback = getDefaultTimeRange()
    const start = search.startTime ?? fallback.start.getTime()
    const end = search.endTime ?? fallback.end.getTime()
    return end - start >= 29 * DAY_MS
  }, [search.endTime, search.startTime])

  if (filtered) {
    return {
      title: t('logs.empty.filteredTitle'),
      description: t('logs.empty.filteredDesc'),
      action: (
        <Button
          type='button'
          variant='outline'
          onClick={() =>
            void navigate({
              to: '/usage-logs/$section',
              params: { section: logCategory },
              search: { page: 1 },
            })
          }
        >
          {t('logs.empty.clearFilters')}
        </Button>
      ),
    }
  }

  const showLast30Days = () => {
    const range = getPresetRange('30d')
    void navigate({
      to: '/usage-logs/$section',
      params: { section: logCategory },
      search: {
        ...search,
        page: 1,
        startTime: range.start.getTime(),
        endTime: range.end.getTime(),
      },
    })
  }

  let title = t('logs.empty.callsTitle')
  let description = t('logs.empty.callsDesc')
  if (logCategory === 'task') {
    title = t('logs.empty.tasksTitle')
    description = t('logs.empty.tasksDesc')
  } else if (logCategory === 'drawing') {
    title = t('logs.empty.tasksTitle')
    description = t('logs.empty.drawingDesc')
  }

  return {
    title,
    description,
    action: (
      <div className='flex flex-wrap items-center justify-center gap-2'>
        {!coversLast30Days && (
          <Button type='button' variant='outline' onClick={showLast30Days}>
            {t('logs.empty.showLast30Days')}
          </Button>
        )}
        {logCategory === 'common' && playgroundVisible && (
          <Button
            variant='outline'
            nativeButton={false}
            render={<Link to='/playground' />}
          >
            {t('logs.empty.tryPlayground')}
          </Button>
        )}
        <Button
          variant='outline'
          nativeButton={false}
          render={<Link to='/docs' />}
        >
          {t('logs.empty.readDocs')}
        </Button>
      </div>
    ),
  }
}
