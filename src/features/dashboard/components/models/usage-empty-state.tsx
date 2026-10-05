/*
 * [user-ui] 用量统计的空状态（本仓库新增文件，非官方代码）。
 *
 * 所选时间内没有调用时，原页面会画出两张 0–1 的空坐标轴，看不出是"没有数据"还是"还没加载"
 * （审计 2.3 #3、2.4 #3）。这里复用共享的 EmptyState，说明原因并给出下一步。
 */
import { Link } from '@tanstack/react-router'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface UsageEmptyStateProps {
  description?: string
}

export function UsageEmptyState(props: UsageEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <Card className='py-0'>
      <EmptyState
        icon={BarChart3}
        className='min-h-[260px]'
        title={t('usage.stats.empty.title')}
        description={props.description ?? t('usage.stats.empty.description')}
        action={
          <div className='flex flex-wrap justify-center gap-2'>
            <Button render={<Link to='/playground' />}>
              {t('usage.stats.empty.tryPlayground')}
            </Button>
            <Button variant='outline' render={<Link to='/usage-logs' />}>
              {t('usage.stats.empty.viewLogs')}
            </Button>
          </div>
        }
      />
    </Card>
  )
}
