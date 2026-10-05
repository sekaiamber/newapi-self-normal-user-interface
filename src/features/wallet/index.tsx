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
// [user-ui] 钱包页重绘（推荐计划隐藏后的布局）：
// 统计卡 → "在线充值 | 兑换码"并列 → 订阅套餐（整行）→（推荐计划，开关开启时）。
// 订单记录入口移到页面标题栏；充值流程改为"选额度 → 选方式 → 主按钮去支付"；
// 在线充值/兑换码不可用时用说明卡片代替两条提示框。下单、兑换、订阅的请求与处理函数沿用官方。
import { Receipt } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { isUserUiFeatureEnabled } from '@/config/user-ui-features'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { getSelf } from '@/lib/api'

import { BillingHistoryDialog } from './components/dialogs/billing-history-dialog'
import { CreemConfirmDialog } from './components/dialogs/creem-confirm-dialog'
import { PaymentConfirmDialog } from './components/dialogs/payment-confirm-dialog'
import { FundingNoticeCard } from './components/funding-notice-card'
import { RechargeFormCard } from './components/recharge-form-card'
import { RedemptionCard } from './components/redemption-card'
import { ReferralSection } from './components/referral-section'
import { SubscriptionPlansCard } from './components/subscription-plans-card'
import { WalletStatsCard } from './components/wallet-stats-card'
import { DEFAULT_DISCOUNT_RATE, PAYMENT_TYPES } from './constants'
import {
  useTopupInfo,
  usePayment,
  useRedemption,
  useCreemPayment,
  useWaffoPayment,
  useWaffoPancakePayment,
} from './hooks'
import {
  getDefaultPaymentType,
  getMinTopupAmount,
  dispatchSelectedPayment,
} from './lib'
import {
  buildPaymentOptions,
  getPaymentOptionType,
  hasConfigurableTopup,
  hasCreemProducts,
  pickDefaultPaymentOption,
} from './lib/payment-options'
import type {
  UserWalletData,
  PaymentMethod,
  PresetAmount,
  CreemProduct,
  WaffoPayMethod,
} from './types'

interface WalletProps {
  initialShowHistory?: boolean
}

/** 两列：左边主要操作，右边窄列 */
const FUNDING_GRID =
  'grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start'

function FundingSkeleton() {
  return (
    <div className={FUNDING_GRID}>
      <Skeleton className='h-[420px] w-full rounded-lg' />
      <Skeleton className='h-44 w-full rounded-lg' />
    </div>
  )
}

export function Wallet(props: WalletProps) {
  const { t } = useTranslation()
  const [user, setUser] = useState<UserWalletData | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [topupAmount, setTopupAmount] = useState(0)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>()
  const [selectedWaffoMethodIndex, setSelectedWaffoMethodIndex] = useState<
    number | null
  >(null)
  // [user-ui] 单选的支付方式（选中不下单，主按钮才下单）
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(
    null
  )
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [billingDialogOpen, setBillingDialogOpen] = useState(false)
  const [redemptionCode, setRedemptionCode] = useState('')
  const [creemDialogOpen, setCreemDialogOpen] = useState(false)
  const [selectedCreemProduct, setSelectedCreemProduct] =
    useState<CreemProduct | null>(null)

  const { status } = useStatus()
  const { currency } = useSystemConfig()
  const { topupInfo, presetAmounts, loading: topupLoading } = useTopupInfo()
  const paymentOptions = useMemo(
    () => buildPaymentOptions(topupInfo),
    [topupInfo]
  )
  const selectedOption =
    paymentOptions.find((o) => o.key === selectedOptionKey) ?? null

  // Calculate effective exchange rate - when display type is USD, use rate of 1
  const effectiveUsdExchangeRate = useMemo(() => {
    return currency?.quotaDisplayType === 'USD'
      ? 1
      : currency?.usdExchangeRate || 1
  }, [currency?.quotaDisplayType, currency?.usdExchangeRate])
  const {
    amount: paymentAmount,
    calculating,
    processing,
    calculatePaymentAmount,
    processPayment,
  } = usePayment()
  const { redeeming, redeemCode } = useRedemption()
  const { processing: creemProcessing, processCreemPayment } = useCreemPayment()
  const { processing: waffoProcessing, processWaffoPayment } = useWaffoPayment()
  const { processing: pancakeProcessing, processWaffoPancakePayment } =
    useWaffoPancakePayment()

  // Fetch and refresh user data
  const fetchUser = useCallback(async () => {
    try {
      setUserLoading(true)
      const response = await getSelf()
      if (response.success && response.data) {
        setUser(response.data as UserWalletData)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to fetch user data:', error)
    } finally {
      setUserLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (props.initialShowHistory) {
      setBillingDialogOpen(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [props.initialShowHistory])

  // Initialize topup amount when topup info is loaded
  const topupAmountInitializedRef = useRef(false)
  useEffect(() => {
    if (topupInfo && !topupAmountInitializedRef.current) {
      topupAmountInitializedRef.current = true
      const minTopup = getMinTopupAmount(topupInfo)
      setTopupAmount(minTopup)

      // [user-ui] 预先选中一个可用的支付方式，并按它计算应付金额
      const defaultOption = pickDefaultPaymentOption(
        buildPaymentOptions(topupInfo),
        minTopup
      )
      setSelectedOptionKey(defaultOption?.key ?? null)
      const defaultPaymentType = defaultOption
        ? getPaymentOptionType(defaultOption)
        : getDefaultPaymentType(topupInfo)
      calculatePaymentAmount(minTopup, defaultPaymentType)
    }
  }, [topupInfo, calculatePaymentAmount])

  // Get current payment type (selected or default)
  const getCurrentPaymentType = useCallback(() => {
    // [user-ui] 以单选的支付方式为准
    return selectedOption
      ? getPaymentOptionType(selectedOption)
      : getDefaultPaymentType(topupInfo)
  }, [selectedOption, topupInfo])

  // Handle preset selection
  const handleSelectPreset = (preset: PresetAmount) => {
    setTopupAmount(preset.value)
    setSelectedPreset(preset.value)
    calculatePaymentAmount(preset.value, getCurrentPaymentType())
  }

  // Handle topup amount change
  const handleTopupAmountChange = (amount: number) => {
    setTopupAmount(amount)
    setSelectedPreset(null)
    calculatePaymentAmount(amount, getCurrentPaymentType())
  }

  // [user-ui] 选择支付方式：只更新应付金额，不下单
  const handlePaymentOptionChange = (key: string) => {
    setSelectedOptionKey(key)
    const option = paymentOptions.find((o) => o.key === key)
    if (option) {
      calculatePaymentAmount(topupAmount, getPaymentOptionType(option))
    }
  }

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method)
    setSelectedWaffoMethodIndex(null)
    setPaymentLoading(method.type)

    try {
      // Validate minimum topup
      const minTopup = getMinTopupAmount(topupInfo)
      if (topupAmount < minTopup) {
        return
      }

      // Calculate payment amount and show confirmation dialog
      await calculatePaymentAmount(topupAmount, method.type)
      setConfirmDialogOpen(true)
    } finally {
      setPaymentLoading(null)
    }
  }

  // Handle payment confirmation
  const handlePaymentConfirm = async () => {
    if (!selectedPaymentMethod) return

    const success = await dispatchSelectedPayment(
      selectedPaymentMethod,
      topupAmount,
      selectedWaffoMethodIndex,
      {
        regular: processPayment,
        waffo: processWaffoPayment,
        waffoPancake: processWaffoPancakePayment,
      }
    )

    if (success) {
      setConfirmDialogOpen(false)
      await fetchUser()
    }
  }

  // Handle redemption
  const handleRedeem = async () => {
    if (!redemptionCode) return

    const success = await redeemCode(redemptionCode)
    if (success) {
      setRedemptionCode('')
      await fetchUser()
    }
  }

  // Handle Creem product selection
  const handleCreemProductSelect = (product: CreemProduct) => {
    setSelectedCreemProduct(product)
    setCreemDialogOpen(true)
  }

  // Handle Creem payment confirmation
  const handleCreemConfirm = async () => {
    if (!selectedCreemProduct) return

    const success = await processCreemPayment(selectedCreemProduct.productId)
    if (success) {
      setCreemDialogOpen(false)
      setSelectedCreemProduct(null)
      await fetchUser()
    }
  }

  const handleWaffoMethodSelect = async (
    method: WaffoPayMethod,
    index: number
  ) => {
    const loadingKey = `waffo-${index}`
    setSelectedPaymentMethod({
      name: method.name,
      type: PAYMENT_TYPES.WAFFO,
      icon: method.icon,
    })
    setSelectedWaffoMethodIndex(index)
    setPaymentLoading(loadingKey)

    try {
      await calculatePaymentAmount(topupAmount, PAYMENT_TYPES.WAFFO)
      setConfirmDialogOpen(true)
    } finally {
      setPaymentLoading(null)
    }
  }

  // [user-ui] 主按钮"去支付"：按选中的方式走官方原有的下单前确认流程
  const handleCheckout = () => {
    if (!selectedOption) return
    if (selectedOption.kind === 'waffo') {
      void handleWaffoMethodSelect(selectedOption.method, selectedOption.index)
      return
    }
    void handlePaymentMethodSelect(selectedOption.method)
  }

  // Get discount rate for current topup amount
  const getDiscountRate = useCallback(() => {
    return topupInfo?.discount?.[topupAmount] || DEFAULT_DISCOUNT_RATE
  }, [topupInfo, topupAmount])

  const configurableTopup = hasConfigurableTopup(topupInfo)
  const topupAvailable = configurableTopup || hasCreemProducts(topupInfo)
  const redemptionEnabled = topupInfo?.enable_redemption !== false
  const topupLink = topupInfo?.topup_link || undefined

  const rechargeCard = (
    <RechargeFormCard
      topupInfo={topupInfo}
      configurableTopup={configurableTopup}
      presetAmounts={presetAmounts}
      selectedPreset={selectedPreset}
      onSelectPreset={handleSelectPreset}
      topupAmount={topupAmount}
      onTopupAmountChange={handleTopupAmountChange}
      paymentAmount={paymentAmount}
      calculating={calculating}
      paymentOptions={paymentOptions}
      selectedOptionKey={selectedOptionKey}
      onSelectOption={handlePaymentOptionChange}
      onCheckout={handleCheckout}
      checkoutLoading={paymentLoading !== null}
      priceRatio={(status?.price as number) || 1}
      usdExchangeRate={effectiveUsdExchangeRate}
      creemProducts={
        topupInfo?.enable_creem_topup ? topupInfo.creem_products : undefined
      }
      onCreemProductSelect={handleCreemProductSelect}
    />
  )

  const redemptionCard = (
    <RedemptionCard
      enabled={redemptionEnabled}
      code={redemptionCode}
      onCodeChange={setRedemptionCode}
      onRedeem={handleRedeem}
      redeeming={redeeming}
      topupLink={topupLink}
      primary={!topupAvailable}
    />
  )

  const renderFunding = () => {
    if (topupLoading) return <FundingSkeleton />
    if (topupAvailable) {
      return (
        <div className={FUNDING_GRID}>
          <div id='wallet-add-funds' className='scroll-mt-4'>
            {rechargeCard}
          </div>
          {redemptionCard}
        </div>
      )
    }
    if (redemptionEnabled) {
      return (
        <div className={FUNDING_GRID}>
          <div id='wallet-add-funds' className='scroll-mt-4'>
            {redemptionCard}
          </div>
          <FundingNoticeCard variant='topup-off' />
        </div>
      )
    }
    return (
      <div id='wallet-add-funds' className='scroll-mt-4'>
        <FundingNoticeCard variant='all-off' topupLink={topupLink} />
      </div>
    )
  }

  return (
    <>
      <SectionPageLayout>
        <SectionPageLayout.Title>{t('Wallet')}</SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setBillingDialogOpen(true)}
          >
            <Receipt aria-hidden />
            {t('wallet.orderHistory')}
          </Button>
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <div className='mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-5'>
            <WalletStatsCard user={user} loading={userLoading && !user} />

            {renderFunding()}

            <SubscriptionPlansCard
              topupInfo={topupInfo}
              userQuota={user?.quota}
              onPurchaseSuccess={fetchUser}
            />

            {/* [user-ui] 功能开关：推荐计划禁用时不显示（也不请求推荐接口） */}
            {isUserUiFeatureEnabled('referral') && (
              <ReferralSection
                user={user}
                complianceConfirmed={
                  topupInfo?.payment_compliance_confirmed !== false
                }
                onTransferred={fetchUser}
              />
            )}
          </div>
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <PaymentConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handlePaymentConfirm}
        topupAmount={topupAmount}
        paymentAmount={paymentAmount}
        paymentMethod={selectedPaymentMethod}
        calculating={calculating}
        processing={processing || waffoProcessing || pancakeProcessing}
        discountRate={getDiscountRate()}
        usdExchangeRate={effectiveUsdExchangeRate}
      />

      <BillingHistoryDialog
        open={billingDialogOpen}
        onOpenChange={setBillingDialogOpen}
        payMethods={topupInfo?.pay_methods}
      />

      <CreemConfirmDialog
        open={creemDialogOpen}
        onOpenChange={setCreemDialogOpen}
        onConfirm={handleCreemConfirm}
        product={selectedCreemProduct}
        processing={creemProcessing}
      />
    </>
  )
}
