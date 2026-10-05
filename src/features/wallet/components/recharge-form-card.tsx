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
// [user-ui] 在线充值卡片重绘：
// - 流程改为"选额度 → 选支付方式 → 唯一的主按钮去支付"（官方是每个支付方式按钮直接下单，没有主操作）；
// - 兑换码移到独立的 RedemptionCard，订单记录移到页面标题栏；
// - 支付方式名称与图标只用后台配置值；颜色改语义 token，金额用等宽数字；
// - 文案改为覆盖层 wallet.* 新 key（官方写死的 "Pay / Save / Minimum" 英文一并修正）。
// 下单、计算金额仍走 index.tsx 里官方的处理函数，本组件只负责展示与收集选择。
import { Loader2, WalletCards } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'

import { formatCurrency, getMinTopupAmount } from '../lib'
import type { PaymentOption } from '../lib/payment-options'
import { SECTION_LABEL, formatTopupQuota } from '../lib/topup-ui'
import type { CreemProduct, PresetAmount, TopupInfo } from '../types'
import { CreemProductsSection } from './creem-products-section'
import { PaymentOptionPicker } from './payment-option-picker'
import { TopupAmountPicker } from './topup-amount-picker'

interface RechargeFormCardProps {
  topupInfo: TopupInfo | null
  /** 是否启用了"选金额 + 选方式"的充值通道 */
  configurableTopup: boolean
  presetAmounts: PresetAmount[]
  selectedPreset: number | null
  onSelectPreset: (preset: PresetAmount) => void
  topupAmount: number
  onTopupAmountChange: (amount: number) => void
  paymentAmount: number
  calculating: boolean
  paymentOptions: PaymentOption[]
  selectedOptionKey: string | null
  onSelectOption: (key: string) => void
  onCheckout: () => void
  checkoutLoading: boolean
  priceRatio?: number
  usdExchangeRate?: number
  creemProducts?: CreemProduct[]
  onCreemProductSelect?: (product: CreemProduct) => void
}

function getCheckoutBlocker(
  option: PaymentOption | null,
  topupAmount: number,
  t: (key: string, options?: Record<string, unknown>) => string
): string | null {
  if (!option) return t('wallet.topup.selectMethod')
  if (topupAmount < option.minTopup || topupAmount <= 0) {
    return t('wallet.topup.belowMin', { amount: option.minTopup })
  }
  return null
}

export function RechargeFormCard(props: RechargeFormCardProps) {
  const { t } = useTranslation()
  const priceRatio = props.priceRatio ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const minTopup = getMinTopupAmount(props.topupInfo)
  const hasOptions = props.paymentOptions.length > 0
  const selectedOption =
    props.paymentOptions.find((o) => o.key === props.selectedOptionKey) ?? null
  const blocker = getCheckoutBlocker(selectedOption, props.topupAmount, t)
  const hasCreem =
    Array.isArray(props.creemProducts) &&
    props.creemProducts.length > 0 &&
    !!props.onCreemProductSelect

  return (
    <TitledCard
      title={t('wallet.topup.title')}
      description={t('wallet.topup.description')}
      icon={<WalletCards />}
      iconTone='primary'
      disableHoverEffect
      contentClassName='space-y-5 sm:space-y-6'
    >
      {props.configurableTopup && (
        <>
          <TopupAmountPicker
            topupInfo={props.topupInfo}
            presetAmounts={props.presetAmounts}
            selectedPreset={props.selectedPreset}
            onSelectPreset={props.onSelectPreset}
            topupAmount={props.topupAmount}
            onTopupAmountChange={props.onTopupAmountChange}
            minTopup={minTopup}
            priceRatio={priceRatio}
            usdExchangeRate={usdExchangeRate}
          />

          {hasOptions ? (
            <PaymentOptionPicker
              options={props.paymentOptions}
              selectedKey={props.selectedOptionKey}
              onSelect={props.onSelectOption}
              topupAmount={props.topupAmount}
              disabled={props.checkoutLoading}
            />
          ) : (
            <Alert>
              <AlertDescription>{t('wallet.topup.noMethods')}</AlertDescription>
            </Alert>
          )}

          {hasOptions && (
            <div className='border-border space-y-3 border-t pt-4 sm:pt-5'>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
                <dl className='grid grid-cols-2 gap-x-6 gap-y-1 sm:flex sm:gap-8'>
                  <div className='space-y-0.5'>
                    <dt className='text-muted-foreground text-xs'>
                      {t('wallet.topup.youGet')}
                    </dt>
                    <dd className='font-mono text-base font-semibold tabular-nums'>
                      {formatTopupQuota(props.topupAmount, usdExchangeRate)}
                    </dd>
                  </div>
                  <div className='space-y-0.5'>
                    <dt className='text-muted-foreground text-xs'>
                      {t('wallet.topup.youPay')}
                    </dt>
                    <dd className='font-mono text-xl font-bold tabular-nums'>
                      {props.calculating ? (
                        <Skeleton className='mt-1 h-6 w-20' />
                      ) : (
                        formatCurrency(props.paymentAmount)
                      )}
                    </dd>
                  </div>
                </dl>
                <Button
                  size='lg'
                  className='w-full sm:w-auto sm:min-w-40'
                  onClick={props.onCheckout}
                  disabled={!!blocker || props.checkoutLoading}
                  aria-describedby={blocker ? 'topup-checkout-hint' : undefined}
                >
                  {props.checkoutLoading && (
                    <Loader2 className='animate-spin' aria-hidden />
                  )}
                  {t('wallet.topup.payButton')}
                </Button>
              </div>
              {blocker && (
                <p
                  id='topup-checkout-hint'
                  className='text-muted-foreground text-xs sm:text-right'
                >
                  {blocker}
                </p>
              )}
              <p className='text-muted-foreground text-xs'>
                {t('wallet.topup.callbackNote')}
              </p>
            </div>
          )}
        </>
      )}

      {hasCreem && (
        <div
          className={
            props.configurableTopup
              ? 'border-border space-y-2.5 border-t pt-4 sm:pt-5'
              : 'space-y-2.5'
          }
        >
          <div className={SECTION_LABEL}>{t('wallet.topup.creemLabel')}</div>
          <CreemProductsSection
            products={props.creemProducts ?? []}
            onProductSelect={(product) => props.onCreemProductSelect?.(product)}
          />
        </div>
      )}
    </TitledCard>
  )
}
