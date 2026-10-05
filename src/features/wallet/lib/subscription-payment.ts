/*
 * [user-ui] 订阅购买的付款方式整理（本仓库新增文件，非官方代码）。
 * Adapted from QuantumNous/new-api web/src/features/wallet/components/subscription-plans-card.tsx @ v1.0.0-rc.37 (AGPL-3.0)
 *
 * 后台"充值方式"（pay_methods）的 type 决定支付流程：stripe → Stripe，waffo_pancake → Waffo Pancake，
 * 其余值作为易支付的 type 提交（官方设置页说明，
 * official-ui/web/src/features/system-settings/integrations/payment-method-dialog.tsx @ v1.0.0-rc.37）。
 * 官方的 getEpayMethods 只排除了 stripe 和 creem，waffo_pancake 会被当成易支付方式提交；这里一并排除。
 */
import { PAYMENT_TYPES } from '../constants'
import type { PaymentMethod } from '../types'

/** 有专用流程、不能当作易支付提交的内置类型 */
const NON_EPAY_TYPES = new Set<string>([
  PAYMENT_TYPES.STRIPE,
  PAYMENT_TYPES.CREEM,
  PAYMENT_TYPES.WAFFO_PANCAKE,
])

export function getEpayMethods(
  payMethods: PaymentMethod[] = []
): PaymentMethod[] {
  return payMethods.filter((m) => m?.type && !NON_EPAY_TYPES.has(m.type))
}

/** 后台"充值方式"里给 stripe / creem / waffo_pancake 配置的显示名称（type → name） */
export function getProviderNames(
  payMethods: PaymentMethod[] = []
): Record<string, string> {
  const names: Record<string, string> = {}
  for (const m of payMethods) {
    if (m?.type && m.name && NON_EPAY_TYPES.has(m.type) && !names[m.type]) {
      names[m.type] = m.name
    }
  }
  return names
}
