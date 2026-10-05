/*
 * [user-ui] 订阅购买付款方式整理的单元测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import { getEpayMethods, getProviderNames } from '../lib/subscription-payment'

const payMethods = [
  { name: '支付宝', type: 'alipay' },
  { name: 'Card', type: 'stripe' },
  { name: 'Pancake', type: 'waffo_pancake' },
  { name: 'Creem', type: 'creem' },
  { name: '自定义', type: 'custom1' },
]

describe('getEpayMethods', () => {
  it('keeps only Epay types and excludes gateways with their own flow, including waffo_pancake', () => {
    expect(getEpayMethods(payMethods).map((m) => m.type)).toEqual([
      'alipay',
      'custom1',
    ])
  })

  it('returns an empty list when nothing is configured', () => {
    expect(getEpayMethods(undefined)).toEqual([])
  })
})

describe('getProviderNames', () => {
  it('maps built-in gateway types to the names configured by the admin', () => {
    expect(getProviderNames(payMethods)).toEqual({
      stripe: 'Card',
      waffo_pancake: 'Pancake',
      creem: 'Creem',
    })
  })

  it('keeps the first configured name when a gateway is listed twice', () => {
    expect(
      getProviderNames([
        { name: 'First', type: 'stripe' },
        { name: 'Second', type: 'stripe' },
      ])
    ).toEqual({ stripe: 'First' })
  })
})
