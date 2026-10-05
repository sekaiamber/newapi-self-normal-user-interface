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
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table'
import { Database, Plus } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DISABLED_ROW_DESKTOP,
  DISABLED_ROW_MOBILE,
  DataTablePage,
  useDebouncedColumnFilter,
  useDataTable,
} from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { createServerError } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'

import { getApiKeys, searchApiKeys } from '../api'
import {
  API_KEY_STATUS,
  API_KEY_STATUS_OPTIONS,
  API_KEY_STATUSES,
  ERROR_MESSAGES,
} from '../constants'
import { useUserGroupInfo } from '../hooks/use-user-group-info'
import {
  API_KEYS_COLUMN_VISIBILITY_STORAGE_KEY,
  API_KEYS_DEFAULT_COLUMN_VISIBILITY,
} from '../lib/column-defaults'
import type { ApiKey } from '../types'
import { ApiKeyQuotaCell } from './api-key-quota-cell'
import { ApiKeyActivityCell } from './api-key-timestamp-cell'
import {
  ApiKeyCell,
  ModelLimitsCell,
  IpRestrictionsCell,
} from './api-keys-cells'
import { useApiKeysColumns } from './api-keys-columns'
import { useApiKeys } from './api-keys-provider'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { DataTableRowActions } from './data-table-row-actions'

const route = getRouteApi('/_authenticated/keys/')
const API_KEYS_MOBILE_SKELETON_IDS = Array.from(
  { length: 5 },
  (_, index) => `api-key-mobile-skeleton-${index + 1}`
)

function isDisabledApiKeyRow(apiKey: ApiKey) {
  return apiKey.status !== API_KEY_STATUS.ENABLED
}

function ApiKeysMobileSkeleton() {
  return (
    <div className='min-w-0 space-y-3'>
      {API_KEYS_MOBILE_SKELETON_IDS.map((id) => (
        <div
          key={id}
          className='border-edge-soft bg-card space-y-2 rounded-lg border-2 p-3.5'
        >
          <div className='flex items-center justify-between'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-5 w-16 rounded-md' />
          </div>
          <div className='flex items-center justify-between gap-3'>
            <Skeleton className='h-7 w-44' />
            <Skeleton className='h-8 w-16' />
          </div>
          <Skeleton className='h-3 w-28' />
        </div>
      ))}
    </div>
  )
}

type ApiKeysEmptyCopy = {
  title: string
  description: string
  action?: ReactNode
}

// [user-ui] 手机卡片精简（审计 2.5 K3/K5）：名称+状态、密钥+操作、额度、时间与过期；
// 线路只在账户有多个可选线路时显示；模型/IP 限制只在设置了限制时显示。
// 卡片改为品牌的 2px 边、小圆角。空状态带"创建第一个密钥"按钮（审计 2.5 K2）。
function ApiKeysMobileList({
  table,
  isLoading,
  now,
  showGroup,
  empty,
}: {
  table: TanstackTable<ApiKey>
  isLoading: boolean
  now: number
  showGroup: boolean
  empty: ApiKeysEmptyCopy
}) {
  const { t } = useTranslation()
  const rows = table.getRowModel().rows

  if (isLoading) return <ApiKeysMobileSkeleton />

  if (!rows.length) {
    return (
      <div className='border-edge-soft rounded-lg border-2 p-8'>
        <Empty className='border-none p-0'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Database className='size-6' />
            </EmptyMedia>
            <EmptyTitle>{empty.title}</EmptyTitle>
            <EmptyDescription>{empty.description}</EmptyDescription>
          </EmptyHeader>
          {empty.action != null && <EmptyContent>{empty.action}</EmptyContent>}
        </Empty>
      </div>
    )
  }

  return (
    <div className='min-w-0 space-y-3'>
      {rows.map((row) => {
        const apiKey = row.original
        const statusConfig = API_KEY_STATUSES[apiKey.status]
        const groupCell = row
          .getAllCells()
          .find((cell) => cell.column.id === 'group')
        const expiryCell = row
          .getAllCells()
          .find((cell) => cell.column.id === 'expired_time')
        const hasModelLimits =
          apiKey.model_limits_enabled && Boolean(apiKey.model_limits)
        const hasIpLimits = Boolean(apiKey.allow_ips?.trim())

        return (
          <div
            key={row.id}
            className={cn(
              'border-edge-soft bg-card min-w-0 space-y-2 rounded-lg border-2 p-3.5 text-xs leading-4',
              isDisabledApiKeyRow(apiKey) && DISABLED_ROW_MOBILE
            )}
          >
            <div className='flex items-start justify-between gap-3'>
              <div className='min-w-0'>
                <div className='text-sm leading-5 font-semibold break-words'>
                  {apiKey.name}
                </div>
              </div>
              {statusConfig && (
                <StatusBadge
                  label={t(statusConfig.label)}
                  variant={statusConfig.variant}
                  copyable={false}
                  className='shrink-0 px-0 text-xs font-normal'
                />
              )}
            </div>

            <div className='flex min-w-0 items-center justify-between gap-2'>
              <div className='min-w-0 flex-1 [&_button:first-child]:max-w-full [&_button:first-child]:truncate [&_button:first-child]:px-0'>
                <ApiKeyCell apiKey={apiKey} />
              </div>
              <DataTableRowActions row={row} />
            </div>

            <div className='min-w-0 space-y-3 py-1'>
              {showGroup && groupCell && (
                <div className='flex min-w-0 items-center gap-2 text-sm'>
                  <span className='text-muted-foreground shrink-0'>
                    {t('keys.column.group')}
                  </span>
                  <div className='min-w-0 flex-1'>
                    {flexRender(
                      groupCell.column.columnDef.cell,
                      groupCell.getContext()
                    )}
                  </div>
                </div>
              )}
              <ApiKeyQuotaCell apiKey={apiKey} now={now} variant='card' />
            </div>

            {(hasModelLimits || hasIpLimits) && (
              <div className='flex flex-wrap items-center gap-x-5 gap-y-1'>
                {hasModelLimits && (
                  <ModelLimitsCell apiKey={apiKey} detailsTrigger='click' />
                )}
                {hasIpLimits && (
                  <IpRestrictionsCell apiKey={apiKey} detailsTrigger='click' />
                )}
              </div>
            )}

            <div className='grid grid-cols-3 items-start gap-3 border-t pt-2'>
              <div className='col-span-2 min-w-0'>
                <ApiKeyActivityCell
                  apiKey={apiKey}
                  now={now}
                  layout='columns'
                />
              </div>
              <div className='min-w-0 space-y-1 [&_[data-slot=status-badge]]:text-xs [&_[data-slot=status-badge]]:font-normal'>
                <div className='text-muted-foreground'>
                  {t('Expiration Time')}
                </div>
                {expiryCell &&
                  flexRender(
                    expiryCell.column.columnDef.cell,
                    expiryCell.getContext()
                  )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ApiKeysTable() {
  const { t } = useTranslation()
  const { refreshTrigger, setOpen } = useApiKeys()
  const [now, setNow] = useState(() => Date.now())
  const columns = useApiKeysColumns(now)

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 30_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 20 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'status', searchKey: 'status', type: 'array' },
      { columnId: '_tokenSearch', searchKey: 'token', type: 'string' },
    ],
  })

  const {
    value: tokenFilter,
    inputValue: tokenFilterInput,
    setInputValue: setTokenFilterInput,
  } = useDebouncedColumnFilter({
    columnFilters,
    columnId: '_tokenSearch',
    onColumnFiltersChange,
  })
  const shouldSearch = Boolean(globalFilter?.trim() || tokenFilter.trim())

  // Fetch data with React Query
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'keys',
      pagination.pageIndex + 1,
      pagination.pageSize,
      globalFilter,
      tokenFilter,
      refreshTrigger,
    ],
    queryFn: async () => {
      const result = shouldSearch
        ? await searchApiKeys({
            keyword: globalFilter,
            token: tokenFilter,
            p: pagination.pageIndex + 1,
            size: pagination.pageSize,
          })
        : await getApiKeys({
            p: pagination.pageIndex + 1,
            size: pagination.pageSize,
          })

      if (!result.success) {
        throw createServerError(
          result,
          t(
            shouldSearch
              ? ERROR_MESSAGES.SEARCH_FAILED
              : ERROR_MESSAGES.LOAD_FAILED
          )
        )
      }

      return {
        items: result.data?.items || [],
        total: result.data?.total || 0,
      }
    },
    placeholderData: (previousData) => previousData,
  })

  const apiKeys = data?.items || []

  const { table } = useDataTable({
    data: apiKeys,
    columns,
    enableRowSelection: true,
    columnFilters,
    // [user-ui] 线路、模型、IP、时间默认隐藏（审计 2.5 K3）。原来恢复旧版默认列的
    // effect 已删除：新存储键下不存在旧版偏好。
    initialColumnVisibility: API_KEYS_DEFAULT_COLUMN_VISIBILITY,
    columnVisibilityStorageKey: API_KEYS_COLUMN_VISIBILITY_STORAGE_KEY,
    globalFilter,
    pagination,
    globalFilterFn: () => true,
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
    manualPagination: true,
    totalCount: data?.total || 0,
    ensurePageInRange,
  })

  // [user-ui] 账户有多个可选线路时，手机卡片才显示线路（审计 2.5 K5 ①）
  const groupInfo = useUserGroupInfo()
  const showGroupOnMobile = Object.keys(groupInfo.ratios).length > 1

  // [user-ui] 空状态（审计 2.5 K2）：没有任何密钥时给出用途说明和创建按钮；
  // 筛选无结果时沿用原文案，不出现创建按钮。
  const isFiltering =
    shouldSearch ||
    columnFilters.some(
      (filter) => Array.isArray(filter.value) && filter.value.length > 0
    )
  const empty: ApiKeysEmptyCopy = isFiltering
    ? {
        title: t('No API Keys Found'),
        description: t(
          'No API keys available. Create your first API key to get started.'
        ),
      }
    : {
        title: t('keys.empty.title'),
        description: t('keys.empty.description'),
        action: (
          <Button variant='outline' onClick={() => setOpen('create')}>
            <Plus />
            {t('keys.empty.create')}
          </Button>
        ),
      }

  return (
    <DataTablePage
      table={table}
      columns={columns}
      isLoading={isLoading}
      isFetching={isFetching}
      emptyTitle={empty.title}
      emptyDescription={empty.description}
      emptyAction={empty.action}
      skeletonKeyPrefix='api-keys-skeleton'
      applyHeaderSize
      toolbarProps={{
        searchPlaceholder: t('Filter by name...'),
        searchDebounceMs: 500,
        additionalSearch: (
          <Input
            placeholder={t('Filter by API key...')}
            aria-label={t('Filter by API key...')}
            value={tokenFilterInput}
            onChange={(e) => setTokenFilterInput(e.target.value)}
            className='w-full sm:w-50 lg:w-60'
          />
        ),
        filters: [
          {
            columnId: 'status',
            title: t('Status'),
            options: API_KEY_STATUS_OPTIONS,
            singleSelect: true,
          },
        ],
      }}
      mobile={
        <ApiKeysMobileList
          table={table}
          isLoading={isLoading}
          now={now}
          showGroup={showGroupOnMobile}
          empty={empty}
        />
      }
      getRowClassName={(row) =>
        isDisabledApiKeyRow(row.original) ? DISABLED_ROW_DESKTOP : undefined
      }
      bulkActions={<DataTableBulkActions table={table} />}
    />
  )
}
