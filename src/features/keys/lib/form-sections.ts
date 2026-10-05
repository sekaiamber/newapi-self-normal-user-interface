/*
 * [user-ui] 密钥表单的"基本 / 高级"分区规则（本仓库新增文件，非官方代码）。
 *
 * 审计 2.5 K6：首屏只放名称、有效期、额度上限；分组、自动分组顺序、
 * 跨分组重试、模型限制、IP 白名单、批量数量收进"高级"。
 */
import type { FieldErrors } from 'react-hook-form'

import type { ApiKeyFormValues } from './api-key-form'

export const ADVANCED_FIELD_NAMES = [
  'group',
  'auto_groups',
  'auto_groups_mode',
  'cross_group_retry',
  'model_limits',
  'allow_ips',
  'tokenCount',
] as const satisfies ReadonlyArray<keyof ApiKeyFormValues>

/** 校验失败的字段里是否有收在"高级"中的字段。 */
export function hasAdvancedFieldError(
  errors: FieldErrors<ApiKeyFormValues>
): boolean {
  return ADVANCED_FIELD_NAMES.some((name) => errors[name] != null)
}

/** 编辑已有密钥时，设置了模型或 IP 限制就默认展开"高级"，让限制一眼可见。 */
export function hasAdvancedRestrictions(
  values: Pick<ApiKeyFormValues, 'model_limits' | 'allow_ips'>
): boolean {
  return values.model_limits.length > 0 || Boolean(values.allow_ips?.trim())
}

/**
 * 分组选择只在确实有得选时出现（审计 2.5 K5 ①）：
 * 可选分组 ≤ 1 个，且当前值为空（跟随账户）或就是那一个分组时隐藏。
 */
export function shouldShowGroupField(
  groupValues: readonly string[],
  currentGroup: string | undefined
): boolean {
  if (groupValues.length > 1) return true
  if (!currentGroup) return false
  return !groupValues.includes(currentGroup)
}
