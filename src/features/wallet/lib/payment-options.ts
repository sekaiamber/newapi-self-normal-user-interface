/*
 * [user-ui] 钱包充值的"支付方式选项"（本仓库新增文件，非官方代码）。
 * Adapted from QuantumNous/new-api web/src/features/wallet/components/recharge-form-card.tsx @ v1.0.0-rc.37 (AGPL-3.0)
 *
 * 官方界面里每个支付方式按钮点下去就直接下单；这里改为"先选方式，再点一个主按钮去支付"，
 * 所以把官方分散在按钮里的判断（可用条件、最低充值额、Waffo 的序号）收拢成一个选项列表。
 * 下单仍走官方的处理函数（index.tsx 的 handlePaymentMethodSelect / handleWaffoMethodSelect）。
 */
import { PAYMENT_TYPES } from '../constants'
import type { PaymentMethod, TopupInfo, WaffoPayMethod } from '../types'
import { getMinTopupAmount } from './payment'

export type PaymentOption =
  | {
      key: string
      kind: 'standard'
      name: string
      method: PaymentMethod
      minTopup: number
    }
  | {
      key: string
      kind: 'waffo'
      name: string
      method: WaffoPayMethod
      /** 后端 waffo_pay_methods 中的序号，下单时原样提交 */
      index: number
      minTopup: number
    }

/** 后台是否启用了需要"选金额 + 选方式"的充值通道（Creem 是按商品购买，不在此列） */
export function hasConfigurableTopup(topupInfo: TopupInfo | null): boolean {
  return Boolean(
    topupInfo?.enable_online_topup ||
    topupInfo?.enable_stripe_topup ||
    topupInfo?.enable_waffo_topup ||
    topupInfo?.enable_waffo_pancake_topup
  )
}

/** 是否有可购买的 Creem 商品 */
export function hasCreemProducts(topupInfo: TopupInfo | null): boolean {
  return Boolean(
    topupInfo?.enable_creem_topup &&
    Array.isArray(topupInfo.creem_products) &&
    topupInfo.creem_products.length > 0
  )
}

/**
 * 按后台配置的顺序列出支付方式：先是"充值方式"（pay_methods，名称由管理员配置），
 * 再是 Waffo 的支付方式。与官方一致：只有启用了可配置充值通道时才列出。
 */
export function buildPaymentOptions(
  topupInfo: TopupInfo | null
): PaymentOption[] {
  if (!topupInfo || !hasConfigurableTopup(topupInfo)) return []

  const globalMin = getMinTopupAmount(topupInfo)
  const options: PaymentOption[] = (topupInfo.pay_methods ?? []).map(
    (method) => ({
      key: `pay:${method.type}`,
      kind: 'standard' as const,
      name: method.name,
      method,
      minTopup: Math.max(method.min_topup || 0, globalMin),
    })
  )

  if (topupInfo.enable_waffo_topup) {
    const waffoMin = topupInfo.waffo_min_topup || 0
    ;(topupInfo.waffo_pay_methods ?? []).forEach((method, index) => {
      options.push({
        key: `waffo:${index}`,
        kind: 'waffo',
        name: method.name,
        method,
        index,
        minTopup: waffoMin,
      })
    })
  }

  return options
}

/** 选项对应的支付类型（用于计算应付金额） */
export function getPaymentOptionType(option: PaymentOption): string {
  return option.kind === 'waffo' ? PAYMENT_TYPES.WAFFO : option.method.type
}

/** 默认选中：第一个满足当前金额的方式；都不满足时选第一个（按钮会提示最低金额） */
export function pickDefaultPaymentOption(
  options: PaymentOption[],
  amount: number
): PaymentOption | null {
  return options.find((o) => amount >= o.minTopup) ?? options[0] ?? null
}
