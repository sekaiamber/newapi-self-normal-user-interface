/*
 * [user-ui] 概览页信息卡"有内容才显示"的测试（本仓库新增文件，非官方代码）。
 * 后台开关打开但没有内容时，原页面会显示固定高度的空卡片（审计 2.2 #7）。
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
let status: Record<string, unknown>
let uptimeGroups: unknown[]
const originalGetAnimations = Element.prototype.getAnimations

beforeEach(() => {
  // jsdom 没有 Web Animations API，Base UI 的 ScrollArea 会调用它
  Element.prototype.getAnimations ??= () => []
  window.localStorage.clear()
  useSystemConfigStore.setState(useSystemConfigStore.getInitialState(), true)
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'dashboard-user',
    role: 1,
    quota: 1000000,
    used_quota: 1000,
    request_count: 1,
  })
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  status = {
    api_info_enabled: true,
    api_info: [],
    announcements_enabled: true,
    announcements: [],
    faq_enabled: true,
    faq: [],
    uptime_kuma_enabled: true,
  }
  uptimeGroups = []
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    switch (url) {
      case '/api/token/?p=1&size=10':
        return {
          data: {
            success: true,
            data: {
              items: [{ id: 1, name: 'App key', key: 'masked', status: 1 }],
            },
          },
        }
      case '/api/status':
        return { data: { data: status } }
      case '/api/user/models':
        return { data: { success: true, data: ['gpt-4o-mini'] } }
      case '/api/data/self':
        return { data: { success: true, data: [] } }
      case '/api/uptime/status':
        return { data: { success: true, data: uptimeGroups } }
      default:
        throw new Error(`Unexpected dashboard request: ${url}`)
    }
  })
})

afterEach(() => {
  cleanup()
  Element.prototype.getAnimations = originalGetAnimations
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

describe('overview content panels', () => {
  it('hides enabled panels that have no content', async () => {
    await renderOverview()

    await screen.findByRole('heading', { name: 'usage.overview.balance' })
    expect(screen.queryByText('Announcements')).not.toBeInTheDocument()
    expect(screen.queryByText('FAQ')).not.toBeInTheDocument()
    expect(
      screen.queryByText('usage.panels.apiInfo.title')
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('usage.panels.uptime.title')
    ).not.toBeInTheDocument()
  })

  it('shows only the panels that have content', async () => {
    status = {
      ...status,
      faq: [{ id: 1, question: 'How do I pay?', answer: 'Use the wallet.' }],
    }
    uptimeGroups = [
      {
        categoryName: 'Core',
        monitors: [{ name: 'Chat API', status: 1, uptime: 0.999 }],
      },
    ]

    await renderOverview()

    expect(await screen.findByText('FAQ')).toBeInTheDocument()
    expect(
      await screen.findByText('usage.panels.uptime.title')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'usage.panels.uptime.status.up' })
    ).toBeInTheDocument()
    expect(screen.queryByText('Announcements')).not.toBeInTheDocument()
    expect(
      screen.queryByText('usage.panels.apiInfo.title')
    ).not.toBeInTheDocument()
  })
})
