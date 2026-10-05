/*
 * [user-ui] 密钥表单分区规则（本仓库新增文件，非官方代码）。
 */
import { describe, expect, test } from 'vitest'

import {
  hasAdvancedFieldError,
  hasAdvancedRestrictions,
  shouldShowGroupField,
} from '../form-sections'

describe('shouldShowGroupField', () => {
  test('shows the group picker when there is more than one group', () => {
    expect(shouldShowGroupField(['default', 'vip'], '')).toBe(true)
  })

  test.each([
    [[], ''],
    [['default'], ''],
    [['default'], 'default'],
  ])('hides it when there is nothing to choose (%j, %j)', (groups, current) => {
    expect(shouldShowGroupField(groups, current)).toBe(false)
  })

  test('keeps it visible when the key uses a group outside the available list', () => {
    expect(shouldShowGroupField(['default'], 'legacy')).toBe(true)
  })
})

describe('advanced section helpers', () => {
  test('detects errors on fields kept under Advanced only', () => {
    expect(hasAdvancedFieldError({ auto_groups: { type: 'custom' } })).toBe(
      true
    )
    expect(hasAdvancedFieldError({ name: { type: 'too_small' } })).toBe(false)
  })

  test('treats model or IP restrictions as advanced settings worth showing', () => {
    expect(hasAdvancedRestrictions({ model_limits: [], allow_ips: ' ' })).toBe(
      false
    )
    expect(
      hasAdvancedRestrictions({ model_limits: ['m'], allow_ips: '' })
    ).toBe(true)
    expect(
      hasAdvancedRestrictions({ model_limits: [], allow_ips: '10.0.0.1' })
    ).toBe(true)
  })
})
