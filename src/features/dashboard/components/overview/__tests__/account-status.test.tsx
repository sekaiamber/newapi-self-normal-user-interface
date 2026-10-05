/*
 * [user-ui] 概览页账户状态与"开始使用"引导的测试（本仓库新增文件，非官方代码）。
 * 使用真实的功能开关（钱包开启、模型广场关闭），保护：余额状态与下一步、钱包入口、
 * 示例请求使用统一的接口地址（src/lib/api-endpoint.ts）、禁用功能不出现。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { OverviewDashboard } from '../overview-dashboard'

let client: QueryClient
let recentRows: unknown[]
let tokenItems: unknown[]

function setUser(fields: Record<string, unknown>) {
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'dashboard-user',
    role: 1,
    ...fields,
  })
}

beforeEach(() => {
  window.localStorage.clear()
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  recentRows = []
  tokenItems = [{ id: 1, name: 'App key', key: 'abcdefghijklmnop', status: 1 }]
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    switch (url) {
      case '/api/token/?p=1&size=10':
        return {
          data: { success: true, data: { items: tokenItems } },
        }
      case '/api/status':
        return {
          data: {
            data: {
              server_address: 'https://api.example.com/',
              api_info_enabled: false,
              announcements_enabled: false,
              faq_enabled: false,
              uptime_kuma_enabled: false,
            },
          },
        }
      case '/api/user/models':
        return { data: { success: true, data: ['demo-model'] } }
      case '/api/data/self':
        return { data: { success: true, data: recentRows } }
      default:
        throw new Error(`Unexpected dashboard request: ${url}`)
    }
  })
})

afterEach(() => {
  cleanup()
  client.clear()
  useAuthStore.setState(useAuthStore.getInitialState(), true)
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
  window.localStorage.clear()
})

async function renderOverview() {
  const router = createRouter({
    routeTree: createRootRoute({ component: OverviewDashboard }),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('overview account status', () => {
  it('shows a healthy balance with a secondary wallet entry', async () => {
    setUser({ quota: 1000000, used_quota: 1000, request_count: 1 })
    await renderOverview()

    expect(
      await screen.findByText('usage.overview.health.healthy')
    ).toBeVisible()
    expect(
      screen.getByText('usage.overview.runway.noRecentUsage')
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'usage.overview.openWallet' })
    ).toHaveAttribute('href', '/wallet')
  })

  it('turns the wallet entry into a top-up action when the balance runs low', async () => {
    setUser({ quota: 1000, used_quota: 5000, request_count: 3 })
    recentRows = [
      { model_name: 'demo-model', quota: 2000, count: 3, created_at: 0 },
    ]
    await renderOverview()

    expect(await screen.findByText('usage.overview.health.low')).toBeVisible()
    expect(
      screen.getByText('usage.overview.runway.lessThanOneDay')
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'usage.overview.topUp' })
    ).toHaveAttribute('href', '/wallet')
  })

  it('tells the user the balance is used up when it reaches zero', async () => {
    setUser({ quota: 0, used_quota: 5000, request_count: 3 })
    await renderOverview()

    expect(
      await screen.findByText('usage.overview.health.depleted')
    ).toBeVisible()
    expect(screen.getByText('usage.overview.runway.depleted')).toBeVisible()
  })
})

describe('overview setup guide content', () => {
  it('uses the shared API base URL and offers one primary next step', async () => {
    setUser({ quota: 1000000, used_quota: 0, request_count: 0 })
    await renderOverview()

    expect(
      await screen.findByRole('heading', { name: 'usage.guide.title' })
    ).toBeInTheDocument()
    expect(screen.getByText('https://api.example.com/v1')).toBeInTheDocument()
    expect(
      screen.getByText(
        /curl https:\/\/api\.example\.com\/v1\/chat\/completions/
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/"model":"demo-model"/)).toBeInTheDocument()
    // 第 1、2 步已完成，下一步是"发送第一个请求"
    expect(
      screen.getByRole('button', { name: 'usage.guide.step.request.action' })
    ).toHaveAttribute('href', '/playground')
    expect(screen.getAllByText('usage.guide.done')).toHaveLength(2)
  })

  it('never links to disabled features from the guide', async () => {
    setUser({ quota: 1000000, used_quota: 0, request_count: 0 })
    await renderOverview()

    await screen.findByRole('heading', { name: 'usage.guide.title' })
    expect(
      screen.queryByRole('button', { name: 'usage.guide.links.pricing' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'usage.guide.links.docs' })
    ).toHaveAttribute('href', '/docs')
  })

  it('asks for a key before offering a copyable command', async () => {
    tokenItems = []
    setUser({ quota: 1000000, used_quota: 0, request_count: 0 })
    await renderOverview()

    expect(
      await screen.findByText('usage.guide.request.needKey')
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Copy ready-to-run curl' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'usage.guide.step.key.action' })
    ).toHaveAttribute('href', '/keys')
  })
})
