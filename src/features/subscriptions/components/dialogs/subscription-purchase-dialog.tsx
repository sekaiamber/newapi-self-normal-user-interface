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
// [user-ui] 订阅购买弹窗重绘：
// - 付款方式改为单选列表（余额、Stripe、Creem、Waffo Pancake、各易支付方式），底部只有一个主按钮"确认支付"；
//   官方是余额区一个按钮 + 每个网关各一个按钮 + 易支付下拉框，没有明确的主操作；
// - 网关名称优先用后台"充值方式"里配置的名称（providerNames），易支付方式本来就用配置名称；
// - 明细框改 2px 边，金额改等宽数字，价格不用金色文字；
// - 各网关的下单请求与跳转方式（新窗口 / 当前页 / 表单提交）与官方完全一致。
import { CalendarClock, Check, Crown, Loader2, Package } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Dialog } from '@/components/dialog'
import { GroupBadge } from '@/components/group-badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useSystemConfig } from '@/hooks/use-system-config'
import { formatQuota } from '@/lib/format'
import { handleServerError } from '@/lib/handle-server-error'
import { cn } from '@/lib/utils'
import { DEFAULT_CURRENCY_CONFIG } from '@/stores/system-config-store'

import {
  paySubscriptionStripe,
  paySubscriptionCreem,
  paySubscriptionEpay,
  paySubscriptionWaffoPancake,
  paySubscriptionBalance,
} from '../../api'
import { formatDuration, formatResetPeriod } from '../../lib'
import type { PlanRecord } from '../../types'

interface PaymentMethod {
  type: string
  name?: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: PlanRecord | null
  enableStripe?: boolean
  enableCreem?: boolean
  enableWaffoPancake?: boolean
  enableOnlineTopUp?: boolean
  epayMethods?: PaymentMethod[]
  /** [user-ui] 后台配置的网关显示名称（type → name），如 stripe、waffo_pancake */
  providerNames?: Record<string, string>
  purchaseLimit?: number
  purchaseCount?: number
  userQuota?: number
  onPurchaseSuccess?: () => void | Promise<void>
}

type PayOption = {
  key: string
  label: string
  detail?: string
  disabled?: boolean
}

export function SubscriptionPurchaseDialog(props: Props) {
  const { t } = useTranslation()
  const { currency } = useSystemConfig()
  const [paying, setPaying] = useState(false)
  // [user-ui] 选中的付款方式：'balance' | 'stripe' | 'creem' | 'waffo_pancake' | 'epay:<type>'
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!props.open) setSelectedKey(null)
  }, [props.open])

  const plan = props.plan?.plan
  if (!plan) return null

  const hasStripe = props.enableStripe && !!plan.stripe_price_id
  const hasCreem = props.enableCreem && !!plan.creem_product_id
  const hasWaffoPancake =
    props.enableWaffoPancake && !!plan.waffo_pancake_product_id
  const hasEpay =
    props.enableOnlineTopUp && (props.epayMethods || []).length > 0
  const totalAmount = Number(plan.total_amount || 0)
  const price = Number(plan.price_amount || 0).toFixed(2)
  const quotaPerUnit =
    currency?.quotaPerUnit && currency.quotaPerUnit > 0
      ? currency.quotaPerUnit
      : DEFAULT_CURRENCY_CONFIG.quotaPerUnit
  const balanceCost = Math.max(
    0,
    Math.ceil(Number(plan.price_amount || 0) * quotaPerUnit)
  )
  const userQuota = Math.max(0, Number(props.userQuota || 0))
  const allowBalancePay = plan.allow_balance_pay !== false
  const insufficientBalance = userQuota < balanceCost
  const limitReached =
    (props.purchaseLimit || 0) > 0 &&
    (props.purchaseCount || 0) >= (props.purchaseLimit || 0)

  let balanceDetail = t('wallet.purchase.balanceDetail', {
    required: formatQuota(balanceCost),
    available: formatQuota(userQuota),
  })
  if (!allowBalancePay) {
    balanceDetail = t('This plan does not allow balance redemption')
  } else if (insufficientBalance) {
    balanceDetail = `${t('Insufficient balance')} · ${balanceDetail}`
  }

  const providerName = (type: string, fallback: string) =>
    props.providerNames?.[type] || fallback

  const options: PayOption[] = [
    {
      key: 'balance',
      label: t('wallet.purchase.balance'),
      detail: balanceDetail,
      disabled: !allowBalancePay || insufficientBalance,
    },
  ]
  if (hasStripe) {
    options.push({ key: 'stripe', label: providerName('stripe', 'Stripe') })
  }
  if (hasCreem) {
    options.push({ key: 'creem', label: providerName('creem', 'Creem') })
  }
  if (hasWaffoPancake) {
    options.push({
      key: 'waffo_pancake',
      label: providerName('waffo_pancake', 'Waffo Pancake'),
    })
  }
  if (hasEpay) {
    for (const m of props.epayMethods || []) {
      options.push({ key: `epay:${m.type}`, label: m.name || m.type })
    }
  }

  const firstEnabled = options.find((o) => !o.disabled)?.key ?? null
  const currentKey =
    selectedKey && options.some((o) => o.key === selectedKey && !o.disabled)
      ? selectedKey
      : firstEnabled

  const handlePayStripe = async () => {
    setPaying(true)
    try {
      const res = await paySubscriptionStripe({ plan_id: plan.id })
      if (res.message === 'success' && res.data?.pay_link) {
        window.open(res.data.pay_link, '_blank')
        toast.success(t('Payment page opened'))
        props.onOpenChange(false)
      } else {
        handleServerError(res, t('Payment request failed'))
      }
    } catch (error) {
      handleServerError(error, t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  const handlePayCreem = async () => {
    setPaying(true)
    try {
      const res = await paySubscriptionCreem({ plan_id: plan.id })
      if (res.message === 'success' && res.data?.checkout_url) {
        window.open(res.data.checkout_url, '_blank')
        toast.success(t('Payment page opened'))
        props.onOpenChange(false)
      } else {
        handleServerError(res, t('Payment request failed'))
      }
    } catch (error) {
      handleServerError(error, t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  // In-tab redirect (not window.open) — user-gesture context is lost
  // across the await, so a popup would be blocked. Same as the wallet hook.
  const handlePayWaffoPancake = async () => {
    setPaying(true)
    try {
      const res = await paySubscriptionWaffoPancake({ plan_id: plan.id })
      if (res.message === 'success' && res.data?.checkout_url) {
        toast.success(t('Redirecting to payment page...'))
        window.location.href = res.data.checkout_url
      } else {
        handleServerError(res, t('Payment request failed'))
      }
    } catch (error) {
      handleServerError(error, t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  const isSafari =
    typeof navigator !== 'undefined' &&
    /^((?!chrome|android).)*safari/i.test(navigator.userAgent)

  const handlePayEpay = async (paymentMethod: string) => {
    if (!paymentMethod) {
      toast.error(t('Please select a payment method'))
      return
    }
    setPaying(true)
    try {
      const res = await paySubscriptionEpay({
        plan_id: plan.id,
        payment_method: paymentMethod,
      })
      if (res.message === 'success' && res.url) {
        const form = document.createElement('form')
        form.action = res.url
        form.method = 'POST'
        if (!isSafari) {
          form.target = '_blank'
        }
        Object.entries(res.data || {}).forEach(([key, value]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = String(value)
          form.appendChild(input)
        })
        document.body.appendChild(form)
        form.submit()
        document.body.removeChild(form)
        toast.success(t('Payment initiated'))
        props.onOpenChange(false)
      } else {
        handleServerError(res, t('Payment request failed'))
      }
    } catch (error) {
      handleServerError(error, t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  const handlePayBalance = async () => {
    if (!allowBalancePay) {
      toast.error(t('This plan does not allow balance redemption'))
      return
    }
    setPaying(true)
    try {
      const res = await paySubscriptionBalance({ plan_id: plan.id })
      if (res.success) {
        toast.success(t('Subscription purchased successfully'))
        void props.onPurchaseSuccess?.()
        props.onOpenChange(false)
      } else {
        handleServerError(res, t('Payment request failed'))
      }
    } catch (error) {
      handleServerError(error, t('Payment request failed'))
    } finally {
      setPaying(false)
    }
  }

  // [user-ui] 主按钮：按选中的付款方式调用对应的官方处理函数
  const handleConfirm = () => {
    if (!currentKey) return
    if (currentKey === 'balance') return void handlePayBalance()
    if (currentKey === 'stripe') return void handlePayStripe()
    if (currentKey === 'creem') return void handlePayCreem()
    if (currentKey === 'waffo_pancake') return void handlePayWaffoPancake()
    if (currentKey.startsWith('epay:')) {
      void handlePayEpay(currentKey.slice('epay:'.length))
    }
  }

  const summaryRow = 'flex items-center justify-between gap-3 px-3 py-2.5'

  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={
        <>
          <Crown className='size-5' aria-hidden />
          {t('Purchase Subscription')}
        </>
      }
      contentClassName='max-sm:w-[calc(100vw-1.5rem)] sm:max-w-md'
      titleClassName='flex items-center gap-2'
      contentHeight='auto'
      bodyClassName='space-y-4'
      footerClassName='grid grid-cols-2 gap-2 sm:flex'
      footer={
        <>
          <Button
            variant='outline'
            onClick={() => props.onOpenChange(false)}
            disabled={paying}
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={paying || limitReached || !currentKey}
          >
            {paying && <Loader2 className='animate-spin' aria-hidden />}
            {t('wallet.purchase.confirm')}
          </Button>
        </>
      }
    >
      <div className='space-y-4'>
        <dl className='border-edge-soft divide-border divide-y rounded-lg border-2 text-sm'>
          <div className={summaryRow}>
            <dt className='text-muted-foreground'>{t('Plan Name')}</dt>
            <dd className='max-w-[200px] truncate font-medium'>{plan.title}</dd>
          </div>
          <div className={summaryRow}>
            <dt className='text-muted-foreground'>{t('Validity Period')}</dt>
            <dd className='flex items-center gap-1'>
              <CalendarClock className='size-3.5' aria-hidden />
              {formatDuration(plan, t)}
            </dd>
          </div>
          {formatResetPeriod(plan, t) !== t('No Reset') && (
            <div className={summaryRow}>
              <dt className='text-muted-foreground'>{t('Reset Period')}</dt>
              <dd>{formatResetPeriod(plan, t)}</dd>
            </div>
          )}
          <div className={summaryRow}>
            <dt className='text-muted-foreground'>{t('Plan Quota')}</dt>
            <dd className='flex items-center gap-1 font-mono tabular-nums'>
              <Package className='size-3.5' aria-hidden />
              {totalAmount > 0 ? formatQuota(totalAmount) : t('Unlimited')}
            </dd>
          </div>
          {plan.upgrade_group && (
            <div className={summaryRow}>
              <dt className='text-muted-foreground'>{t('Upgrade Group')}</dt>
              <dd>
                <GroupBadge group={plan.upgrade_group} />
              </dd>
            </div>
          )}
          <div className={cn(summaryRow, 'bg-muted/40')}>
            <dt className='font-medium'>{t('Amount Due')}</dt>
            <dd className='font-mono text-lg font-bold tabular-nums'>
              ${price}
            </dd>
          </div>
        </dl>

        {limitReached && (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('Purchase limit reached')} ({props.purchaseCount}/
              {props.purchaseLimit})
            </AlertDescription>
          </Alert>
        )}

        <div className='space-y-2'>
          <div
            id='subscription-pay-method-label'
            className='text-sm font-semibold'
          >
            {t('wallet.purchase.methodLabel')}
          </div>
          <div
            role='group'
            aria-labelledby='subscription-pay-method-label'
            className='grid gap-2'
          >
            {options.map((option) => {
              const selected = currentKey === option.key
              return (
                <Button
                  key={option.key}
                  variant='outline'
                  aria-pressed={selected}
                  disabled={option.disabled || paying || limitReached}
                  onClick={() => setSelectedKey(option.key)}
                  className={cn(
                    'h-auto min-h-11 justify-between gap-3 px-3 py-2 text-left whitespace-normal',
                    selected &&
                      'border-primary-edge bg-accent text-accent-foreground hover:bg-accent dark:border-primary'
                  )}
                >
                  <span className='flex min-w-0 flex-col items-start gap-0.5'>
                    <span className='truncate'>{option.label}</span>
                    {option.detail && (
                      <span className='text-muted-foreground font-mono text-[11px] leading-4 font-normal tabular-nums'>
                        {option.detail}
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
          {!firstEnabled && (
            <p className='text-muted-foreground text-xs'>
              {t('wallet.purchase.noMethod')}
            </p>
          )}
        </div>
      </div>
    </Dialog>
  )
}
