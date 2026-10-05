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
// [user-ui] 服务状态面板：数据改用共享的 useUptimeGroups（概览页据此决定是否显示本卡片）；
// 状态点改用主题语义色并配文字说明（不只靠颜色）；标题与说明不再出现第三方产品名（审计 2.2 #7）；
// 列表高度随内容变化，最多 18rem 后滚动。
import { Activity, RotateCw } from 'lucide-react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { IconBadge } from '@/components/ui/icon-badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useUptimeGroups } from '@/features/dashboard/hooks/use-uptime-groups'
import type { UptimeMonitor } from '@/features/dashboard/types'
import { cn } from '@/lib/utils'

import { PanelWrapper } from '../ui/panel-wrapper'

// Uptime Kuma 状态码：1 正常、0 故障、2 等待中、3 维护中
const STATUS_META: Record<number, { colorClass: string; labelKey: string }> = {
  1: { colorClass: 'bg-success', labelKey: 'usage.panels.uptime.status.up' },
  0: {
    colorClass: 'bg-destructive',
    labelKey: 'usage.panels.uptime.status.down',
  },
  2: {
    colorClass: 'bg-warning',
    labelKey: 'usage.panels.uptime.status.pending',
  },
  3: {
    colorClass: 'bg-info',
    labelKey: 'usage.panels.uptime.status.maintenance',
  },
}
const DEFAULT_STATUS_META = {
  colorClass: 'bg-muted-foreground/40',
  labelKey: 'usage.panels.uptime.status.unknown',
}

const StatusDot = memo(function StatusDot(props: { status: number }) {
  const { t } = useTranslation()
  const meta = STATUS_META[props.status] ?? DEFAULT_STATUS_META
  const label = t(meta.labelKey)
  return (
    <span
      role='img'
      aria-label={label}
      title={label}
      className={cn(
        'inline-block size-2 shrink-0 rounded-full',
        meta.colorClass
      )}
    />
  )
})

export function UptimePanel() {
  const { t } = useTranslation()
  const uptimeQuery = useUptimeGroups()
  const groups = uptimeQuery.data ?? []
  const refreshing = uptimeQuery.isFetching && !uptimeQuery.isLoading

  return (
    <PanelWrapper
      title={
        <span className='flex items-center gap-2'>
          <IconBadge tone='success' size='sm'>
            <Activity />
          </IconBadge>
          {t('usage.panels.uptime.title')}
        </span>
      }
      description={t('usage.panels.uptime.description')}
      loading={uptimeQuery.isLoading}
      empty={!groups.length}
      emptyMessage={t('No uptime monitoring configured')}
      height='h-40'
      contentClassName='p-0'
      headerActions={
        <Button
          variant='ghost'
          size='sm'
          onClick={() => void uptimeQuery.refetch()}
          disabled={refreshing}
          className='size-7 p-0'
          aria-label={t('Refresh')}
        >
          <RotateCw
            className={cn(
              'size-3.5',
              refreshing && 'animate-spin motion-reduce:animate-none'
            )}
            aria-hidden='true'
          />
        </Button>
      }
    >
      <ScrollArea className='[&>[data-slot=scroll-area-viewport]]:max-h-72'>
        <div>
          {groups.map((group, groupIdx) => (
            <div key={group.categoryName}>
              <div className='bg-muted/30 border-border/60 border-b px-3 py-2 sm:px-5'>
                <div className='flex items-center gap-2'>
                  <h4 className='text-muted-foreground text-xs font-semibold'>
                    {group.categoryName}
                  </h4>
                  <span className='text-muted-foreground font-mono text-xs tabular-nums'>
                    {group.monitors?.length || 0}
                  </span>
                </div>
              </div>

              {group.monitors?.map(
                (monitor: UptimeMonitor, monitorIdx: number) => (
                  <div
                    key={monitor.name}
                    className={cn(
                      'hover:bg-muted/40 flex items-center justify-between gap-2 px-3 py-2 transition-colors sm:px-5 sm:py-2.5',
                      monitorIdx < (group.monitors?.length || 0) - 1 &&
                        'border-border/40 border-b',
                      groupIdx < groups.length - 1 &&
                        monitorIdx === (group.monitors?.length || 0) - 1 &&
                        'border-border/60 border-b'
                    )}
                  >
                    <div className='flex min-w-0 items-center gap-2.5'>
                      <StatusDot status={monitor.status} />
                      <span className='truncate text-sm'>{monitor.name}</span>
                      {monitor.group && (
                        <span className='text-muted-foreground shrink-0 text-xs'>
                          ({monitor.group})
                        </span>
                      )}
                    </div>
                    <span className='text-foreground shrink-0 font-mono text-sm font-semibold tabular-nums'>
                      {((monitor.uptime ?? 0) * 100).toFixed(2)}%
                    </span>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </PanelWrapper>
  )
}
