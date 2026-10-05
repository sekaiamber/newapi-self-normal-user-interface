/*
 * [user-ui] 充值支付方式选项的单元测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import {
  buildPaymentOptions,
  getPaymentOptionType,
  hasConfigurableTopup,
  hasCreemProducts,
  pickDefaultPaymentOption,
} from '../lib/payment-options'
import type { TopupInfo } from '../types'

function topupInfo(overrides: Partial<TopupInfo> = {}): TopupInfo {
  return {
    enable_online_topup: true,
    enable_stripe_topup: false,
    pay_methods: [
      { name: '支付宝', type: 'alipay' },
      { name: 'Card', type: 'stripe', min_topup: 50 },
    ],
    min_topup: 5,
    stripe_min_topup: 50,
    amount_options: [],
    discount: {},
    ...overrides,
  }
}

describe('buildPaymentOptions', () => {
  it('lists configured methods in admin order with their configured names and effective minimum', () => {
    const options = buildPaymentOptions(topupInfo())

    expect(options.map((o) => [o.key, o.name, o.minTopup])).toEqual([
      ['pay:alipay', '支付宝', 5],
      ['pay:stripe', 'Card', 50],
    ])
  })

  it('appends Waffo methods with their server index only when Waffo is enabled', () => {
    const waffoMethods = [{ name: 'Visa' }, { name: 'Mastercard' }]
    const disabled = buildPaymentOptions(
      topupInfo({ waffo_pay_methods: waffoMethods, enable_waffo_topup: false })
    )
    const enabled = buildPaymentOptions(
      topupInfo({
        waffo_pay_methods: waffoMethods,
        enable_waffo_topup: true,
        waffo_min_topup: 20,
      })
    )

    expect(disabled.some((o) => o.kind === 'waffo')).toBe(false)
    const waffo = enabled.filter((o) => o.kind === 'waffo')
    expect(waffo.map((o) => [o.name, o.minTopup])).toEqual([
      ['Visa', 20],
      ['Mastercard', 20],
    ])
    expect(waffo[1]).toMatchObject({ kind: 'waffo', index: 1 })
    expect(getPaymentOptionType(waffo[1])).toBe('waffo')
  })

  it('returns no options when no configurable top-up channel is enabled', () => {
    const info = topupInfo({ enable_online_topup: false })

    expect(hasConfigurableTopup(info)).toBe(false)
    expect(buildPaymentOptions(info)).toEqual([])
    expect(buildPaymentOptions(null)).toEqual([])
  })
})

describe('pickDefaultPaymentOption', () => {
  it('prefers the first method that accepts the current amount', () => {
    const options = buildPaymentOptions(
      topupInfo({
        pay_methods: [
          { name: 'Card', type: 'stripe', min_topup: 50 },
          { name: '支付宝', type: 'alipay' },
        ],
      })
    )

    expect(pickDefaultPaymentOption(options, 10)?.name).toBe('支付宝')
  })

  it('falls back to the first method when none accepts the amount, and to null when empty', () => {
    const options = buildPaymentOptions(
      topupInfo({
        pay_methods: [{ name: 'Card', type: 'stripe', min_topup: 50 }],
      })
    )

    expect(pickDefaultPaymentOption(options, 1)?.name).toBe('Card')
    expect(pickDefaultPaymentOption([], 1)).toBeNull()
  })
})

describe('hasCreemProducts', () => {
  it('requires Creem to be enabled and at least one product', () => {
    const product = {
      name: 'Pack',
      productId: 'p1',
      price: 5,
      quota: 1000,
      currency: 'USD' as const,
    }

    expect(hasCreemProducts(topupInfo({ enable_creem_topup: true }))).toBe(
      false
    )
    expect(
      hasCreemProducts(
        topupInfo({ enable_creem_topup: false, creem_products: [product] })
      )
    ).toBe(false)
    expect(
      hasCreemProducts(
        topupInfo({ enable_creem_topup: true, creem_products: [product] })
      )
    ).toBe(true)
  })
})
