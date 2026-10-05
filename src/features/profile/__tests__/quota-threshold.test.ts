/*
 * [user-ui] 余额预警阈值单位换算的测试（本仓库新增文件，非官方代码）。
 */
import { afterEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
  type CurrencyConfig,
} from '@/stores/system-config-store'

import {
  thresholdInputSymbol,
  thresholdInputToUnits,
  thresholdUnitsToInput,
} from '../lib/quota-threshold'

function setCurrency(patch: Partial<CurrencyConfig>) {
  useSystemConfigStore.getState().setConfig({
    currency: { ...DEFAULT_CURRENCY_CONFIG, ...patch },
  })
}

afterEach(() => setCurrency({}))

describe('balance warning threshold units', () => {
  it('shows the stored default of 500000 quota units as 1 in USD display', () => {
    setCurrency({ quotaDisplayType: 'USD' })
    expect(thresholdInputSymbol()).toBe('$')
    expect(thresholdUnitsToInput(500000)).toBe('1')
    expect(thresholdInputToUnits('2.5')).toBe(1250000)
  })

  it('uses the configured exchange rate in CNY display', () => {
    setCurrency({ quotaDisplayType: 'CNY', usdExchangeRate: 7 })
    expect(thresholdInputSymbol()).toBe('¥')
    expect(thresholdUnitsToInput(500000)).toBe('7')
    expect(thresholdInputToUnits('7')).toBe(500000)
  })

  it('keeps raw units when the balance is displayed as tokens', () => {
    setCurrency({ quotaDisplayType: 'TOKENS' })
    expect(thresholdInputSymbol()).toBe('')
    expect(thresholdUnitsToInput(500000)).toBe('500000')
    expect(thresholdInputToUnits('1200')).toBe(1200)
  })

  it('rejects empty, non-numeric and negative input', () => {
    expect(thresholdInputToUnits('')).toBeNull()
    expect(thresholdInputToUnits('  ')).toBeNull()
    expect(thresholdInputToUnits('abc')).toBeNull()
    expect(thresholdInputToUnits('-1')).toBeNull()
    expect(thresholdInputToUnits('0')).toBe(0)
  })
})
