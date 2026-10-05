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
// [user-ui] 订阅套餐卡片重绘（钱包页整行显示）：
// - 去掉"推荐"角标：官方把列表第一个套餐固定标为推荐，管理端并没有这个设置，属于无依据的说法；
// - "我的订阅"与扣费顺序放在一个 2px 外框里，扣费顺序加可见标签；刷新按钮加无障碍名称；
// - 价格改等宽数字、不用金色文字；套餐网格 1/2/3 列；文案改覆盖层 wallet.subs.* 新 key；
// - 修正：后台"充值方式"里的 waffo_pancake 走 Waffo Pancake 专用流程（官方设置页说明，
//   official-ui/web/src/features/system-settings/integrations/payment-method-dialog.tsx @ v1.0.0-rc.37），
//   不能当作易支付方式提交，这里从易支付列表中排除；
// - Stripe / Waffo Pancake 若在"充值方式"里配置了名称，购买弹窗显示配置的名称。
import { Check, Crown, RefreshCw } from 'lucide-react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { StatusBadge } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  getPublicPlans,
  getSelfSubscriptionFull,
  updateBillingPreference,
} from '@/features/subscriptions/api'
import { SubscriptionPurchaseDialog } from '@/features/subscriptions/components/dialogs/subscription-purchase-dialog'
import { formatDuration, formatResetPeriod } from '@/features/subscriptions/lib'
import type {
  PlanRecord,
  UserSubscriptionRecord,
} from '@/features/subscriptions/types'
import { formatQuota } from '@/lib/format'
import { handleServerError } from '@/lib/handle-server-error'
import { requireServerSuccess } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'

import { getEpayMethods, getProviderNames } from '../lib/subscription-payment'
import type { TopupInfo } from '../types'

interface SubscriptionPlansCardProps {
  topupInfo: TopupInfo | null
  onAvailabilityChange?: (available: boolean) => void
  userQuota?: number
  onPurchaseSuccess?: () => void | Promise<void>
}

function getBillingPreferenceLabel(
  preference: string,
  t: (key: string) => string
): string {
  switch (preference) {
    case 'subscription_first':
      return t('Subscription First')
    case 'wallet_first':
      return t('Wallet First')
    case 'subscription_only':
      return t('Subscription Only')
    case 'wallet_only':
      return t('Wallet Only')
    default:
      return preference
  }
}

const BOX = 'border-edge-soft rounded-lg border-2'

interface SubscriptionItemProps {
  sub: UserSubscriptionRecord
  planTitle: string
}

function SubscriptionItem(props: SubscriptionItemProps) {
  const { t } = useTranslation()
  const subscription = props.sub.subscription
  const totalAmount = Number(subscription?.amount_total || 0)
  const usedAmount = Number(subscription?.amount_used || 0)
  const remainAmount =
    totalAmount > 0 ? Math.max(0, totalAmount - usedAmount) : 0
  const endTime = subscription?.end_time || 0
  const now = Date.now() / 1000
  const remainDays = endTime
    ? Math.max(0, Math.ceil((endTime - now) / 86400))
    : 0
  const usagePercent =
    totalAmount > 0 ? Math.round((usedAmount / totalAmount) * 100) : 0
  const isExpired = endTime < now
  const isCancelled = subscription?.status === 'cancelled'
  const isActive = subscription?.status === 'active' && !isExpired
  const nextResetTime = subscription?.next_reset_time ?? 0

  let statusBadge = (
    <StatusBadge label={t('Expired')} variant='neutral' copyable={false} />
  )
  let endTimeLabel = t('Expired at')
  if (isActive) {
    statusBadge = (
      <StatusBadge label={t('Active')} variant='success' copyable={false} />
    )
    endTimeLabel = t('Until')
  } else if (isCancelled) {
    statusBadge = (
      <StatusBadge label={t('Cancelled')} variant='neutral' copyable={false} />
    )
    endTimeLabel = t('Cancelled at')
  }

  return (
    <li className='space-y-1 px-3 py-2.5 text-xs'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='truncate text-sm font-medium'>
            {props.planTitle
              ? `${props.planTitle} · ${t('Subscription')} #${subscription?.id}`
              : `${t('Subscription')} #${subscription?.id}`}
          </span>
          {statusBadge}
        </div>
        {isActive && (
          <span className='text-muted-foreground'>
            {t('{{count}} days remaining', { count: remainDays })}
          </span>
        )}
      </div>
      <div className='text-muted-foreground'>
        {endTimeLabel}{' '}
        <span className='font-mono tabular-nums'>
          {new Date(endTime * 1000).toLocaleString()}
        </span>
      </div>
      {isActive && nextResetTime > 0 && (
        <div className='text-muted-foreground'>
          {t('Next reset')}:{' '}
          <span className='font-mono tabular-nums'>
            {new Date(nextResetTime * 1000).toLocaleString()}
          </span>
        </div>
      )}
      <div className='text-muted-foreground'>
        {t('Total Quota')}:{' '}
        {totalAmount > 0 ? (
          <Tooltip>
            <TooltipTrigger
              render={<span className='cursor-help font-mono tabular-nums' />}
            >
              {formatQuota(usedAmount)}/{formatQuota(totalAmount)} ·{' '}
              {t('Remaining')} {formatQuota(remainAmount)}
            </TooltipTrigger>
            <TooltipContent>
              {t('Raw Quota')}: {usedAmount}/{totalAmount} · {t('Remaining')}{' '}
              {remainAmount}
            </TooltipContent>
          </Tooltip>
        ) : (
          t('Unlimited')
        )}
        {totalAmount > 0 && (
          <span className='ml-2'>
            {t('Used')} {usagePercent}%
          </span>
        )}
      </div>
      {totalAmount > 0 && isActive && (
        <Progress value={usagePercent} className='mt-1.5 h-1.5' />
      )}
    </li>
  )
}

export function SubscriptionPlansCard({
  topupInfo,
  onAvailabilityChange,
  userQuota,
  onPurchaseSuccess,
}: SubscriptionPlansCardProps) {
  const { t } = useTranslation()

  const [plans, setPlans] = useState<PlanRecord[]>([])
  const [activeSubscriptions, setActiveSubscriptions] = useState<
    UserSubscriptionRecord[]
  >([])
  const [allSubscriptions, setAllSubscriptions] = useState<
    UserSubscriptionRecord[]
  >([])
  const [billingPreference, setBillingPreference] =
    useState('subscription_first')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanRecord | null>(null)

  const enableStripe = !!topupInfo?.enable_stripe_topup
  const enableCreem = !!topupInfo?.enable_creem_topup
  const enableWaffoPancake = !!topupInfo?.enable_waffo_pancake_topup
  const enableOnlineTopUp = !!topupInfo?.enable_online_topup
  const epayMethods = useMemo(
    () => getEpayMethods(topupInfo?.pay_methods),
    [topupInfo?.pay_methods]
  )
  const providerNames = useMemo(
    () => getProviderNames(topupInfo?.pay_methods),
    [topupInfo?.pay_methods]
  )

  const fetchPlans = useCallback(async () => {
    try {
      const res = requireServerSuccess(await getPublicPlans())
      if (res.success) {
        setPlans(res.data || [])
      }
    } catch (error) {
      handleServerError(error)
      setPlans([])
    }
  }, [])

  const fetchSelfSubscription = useCallback(async () => {
    try {
      const res = requireServerSuccess(await getSelfSubscriptionFull())
      if (res.success && res.data) {
        setBillingPreference(
          res.data.billing_preference || 'subscription_first'
        )
        setActiveSubscriptions(res.data.subscriptions || [])
        setAllSubscriptions(res.data.all_subscriptions || [])
      }
    } catch (error) {
      handleServerError(error)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchPlans(), fetchSelfSubscription()])
      setLoading(false)
    }
    init()
  }, [fetchPlans, fetchSelfSubscription])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchSelfSubscription()
    } finally {
      setRefreshing(false)
    }
  }

  const handlePreferenceChange = async (pref: string) => {
    const previous = billingPreference
    setBillingPreference(pref)
    try {
      const res = await updateBillingPreference(pref)
      if (res.success) {
        toast.success(t('Updated successfully'))
        const normalized = res.data?.billing_preference || pref
        setBillingPreference(normalized)
      } else {
        handleServerError(res, t('Update failed'))
        setBillingPreference(previous)
      }
    } catch (error) {
      handleServerError(error, t('Request failed'))
      setBillingPreference(previous)
    }
  }

  const hasActive = activeSubscriptions.length > 0
  const hasAny = allSubscriptions.length > 0
  const isAvailable = loading || plans.length > 0 || hasAny
  const disablePref = !hasActive
  const isSubPref =
    billingPreference === 'subscription_first' ||
    billingPreference === 'subscription_only'
  const endedCount = allSubscriptions.length - activeSubscriptions.length

  const planPurchaseCountMap = useMemo(() => {
    const map = new Map<number, number>()
    for (const sub of allSubscriptions) {
      const planId = sub?.subscription?.plan_id
      if (!planId) continue
      map.set(planId, (map.get(planId) || 0) + 1)
    }
    return map
  }, [allSubscriptions])

  useEffect(() => {
    onAvailabilityChange?.(isAvailable)
  }, [isAvailable, onAvailabilityChange])

  const planTitleMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const p of plans) {
      if (p?.plan?.id) {
        map.set(p.plan.id, p.plan.title || '')
      }
    }
    return map
  }, [plans])

  if (loading) {
    return (
      <Card data-card-hover='false' className='gap-4 p-4 sm:p-5'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-16 w-full' />
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          {['first', 'second', 'third'].map((key) => (
            <Skeleton key={key} className='h-40 w-full' />
          ))}
        </div>
      </Card>
    )
  }

  if (plans.length === 0 && !hasAny) {
    return null
  }

  const preferenceLabel = (value: string, needsActive: boolean) => (
    <>
      {getBillingPreferenceLabel(value, t)}
      {needsActive && disablePref ? ` (${t('No Active')})` : ''}
    </>
  )

  return (
    <>
      <TitledCard
        title={t('wallet.subs.title')}
        description={t('wallet.subs.description')}
        icon={<Crown />}
        iconTone='warning'
        disableHoverEffect
        contentClassName='space-y-4 sm:space-y-5'
      >
        {/* My subscriptions & billing preference */}
        <div className={BOX}>
          <div className='flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4'>
            <div className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1'>
              <span className='text-sm font-semibold'>
                {t('wallet.subs.mine')}
              </span>
              <span className='flex items-center gap-1.5 text-xs font-medium'>
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    hasActive ? 'bg-success' : 'bg-muted-foreground'
                  )}
                  aria-hidden='true'
                />
                {hasActive ? (
                  <span className='text-success'>
                    {t('wallet.subs.activeCount', {
                      count: activeSubscriptions.length,
                    })}
                  </span>
                ) : (
                  <span className='text-muted-foreground'>
                    {t('wallet.subs.noneActive')}
                  </span>
                )}
                {endedCount > 0 && (
                  <>
                    <span className='text-muted-foreground/50'>·</span>
                    <span className='text-muted-foreground'>
                      {t('wallet.subs.endedCount', { count: endedCount })}
                    </span>
                  </>
                )}
              </span>
            </div>
            <div className='flex w-full items-center gap-2 sm:w-auto'>
              <Label
                htmlFor='billing-preference'
                className='text-muted-foreground shrink-0 text-xs'
              >
                {t('wallet.subs.preference')}
              </Label>
              <Select
                items={[
                  {
                    value: 'subscription_first',
                    label: preferenceLabel('subscription_first', true),
                  },
                  {
                    value: 'wallet_first',
                    label: preferenceLabel('wallet_first', false),
                  },
                  {
                    value: 'subscription_only',
                    label: preferenceLabel('subscription_only', true),
                  },
                  {
                    value: 'wallet_only',
                    label: preferenceLabel('wallet_only', false),
                  },
                ]}
                value={billingPreference}
                onValueChange={(v) => v !== null && handlePreferenceChange(v)}
              >
                <SelectTrigger
                  id='billing-preference'
                  className='h-8 min-w-0 flex-1 text-xs sm:w-[150px] sm:flex-none'
                >
                  <SelectValue>
                    {getBillingPreferenceLabel(billingPreference, t)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectGroup>
                    <SelectItem
                      value='subscription_first'
                      disabled={disablePref}
                    >
                      {preferenceLabel('subscription_first', true)}
                    </SelectItem>
                    <SelectItem value='wallet_first'>
                      {preferenceLabel('wallet_first', false)}
                    </SelectItem>
                    <SelectItem
                      value='subscription_only'
                      disabled={disablePref}
                    >
                      {preferenceLabel('subscription_only', true)}
                    </SelectItem>
                    <SelectItem value='wallet_only'>
                      {preferenceLabel('wallet_only', false)}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                variant='ghost'
                size='icon-sm'
                onClick={handleRefresh}
                disabled={refreshing}
                aria-label={t('wallet.subs.refresh')}
              >
                <RefreshCw
                  className={cn(
                    'size-3.5',
                    refreshing && 'motion-safe:animate-spin'
                  )}
                />
              </Button>
            </div>
          </div>

          {disablePref && isSubPref && (
            <p className='text-muted-foreground px-3 pb-3 text-xs sm:px-4'>
              {billingPreference === 'subscription_only'
                ? t(
                    'Preference saved as {{pref}}, but no active subscription. Requests will be rejected.',
                    { pref: t('Subscription Only') }
                  )
                : t(
                    'Preference saved as {{pref}}, but no active subscription. Wallet will be used automatically.',
                    { pref: t('Subscription First') }
                  )}
            </p>
          )}

          {hasAny && (
            <ul className='divide-border border-border max-h-72 divide-y overflow-y-auto border-t'>
              {allSubscriptions.map((sub) => (
                <SubscriptionItem
                  key={sub.subscription?.id}
                  sub={sub}
                  planTitle={planTitleMap.get(sub.subscription?.plan_id) || ''}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Available plans grid */}
        {plans.length > 0 ? (
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3'>
            {plans.map((p) => {
              const plan = p?.plan
              if (!plan) return null
              const totalAmount = Number(plan.total_amount || 0)
              const price = Number(plan.price_amount || 0).toFixed(2)
              const limit = Number(plan.max_purchase_per_user || 0)
              const count = planPurchaseCountMap.get(plan.id) || 0
              const reached = limit > 0 && count >= limit

              const benefits = [
                `${t('Validity Period')}: ${formatDuration(plan, t)}`,
                formatResetPeriod(plan, t) !== t('No Reset')
                  ? `${t('Quota Reset')}: ${formatResetPeriod(plan, t)}`
                  : null,
                totalAmount > 0
                  ? `${t('Total Quota')}: ${formatQuota(totalAmount)}`
                  : `${t('Total Quota')}: ${t('Unlimited')}`,
                limit > 0 ? `${t('Purchase Limit')}: ${limit}` : null,
                plan.upgrade_group
                  ? `${t('Upgrade Group')}: ${plan.upgrade_group}`
                  : null,
              ].filter(Boolean) as string[]

              return (
                <Card key={plan.id} data-card-hover='false' className='py-0'>
                  <CardContent className='flex h-full flex-col p-4'>
                    <div className='min-w-0'>
                      <h4 className='truncate font-semibold'>
                        {plan.title || t('wallet.subs.title')}
                      </h4>
                      {plan.subtitle && (
                        <p className='text-muted-foreground truncate text-xs'>
                          {plan.subtitle}
                        </p>
                      )}
                    </div>

                    <div className='py-2.5 font-mono text-2xl font-bold tabular-nums'>
                      ${price}
                    </div>

                    <ul className='flex-1 space-y-1.5 pb-3'>
                      {benefits.map((label) => (
                        <li
                          key={label}
                          className='text-muted-foreground flex items-start gap-2 text-xs'
                        >
                          <Check
                            className='text-primary-ink mt-px size-3 shrink-0'
                            aria-hidden
                          />
                          <span>{label}</span>
                        </li>
                      ))}
                    </ul>

                    <Separator className='mb-3' />

                    {reached ? (
                      <Tooltip>
                        <TooltipTrigger render={<div />}>
                          <Button variant='outline' className='w-full' disabled>
                            {t('Limit Reached')}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t('Purchase limit reached')} ({count}/{limit})
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        variant='outline'
                        className='w-full'
                        onClick={() => {
                          setSelectedPlan(p)
                          setPurchaseOpen(true)
                        }}
                      >
                        {t('wallet.subs.subscribe')}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <p className='text-muted-foreground py-4 text-center text-sm'>
            {t('No plans available')}
          </p>
        )}
      </TitledCard>

      <SubscriptionPurchaseDialog
        open={purchaseOpen}
        onOpenChange={(open) => {
          setPurchaseOpen(open)
          if (!open) {
            fetchSelfSubscription()
          }
        }}
        plan={selectedPlan}
        enableStripe={enableStripe}
        enableCreem={enableCreem}
        enableWaffoPancake={enableWaffoPancake}
        enableOnlineTopUp={enableOnlineTopUp}
        epayMethods={epayMethods}
        providerNames={providerNames}
        userQuota={userQuota}
        onPurchaseSuccess={onPurchaseSuccess}
        purchaseLimit={
          selectedPlan?.plan?.max_purchase_per_user
            ? Number(selectedPlan.plan.max_purchase_per_user)
            : undefined
        }
        purchaseCount={
          selectedPlan?.plan?.id
            ? planPurchaseCountMap.get(selectedPlan.plan.id)
            : undefined
        }
      />
    </>
  )
}
