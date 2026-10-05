/*
 * [user-ui] 充值支付方式选择（本仓库新增文件，非官方代码）。
 * Adapted from QuantumNous/new-api web/src/features/wallet/components/recharge-form-card.tsx @ v1.0.0-rc.37 (AGPL-3.0)
 *
 * 官方是"点支付方式按钮 = 直接下单"，且 Waffo 单独一组；这里改成单选：
 * 管理员配置的充值方式与 Waffo 方式放在同一组，名称、图标都用后台配置的值，
 * 选中后由卡片底部唯一的主按钮去支付。
 */
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { getPaymentIcon } from '../lib'
import type { PaymentOption } from '../lib/payment-options'
import { SECTION_LABEL, SELECTED_TILE } from '../lib/topup-ui'

interface PaymentOptionPickerProps {
  options: PaymentOption[]
  selectedKey: string | null
  onSelect: (key: string) => void
  topupAmount: number
  disabled?: boolean
}

function OptionIcon(props: { option: PaymentOption }) {
  if (props.option.kind === 'waffo') {
    if (props.option.method.icon) {
      return (
        <img
          src={props.option.method.icon}
          alt=''
          className='size-4 object-contain'
        />
      )
    }
    return getPaymentIcon('waffo', 'size-4')
  }
  return getPaymentIcon(
    props.option.method.type,
    'size-4',
    props.option.method.icon,
    props.option.name
  )
}

export function PaymentOptionPicker(props: PaymentOptionPickerProps) {
  const { t } = useTranslation()

  return (
    <div className='space-y-2.5'>
      <div id='topup-method-label' className={SECTION_LABEL}>
        {t('wallet.topup.methodLabel')}
      </div>
      <div
        role='group'
        aria-labelledby='topup-method-label'
        className='grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3'
      >
        {props.options.map((option) => {
          const selected = props.selectedKey === option.key
          const belowMin = option.minTopup > props.topupAmount
          return (
            <Button
              key={option.key}
              variant='outline'
              aria-pressed={selected}
              disabled={props.disabled}
              onClick={() => props.onSelect(option.key)}
              className={cn(
                'h-auto min-h-12 min-w-0 justify-start gap-2.5 px-3 py-2 text-left whitespace-normal',
                selected && SELECTED_TILE
              )}
            >
              <span className='flex size-4 shrink-0 items-center justify-center'>
                <OptionIcon option={option} />
              </span>
              <span className='flex min-w-0 flex-1 flex-col items-start gap-0.5'>
                <span className='max-w-full truncate'>{option.name}</span>
                {belowMin && (
                  <span className='text-muted-foreground max-w-full truncate text-[11px] leading-4 font-normal'>
                    {t('wallet.topup.methodMin', { amount: option.minTopup })}
                  </span>
                )}
              </span>
              {selected && (
                <Check
                  className='text-primary-ink size-4 shrink-0'
                  aria-hidden
                />
              )}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
