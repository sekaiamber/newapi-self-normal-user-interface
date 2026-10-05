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
// [user-ui] Creem 确认弹窗：与充值确认弹窗同样的明细框；价格不用金色文字，金额改等宽数字；
// 说明确认后会跳转到支付页面。
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/format'

import { formatCreemPrice } from '../../lib/format'
import type { CreemProduct } from '../../types'

interface CreemConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  product: CreemProduct | null
  processing: boolean
}

export function CreemConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  product,
  processing,
}: CreemConfirmDialogProps) {
  const { t } = useTranslation()

  if (!product) return null

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('wallet.confirm.title')}
      description={t('wallet.confirm.description')}
      contentClassName='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-[425px]'
      footerClassName='grid grid-cols-2 gap-2 sm:flex'
      contentHeight='auto'
      bodyClassName='space-y-4'
      footer={
        <>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            {t('Cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={processing}>
            {processing && <Loader2 className='animate-spin' aria-hidden />}
            {t('wallet.confirm.submit')}
          </Button>
        </>
      }
    >
      <dl className='border-edge-soft divide-border divide-y rounded-lg border-2'>
        <div className='flex items-center justify-between gap-3 px-3 py-2.5'>
          <dt className='text-muted-foreground text-sm'>{t('Product')}</dt>
          <dd className='truncate font-medium'>{product.name}</dd>
        </div>
        <div className='flex items-center justify-between gap-3 px-3 py-2.5'>
          <dt className='text-muted-foreground text-sm'>
            {t('wallet.topup.youPay')}
          </dt>
          <dd className='font-mono text-lg font-bold tabular-nums'>
            {formatCreemPrice(product.price, product.currency)}
          </dd>
        </div>
        <div className='flex items-center justify-between gap-3 px-3 py-2.5'>
          <dt className='text-muted-foreground text-sm'>{t('Quota')}</dt>
          <dd className='font-mono font-medium tabular-nums'>
            {formatNumber(product.quota)}
          </dd>
        </div>
      </dl>
    </Dialog>
  )
}
