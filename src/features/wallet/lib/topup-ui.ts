/*
 * [user-ui] 充值区共用的展示常量与格式化（本仓库新增文件，非官方代码）。
 */
import { formatLocalCurrencyAmount } from '@/lib/currency'

/** 区块小标题 */
export const SECTION_LABEL = 'text-foreground text-sm font-semibold'

/** 可选块的选中态：浅金底 + 主色描边（与按钮的近黑边区分） */
export const SELECTED_TILE =
  'border-primary-edge bg-accent text-accent-foreground hover:bg-accent dark:border-primary'

/**
 * 充值额度的显示值：与官方支付确认弹窗相同的算法（数量 × 显示汇率，按站点显示货币格式化）。
 */
export function formatTopupQuota(amount: number, usdExchangeRate: number) {
  return formatLocalCurrencyAmount(amount * usdExchangeRate, {
    digitsLarge: 2,
    digitsSmall: 2,
    abbreviate: false,
  })
}
