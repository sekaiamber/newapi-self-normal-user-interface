/*
 * [user-ui] 余额预警阈值的显示单位换算（本仓库新增文件，非官方代码）。
 *
 * 后端以额度点存储阈值（默认 500000 = 1 USD，见官方文档
 * guide/feature-guide/admin/system-setting-advanced.md 的 QuotaPerUnit），
 * 而余额按管理员设置的显示方式展示（USD / CNY / 自定义货币 / Tokens）。
 * 输入框改为与余额相同的单位，保存时换算回额度点（审计 2.11 P3）。
 */
import { getCurrencyDisplay } from '@/lib/currency'
import { parseQuotaFromDollars, quotaUnitsToEditableAmount } from '@/lib/format'

/** Symbol shown next to the input (empty in token display mode). */
export function thresholdInputSymbol(): string {
  const { meta } = getCurrencyDisplay()
  return meta.kind === 'tokens' ? '' : meta.symbol
}

/** Stored quota units → text for the input, in the balance display unit. */
export function thresholdUnitsToInput(units: number): string {
  if (!Number.isFinite(units)) return ''
  return String(quotaUnitsToEditableAmount(units))
}

/**
 * Input text in the balance display unit → quota units.
 * Returns null for empty, non-numeric or negative input.
 */
export function thresholdInputToUnits(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const amount = Number(trimmed)
  if (!Number.isFinite(amount) || amount < 0) return null
  return parseQuotaFromDollars(amount)
}
