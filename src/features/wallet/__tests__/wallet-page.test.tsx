/*
 * [user-ui] 钱包页行为测试（本仓库新增文件，非官方代码）。
 * 只 mock 网络边界（api.get / api.post），页面、hooks 与功能开关都走真实代码。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
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

import { Wallet } from '..'
import type { TopupInfo } from '../types'

type Json = Record<string, unknown>

const BASE_TOPUP: TopupInfo = {
  enable_online_topup: false,
  enable_stripe_topup: false,
  pay_methods: [],
  min_topup: 1,
  stripe_min_topup: 1,
  amount_options: [],
  discount: {},
  enable_redemption: false,
  topup_link: '',
}

let topupInfo: TopupInfo = BASE_TOPUP
let billingItems: Json[] = []
let getSpy: ReturnType<typeof vi.spyOn>
let postSpy: ReturnType<typeof vi.spyOn>

function ok(data: unknown) {
  return Promise.resolve({ data: { success: true, message: '', data } })
}

function routeGet(url: string) {
  if (url === '/api/user/self') {
    return ok({ id: 1, quota: 5_000_000, used_quota: 0, request_count: 3 })
  }
  if (url === '/api/user/topup/info') return ok(topupInfo)
  if (url === '/api/subscription/plans') return ok([])
  if (url === '/api/subscription/self') {
    return ok({
      billing_preference: 'subscription_first',
      subscriptions: [],
      all_subscriptions: [],
    })
  }
  if (url.startsWith('/api/user/topup/self')) {
    return ok({ items: billingItems, total: billingItems.length })
  }
  if (url === '/api/user/aff') return ok('code')
  return ok({})
}

function routePost(url: string) {
  if (url === '/api/user/amount') return ok('7.30')
  if (url === '/api/user/stripe/amount') return ok('8.00')
  return Promise.resolve({ data: { success: false, message: 'blocked' } })
}

function getCalls(spy: ReturnType<typeof vi.spyOn>): string[] {
  return spy.mock.calls.map((call: unknown[]) => String(call[0]))
}

function renderWallet() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], { price: 1 })
  return render(
    <QueryClientProvider client={client}>
      <Wallet />
    </QueryClientProvider>
  )
}

beforeAll(() => {
  i18next.addResourceBundle('en', 'translation', walletEn, true, true)
})

beforeEach(() => {
  topupInfo = BASE_TOPUP
  billingItems = []
  getSpy = vi
    .spyOn(api, 'get')
    .mockImplementation(((url: string) => routeGet(url)) as never)
  postSpy = vi
    .spyOn(api, 'post')
    .mockImplementation(((url: string) => routePost(url)) as never)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('wallet page with the referral switch off', () => {
  it('does not show the referral card nor request the referral endpoint', async () => {
    renderWallet()

    expect(
      await screen.findByText(walletEn['wallet.funding.allOff'])
    ).toBeInTheDocument()
    expect(screen.queryByText('Referral Program')).not.toBeInTheDocument()
    expect(getCalls(getSpy)).not.toContain('/api/user/aff')
  })
})

describe('funding availability', () => {
  it('shows a single contact-the-administrator notice when top-up and codes are both unavailable', async () => {
    topupInfo = { ...BASE_TOPUP, topup_link: 'https://example.com/buy' }
    renderWallet()

    expect(
      await screen.findByText(walletEn['wallet.funding.allOff'])
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: walletEn['wallet.funding.link'] })
    ).toHaveAttribute('href', 'https://example.com/buy')
    expect(
      screen.queryByRole('button', { name: walletEn['wallet.topup.payButton'] })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText(walletEn['wallet.redeem.placeholder'])
    ).not.toBeInTheDocument()
  })

  it('offers redemption and explains that online top-up is off when only codes are enabled', async () => {
    topupInfo = { ...BASE_TOPUP, enable_redemption: true }
    const user = userEvent.setup()
    renderWallet()

    const input = await screen.findByPlaceholderText(
      walletEn['wallet.redeem.placeholder']
    )
    const redeem = screen.getByRole('button', {
      name: walletEn['wallet.redeem.submit'],
    })
    expect(screen.getByText(walletEn['wallet.funding.topupOff'])).toBeVisible()
    expect(redeem).toBeDisabled()

    await user.type(input, 'CODE-1')

    expect(redeem).toBeEnabled()
  })

  it('redeems the entered code when Enter is pressed in the code field', async () => {
    topupInfo = { ...BASE_TOPUP, enable_redemption: true }
    const user = userEvent.setup()
    renderWallet()
    const input = await screen.findByPlaceholderText(
      walletEn['wallet.redeem.placeholder']
    )

    await user.type(input, 'CODE-1{Enter}')

    await waitFor(() =>
      expect(postSpy).toHaveBeenCalledWith('/api/user/topup', { key: 'CODE-1' })
    )
  })
})

describe('online top-up', () => {
  beforeEach(() => {
    topupInfo = {
      ...BASE_TOPUP,
      enable_online_topup: true,
      enable_stripe_topup: true,
      enable_redemption: true,
      pay_methods: [
        { name: '支付宝', type: 'alipay' },
        { name: 'Card', type: 'stripe', min_topup: 50 },
      ],
    }
  })

  it('pre-selects the first usable configured method and shows a single primary pay button', async () => {
    renderWallet()

    const group = await screen.findByRole('group', {
      name: walletEn['wallet.topup.methodLabel'],
    })
    await waitFor(() =>
      expect(
        within(group).getByRole('button', { name: /支付宝/ })
      ).toHaveAttribute('aria-pressed', 'true')
    )
    expect(within(group).getByRole('button', { name: /Card/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(
      screen.getAllByRole('button', {
        name: walletEn['wallet.topup.payButton'],
      })
    ).toHaveLength(1)
  })

  it('selecting a method recalculates the price but does not place an order; the pay button stays blocked below that method minimum', async () => {
    const user = userEvent.setup()
    renderWallet()
    const group = await screen.findByRole('group', {
      name: walletEn['wallet.topup.methodLabel'],
    })
    // wait until the page has applied its default selection
    await waitFor(() =>
      expect(
        within(group).getByRole('button', { name: /支付宝/ })
      ).toHaveAttribute('aria-pressed', 'true')
    )

    await user.click(within(group).getByRole('button', { name: /Card/ }))

    await waitFor(() =>
      expect(getCalls(postSpy)).toContain('/api/user/stripe/amount')
    )
    expect(
      screen.getByRole('button', { name: walletEn['wallet.topup.payButton'] })
    ).toBeDisabled()
    expect(
      screen.getByText('This payment method requires at least 50')
    ).toBeVisible()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(getCalls(postSpy)).not.toContain('/api/user/stripe/pay')
  })

  it('opens the confirmation dialog from the primary button without submitting a payment', async () => {
    const user = userEvent.setup()
    renderWallet()
    const pay = await screen.findByRole('button', {
      name: walletEn['wallet.topup.payButton'],
    })
    await waitFor(() => expect(pay).toBeEnabled())

    await user.click(pay)

    const dialog = await screen.findByRole('alertdialog')
    expect(
      within(dialog).getByText(walletEn['wallet.confirm.title'])
    ).toBeVisible()
    expect(within(dialog).getByText('支付宝')).toBeVisible()
    expect(getCalls(postSpy)).not.toContain('/api/user/pay')
  })
})

describe('order history', () => {
  it('opens from the page header and shows the configured payment method name', async () => {
    topupInfo = {
      ...BASE_TOPUP,
      enable_online_topup: true,
      pay_methods: [{ name: '支付宝', type: 'alipay' }],
    }
    billingItems = [
      {
        id: 1,
        user_id: 1,
        amount: 10,
        money: 73,
        trade_no: 'T-001',
        payment_method: 'alipay',
        create_time: 1_700_000_000,
        status: 'success',
      },
    ]
    const user = userEvent.setup()
    renderWallet()

    await user.click(
      await screen.findByRole('button', {
        name: walletEn['wallet.orderHistory'],
      })
    )

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('T-001')).toBeVisible()
    expect(within(dialog).getByText('支付宝')).toBeVisible()
    expect(
      within(dialog).getByRole('button', {
        name: walletEn['wallet.billing.copyOrderNo'],
      })
    ).toBeInTheDocument()
  })
})
