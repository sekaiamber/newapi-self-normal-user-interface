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
// [user-ui] 支付确认弹窗：文案改新 key（"到账额度 / 实付金额"，与充值卡片一致），
// 说明确认后会跳转到支付页面（官方文档 guide/feature-guide/user/wallet.md）；
// 绿色写死色改 text-success，金额改等宽数字。
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
import { Skeleton } from '@/components/ui/skeleton'
import { formatLocalCurrencyAmount } from '@/lib/currency'

import { DEFAULT_DISCOUNT_RATE } from '../../constants'
import { formatCurrency, getPaymentIcon } from '../../lib'
import type { PaymentMethod } from '../../types'

interface PaymentConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  topupAmount: number
  paymentAmount: number
  paymentMethod: PaymentMethod | undefined
  calculating: boolean
  processing: boolean
  discountRate?: number
  usdExchangeRate?: number
}

export function PaymentConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  topupAmount,
  paymentAmount,
  paymentMethod,
  calculating,
  processing,
  discountRate = DEFAULT_DISCOUNT_RATE,
  usdExchangeRate = 1,
}: PaymentConfirmDialogProps) {
  const { t } = useTranslation()
  const hasDiscount = discountRate > 0 && discountRate < 1 && paymentAmount > 0
  const originalAmount = hasDiscount ? paymentAmount / discountRate : 0
  const discountAmount = hasDiscount ? originalAmount - paymentAmount : 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-md'>
        <AlertDialogHeader>
          <AlertDialogTitle className='text-xl font-semibold'>
            {t('wallet.confirm.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('wallet.confirm.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <dl className='border-edge-soft divide-border divide-y rounded-lg border-2'>
          <div className='flex items-center justify-between gap-3 px-3 py-2.5'>
            <dt className='text-muted-foreground text-sm'>
              {t('wallet.topup.youGet')}
            </dt>
            <dd className='font-mono text-base font-semibold tabular-nums'>
              {formatLocalCurrencyAmount(topupAmount * usdExchangeRate, {
                digitsLarge: 2,
                digitsSmall: 2,
                abbreviate: false,
              })}
            </dd>
          </div>

          <div className='flex items-center justify-between gap-3 px-3 py-2.5'>
            <dt className='text-muted-foreground text-sm'>
              {t('wallet.topup.youPay')}
            </dt>
            {calculating ? (
              <Skeleton className='h-6 w-24' />
            ) : (
              <dd className='flex items-baseline gap-2'>
                <span className='font-mono text-2xl font-bold tabular-nums'>
                  {formatCurrency(paymentAmount)}
                </span>
                {hasDiscount && (
                  <span className='text-muted-foreground font-mono text-sm tabular-nums line-through'>
                    {formatCurrency(originalAmount)}
                  </span>
                )}
              </dd>
            )}
          </div>

          {hasDiscount && !calculating && (
            <div className='flex items-center justify-between gap-3 px-3 py-2.5 text-sm'>
              <dt className='text-muted-foreground'>
                {t('wallet.confirm.saved')}
              </dt>
              <dd className='text-success font-mono font-semibold tabular-nums'>
                {formatCurrency(discountAmount)}
              </dd>
            </div>
          )}

          <div className='flex items-center justify-between gap-3 px-3 py-2.5'>
            <dt className='text-muted-foreground text-sm'>
              {t('wallet.topup.methodLabel')}
            </dt>
            <dd className='flex min-w-0 items-center gap-2'>
              {getPaymentIcon(
                paymentMethod?.type,
                'size-4',
                paymentMethod?.icon,
                paymentMethod?.name
              )}
              <span className='truncate font-medium'>
                {paymentMethod?.name}
              </span>
            </dd>
          </div>
        </dl>

        <AlertDialogFooter className='grid grid-cols-2 gap-2 sm:flex'>
          <AlertDialogCancel disabled={processing}>
            {t('Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={processing}>
            {processing && <Loader2 className='animate-spin' aria-hidden />}
            {t('wallet.confirm.submit')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
