/*
 * [user-ui] 充值额度选择：预设额度 + 自定义数量（本仓库新增文件，非官方代码）。
 * Adapted from QuantumNous/new-api web/src/features/wallet/components/recharge-form-card.tsx @ v1.0.0-rc.37 (AGPL-3.0)
 *
 * 与官方的差异：预设块标注选中状态（aria-pressed）；"实付/省/优惠"文案走 i18n（官方是写死的英文）；
 * 颜色改用语义 token；数字用等宽字体。计算公式沿用官方 calculatePresetPricing。
 */
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { DEFAULT_DISCOUNT_RATE } from '../constants'
import { calculatePresetPricing, formatCurrency } from '../lib'
import { SECTION_LABEL, SELECTED_TILE, formatTopupQuota } from '../lib/topup-ui'
import type { PresetAmount, TopupInfo } from '../types'

interface TopupAmountPickerProps {
  topupInfo: TopupInfo | null
  presetAmounts: PresetAmount[]
  selectedPreset: number | null
  onSelectPreset: (preset: PresetAmount) => void
  topupAmount: number
  onTopupAmountChange: (amount: number) => void
  minTopup: number
  priceRatio: number
  usdExchangeRate: number
}

export function TopupAmountPicker(props: TopupAmountPickerProps) {
  const { t } = useTranslation()
  const [localAmount, setLocalAmount] = useState(props.topupAmount.toString())

  useEffect(() => {
    // Empty string must survive, otherwise the field can never be cleared
    setLocalAmount((prev) =>
      prev === '' && props.topupAmount === 0
        ? prev
        : props.topupAmount.toString()
    )
  }, [props.topupAmount])

  const handleAmountChange = (value: string) => {
    setLocalAmount(value)
    const numValue = Number.parseInt(value) || 0
    if (numValue >= 0) {
      props.onTopupAmountChange(numValue)
    }
  }

  return (
    <div className='space-y-4'>
      {props.presetAmounts.length > 0 && (
        <div className='space-y-2.5'>
          <div id='topup-amount-label' className={SECTION_LABEL}>
            {t('wallet.topup.amountLabel')}
          </div>
          <div
            role='group'
            aria-labelledby='topup-amount-label'
            className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3'
          >
            {props.presetAmounts.map((preset) => {
              const discount =
                preset.discount ||
                props.topupInfo?.discount?.[preset.value] ||
                DEFAULT_DISCOUNT_RATE
              const pricing = calculatePresetPricing(
                preset.value,
                props.priceRatio,
                discount,
                props.usdExchangeRate
              )
              const selected = props.selectedPreset === preset.value
              return (
                <Button
                  key={preset.value}
                  variant='outline'
                  aria-pressed={selected}
                  className={cn(
                    'relative h-auto min-h-16 flex-col items-start gap-1 px-3 py-2.5 text-left whitespace-normal sm:px-4',
                    selected && SELECTED_TILE
                  )}
                  onClick={() => props.onSelectPreset(preset)}
                >
                  <span className='flex w-full items-center justify-between gap-2'>
                    <span className='font-mono text-base font-bold tabular-nums sm:text-lg'>
                      {formatTopupQuota(preset.value, props.usdExchangeRate)}
                    </span>
                    {selected && (
                      <Check className='text-primary-ink size-4' aria-hidden />
                    )}
                  </span>
                  <span className='text-muted-foreground w-full text-xs font-normal'>
                    {t('wallet.topup.presetPay', {
                      amount: formatCurrency(pricing.actualPrice),
                    })}
                    {pricing.hasDiscount && pricing.savedAmount > 0 && (
                      <span className='text-success font-medium'>
                        {' · '}
                        {t('wallet.topup.discountOff', {
                          percent: Math.round((1 - discount) * 100),
                        })}
                      </span>
                    )}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      <div className='space-y-2'>
        <Label htmlFor='topup-amount' className={SECTION_LABEL}>
          {t('wallet.topup.customAmount')}
        </Label>
        <div className='flex flex-wrap items-center gap-x-3 gap-y-1.5'>
          <Input
            id='topup-amount'
            type='number'
            inputMode='numeric'
            value={localAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            min={props.minTopup}
            step={1}
            placeholder={t('wallet.topup.minHint', { amount: props.minTopup })}
            aria-describedby='topup-amount-hint'
            className='h-10 w-full font-mono text-base tabular-nums sm:w-48'
          />
          <span
            id='topup-amount-hint'
            className='text-muted-foreground text-xs'
          >
            {t('wallet.topup.minHint', { amount: props.minTopup })}
          </span>
        </div>
      </div>
    </div>
  )
}
