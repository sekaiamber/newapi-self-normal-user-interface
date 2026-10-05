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
// [user-ui] 订单记录弹窗：标题改"订单记录"并注明只含最近 30 天（官方文档 guide/feature-guide/user/wallet.md）；
// 状态文字走 i18n（官方直接显示英文 Success/Pending）；支付方式优先显示后台配置的名称；
// 实付金额不再用红色；复制订单号改用共享 CopyButton；记录列表改为一个 2px 外框 + 1px 分隔的列表。
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Dialog } from '@/components/dialog'
import { StatusBadge } from '@/components/status-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { formatNumber } from '@/lib/format'

import { useBillingHistory } from '../../hooks/use-billing-history'
import {
  getStatusConfig,
  getPaymentMethodName,
  formatTimestamp,
} from '../../lib/billing'
import type { PaymentMethod } from '../../types'

interface BillingHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 后台配置的充值方式，用来把订单里的类型显示成配置的名称 */
  payMethods?: PaymentMethod[]
}

const LIST_BOX =
  'border-edge-soft divide-border divide-y rounded-lg border-2 bg-card'

function RecordsSkeleton() {
  return (
    <div className={LIST_BOX}>
      {['a', 'b', 'c', 'd'].map((key) => (
        <div key={key} className='space-y-3 p-3 sm:p-4'>
          <div className='flex items-start justify-between'>
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-48' />
              <Skeleton className='h-3 w-32' />
            </div>
            <Skeleton className='h-5 w-16' />
          </div>
          <div className='grid grid-cols-3 gap-3'>
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-full' />
          </div>
        </div>
      ))}
    </div>
  )
}

export function BillingHistoryDialog({
  open,
  onOpenChange,
  payMethods,
}: BillingHistoryDialogProps) {
  const { t } = useTranslation()
  const {
    records,
    total,
    page,
    pageSize,
    keyword,
    loading,
    completing,
    isAdmin,
    handlePageChange,
    handlePageSizeChange,
    handleSearch,
    handleCompleteOrder,
  } = useBillingHistory()

  const [confirmTradeNo, setConfirmTradeNo] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const resolveMethodName = (type: string) =>
    payMethods?.find((m) => m.type === type)?.name ||
    getPaymentMethodName(type, t)

  const handleConfirmComplete = async () => {
    if (confirmTradeNo) {
      const success = await handleCompleteOrder(confirmTradeNo)
      if (success) {
        setConfirmTradeNo(null)
      }
    }
  }

  const renderRecords = () => {
    if (loading) return <RecordsSkeleton />
    if (records.length === 0) {
      return (
        <div className='text-muted-foreground border-edge-soft flex min-h-40 flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center'>
          <p className='text-foreground text-sm font-medium'>
            {t('wallet.billing.empty')}
          </p>
          <p className='mt-1 text-xs'>
            {keyword
              ? t('Try adjusting your search')
              : t('wallet.billing.emptyHint')}
          </p>
        </div>
      )
    }
    return (
      <ul className={LIST_BOX}>
        {records.map((record) => {
          const statusConfig = getStatusConfig(record.status)
          return (
            <li key={record.id} className='p-3 sm:p-4'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0 flex-1 space-y-1'>
                  <div className='flex min-w-0 items-center gap-1.5'>
                    <code className='text-foreground truncate font-mono text-sm'>
                      {record.trade_no}
                    </code>
                    <CopyButton
                      value={record.trade_no}
                      size='icon'
                      className='size-6'
                      iconClassName='size-3.5'
                      aria-label={t('wallet.billing.copyOrderNo')}
                    />
                    {isAdmin && record.user_id != null && (
                      <StatusBadge
                        label={`${t('User ID')}: ${record.user_id}`}
                        variant='neutral'
                        size='sm'
                        copyText={String(record.user_id)}
                      />
                    )}
                  </div>
                  <div className='text-muted-foreground font-mono text-xs tabular-nums'>
                    {formatTimestamp(record.create_time)}
                  </div>
                </div>
                <StatusBadge
                  label={t(statusConfig.label)}
                  variant={statusConfig.variant}
                  showDot
                  copyable={false}
                />
              </div>

              <dl className='mt-3 grid grid-cols-3 gap-3 text-sm'>
                <div className='min-w-0 space-y-0.5'>
                  <dt className='text-muted-foreground text-xs'>
                    {t('wallet.billing.method')}
                  </dt>
                  <dd className='truncate font-medium'>
                    {resolveMethodName(record.payment_method)}
                  </dd>
                </div>
                <div className='min-w-0 space-y-0.5'>
                  <dt className='text-muted-foreground text-xs'>
                    {t('wallet.billing.quota')}
                  </dt>
                  <dd className='font-mono font-semibold tabular-nums'>
                    {formatCurrencyFromUSD(record.amount, {
                      digitsLarge: 2,
                      digitsSmall: 2,
                      abbreviate: false,
                    })}
                  </dd>
                </div>
                <div className='min-w-0 space-y-0.5'>
                  <dt className='text-muted-foreground text-xs'>
                    {t('wallet.billing.paid')}
                  </dt>
                  <dd className='font-mono font-semibold tabular-nums'>
                    {formatNumber(record.money)}
                  </dd>
                </div>
              </dl>

              {isAdmin && record.status === 'pending' && (
                <div className='mt-3 flex justify-end'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setConfirmTradeNo(record.trade_no)}
                    disabled={completing}
                  >
                    {t('Complete Order')}
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        title={t('wallet.billing.title')}
        description={t('wallet.billing.description')}
        contentClassName='flex max-h-[calc(100dvh-2rem)] flex-col max-sm:w-screen max-sm:max-w-none max-sm:rounded-none max-sm:p-4 sm:max-w-3xl'
        contentHeight='auto'
        bodyClassName='space-y-3'
      >
        <div className='min-h-0 space-y-3'>
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Search
                className='text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2'
                aria-hidden
              />
              <Input
                placeholder={t('Search by order number...')}
                aria-label={t('Search by order number...')}
                value={keyword}
                onChange={(e) => handleSearch(e.target.value)}
                className='h-9 pl-10'
              />
            </div>
            <Select
              items={[
                { value: '10', label: t('10 / page') },
                { value: '20', label: t('20 / page') },
                { value: '50', label: t('50 / page') },
                { value: '100', label: t('100 / page') },
              ]}
              value={pageSize.toString()}
              onValueChange={(value) =>
                value !== null && handlePageSizeChange(Number.parseInt(value))
              }
            >
              <SelectTrigger className='h-9 w-28 shrink-0 sm:w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value='10'>{t('10 / page')}</SelectItem>
                  <SelectItem value='20'>{t('20 / page')}</SelectItem>
                  <SelectItem value='50'>{t('50 / page')}</SelectItem>
                  <SelectItem value='100'>{t('100 / page')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className='max-h-[min(54vh,520px)] overflow-y-auto pr-1'>
            {renderRecords()}
          </div>

          {!loading && records.length > 0 && (
            <div className='border-border flex flex-col items-center gap-3 border-t pt-4 sm:flex-row sm:justify-between'>
              <div className='text-muted-foreground text-xs tabular-nums sm:text-sm'>
                {t('wallet.billing.range', {
                  from: (page - 1) * pageSize + 1,
                  to: Math.min(page * pageSize, total),
                  total,
                })}
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='icon-sm'
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  aria-label={t('Previous page')}
                >
                  <ChevronLeft />
                </Button>
                <div className='text-muted-foreground flex items-center gap-1 font-mono text-sm tabular-nums'>
                  <span className='text-foreground font-medium'>{page}</span>
                  <span>/</span>
                  <span>{totalPages}</span>
                </div>
                <Button
                  variant='outline'
                  size='icon-sm'
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  aria-label={t('Next page')}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      </Dialog>

      {/* Confirm Complete Order Dialog */}
      <AlertDialog
        open={!!confirmTradeNo}
        onOpenChange={(open) => !open && setConfirmTradeNo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Complete Order')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'Are you sure you want to manually complete this order? The user will be credited with the corresponding quota.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={completing}>
              {t('Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmComplete}
              disabled={completing}
            >
              {completing ? t('Processing...') : t('Confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
