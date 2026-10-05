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
// [user-ui] Creem 商品改为真正的按钮（官方是带 onClick 的 Card，键盘无法操作）；
// 价格与额度用等宽数字，价格不再用金色文字（浅色背景对比度不足）。
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatNumber } from '@/lib/format'

import { formatCreemPrice } from '../lib/format'
import type { CreemProduct } from '../types'

interface CreemProductsSectionProps {
  products: CreemProduct[]
  onProductSelect: (product: CreemProduct) => void
  loading?: boolean
}

export function CreemProductsSection({
  products,
  onProductSelect,
  loading,
}: CreemProductsSectionProps) {
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3'>
        {['a', 'b', 'c'].map((key) => (
          <Skeleton key={key} className='h-20 rounded-lg' />
        ))}
      </div>
    )
  }

  if (!Array.isArray(products) || products.length === 0) {
    return null
  }

  return (
    <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3'>
      {products.map((product) => (
        <Button
          key={product.productId}
          variant='outline'
          className='h-auto min-h-20 flex-col items-start gap-1 px-3 py-2.5 text-left whitespace-normal sm:px-4'
          onClick={() => onProductSelect(product)}
        >
          <span className='w-full truncate text-sm font-semibold'>
            {product.name}
          </span>
          <span className='font-mono text-lg font-bold tabular-nums'>
            {formatCreemPrice(product.price, product.currency)}
          </span>
          <span className='text-muted-foreground text-xs font-normal'>
            {t('Quota')}:{' '}
            <span className='font-mono tabular-nums'>
              {formatNumber(product.quota)}
            </span>
          </span>
        </Button>
      ))}
    </div>
  )
}
