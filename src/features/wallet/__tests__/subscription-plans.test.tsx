/*
 * [user-ui] 订阅套餐卡片与购买弹窗的行为测试（本仓库新增文件，非官方代码）。
 * 只 mock 网络边界（api.get / api.post）。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import walletEn from '@/i18n/overrides/wallet.en.json'
import { api } from '@/lib/api'

import { SubscriptionPlansCard } from '../components/subscription-plans-card'
import type { TopupInfo } from '../types'

const PLAN = {
  plan: {
    id: 7,
    title: 'Pro',
    subtitle: 'For teams',
    price_amount: 9.9,
    currency: 'USD',
    duration_unit: 'month',
    duration_value: 1,
    total_amount: 0,
    enabled: true,
    allow_balance_pay: true,
    stripe_price_id: 'price_1',
    max_purchase_per_user: 0,
  },
}

const TOPUP: TopupInfo = {
  enable_online_topup: true,
  enable_stripe_topup: true,
  enable_waffo_pancake_topup: false,
  pay_methods: [
    { name: '支付宝', type: 'alipay' },
    { name: 'Card', type: 'stripe' },
    { name: 'Pancake', type: 'waffo_pancake' },
  ],
  min_topup: 1,
  stripe_min_topup: 1,
  amount_options: [],
  discount: {},
}

let postSpy: ReturnType<typeof vi.spyOn>

function ok(data: unknown) {
  return Promise.resolve({ data: { success: true, message: '', data } })
}

function renderCard(userQuota: number) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], {})
  return render(
    <QueryClientProvider client={client}>
      <SubscriptionPlansCard topupInfo={TOPUP} userQuota={userQuota} />
    </QueryClientProvider>
  )
}

async function openPurchase(userQuota: number) {
  const user = userEvent.setup()
  renderCard(userQuota)
  await user.click(
    await screen.findByRole('button', {
      name: walletEn['wallet.subs.subscribe'],
    })
  )
  const dialog = await screen.findByRole('dialog')
  const methods = within(dialog).getByRole('group', {
    name: walletEn['wallet.purchase.methodLabel'],
  })
  return { user, dialog, methods }
}

beforeAll(() => {
  i18next.addResourceBundle('en', 'translation', walletEn, true, true)
})

beforeEach(() => {
  vi.spyOn(api, 'get').mockImplementation(((url: string) => {
    if (url === '/api/subscription/plans') return ok([PLAN])
    if (url === '/api/subscription/self') {
      return ok({
        billing_preference: 'subscription_first',
        subscriptions: [],
        all_subscriptions: [],
      })
    }
    return ok({})
  }) as never)
  postSpy = vi
    .spyOn(api, 'post')
    .mockImplementation((() =>
      Promise.resolve({
        data: { success: false, message: 'blocked' },
      })) as never)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('subscription plans card', () => {
  it('does not label any plan as recommended', async () => {
    renderCard(0)

    expect(await screen.findByText('Pro')).toBeVisible()
    expect(screen.queryByText('Recommended')).not.toBeInTheDocument()
  })

  it('labels the refresh button for assistive technology', async () => {
    renderCard(0)

    expect(
      await screen.findByRole('button', {
        name: walletEn['wallet.subs.refresh'],
      })
    ).toBeInTheDocument()
  })
})

describe('subscription purchase dialog', () => {
  it('lists balance, gateways by configured name and Epay methods, without treating waffo_pancake as Epay', async () => {
    const { methods } = await openPurchase(0)

    const names = within(methods)
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
    expect(names[0]).toContain(walletEn['wallet.purchase.balance'])
    expect(names.slice(1)).toEqual(['Card', '支付宝'])
  })

  it('disables balance when it is insufficient and pre-selects the first usable method behind one primary button', async () => {
    const { dialog, methods } = await openPurchase(0)

    expect(
      within(methods).getByRole('button', {
        name: new RegExp(walletEn['wallet.purchase.balance']),
      })
    ).toBeDisabled()
    expect(
      within(methods).getByRole('button', { name: 'Card' })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(dialog).getAllByRole('button', {
        name: walletEn['wallet.purchase.confirm'],
      })
    ).toHaveLength(1)
  })

  it('submits the chosen Epay method only when the primary button is pressed', async () => {
    const { user, dialog, methods } = await openPurchase(0)

    await user.click(within(methods).getByRole('button', { name: '支付宝' }))
    expect(postSpy).not.toHaveBeenCalled()

    await user.click(
      within(dialog).getByRole('button', {
        name: walletEn['wallet.purchase.confirm'],
      })
    )

    expect(postSpy).toHaveBeenCalledWith('/api/subscription/epay/pay', {
      plan_id: 7,
      payment_method: 'alipay',
    })
  })
})
