/*
 * [user-ui] "用量统计"页（/dashboard/models）的测试（本仓库新增文件，非官方代码）。
 * 保护：页面标题与 Tab 名称一致、当前时间范围直接可见、没有调用时显示空状态而不是空坐标轴、
 * 加载失败时不误报"没有调用记录"。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import { Dashboard } from '..'

// 画布图表在 jsdom 中无法渲染（与 pricing 测试相同的做法）；这里只验证页面结构与空状态
vi.mock('@visactor/react-vchart', () => ({ VChart: () => null }))
vi.mock('@visactor/vchart', () => ({
  ThemeManager: { setCurrentTheme: () => undefined },
}))

let client: QueryClient
let quotaRequest: () => Promise<unknown>

beforeEach(() => {
  window.localStorage.clear()
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'stats-user',
    role: 1,
  })
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  quotaRequest = async () => ({ data: { success: true, data: [] } })
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/api/data/self') return quotaRequest()
    if (url === '/api/status') return { data: { data: {} } }
    throw new Error(`Unexpected dashboard request: ${url}`)
  })
})

afterEach(() => {
  cleanup()
  client.clear()
  useAuthStore.setState(useAuthStore.getInitialState(), true)
  window.localStorage.clear()
})

async function renderSection(section: string) {
  const rootRoute = createRootRoute()
  const authenticatedRoute = createRoute({
    getParentRoute: () => rootRoute,
    id: '_authenticated',
  })
  const sectionRoute = createRoute({
    getParentRoute: () => authenticatedRoute,
    path: 'dashboard/$section',
    component: Dashboard,
  })
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      authenticatedRoute.addChildren([sectionRoute]),
    ]),
    history: createMemoryHistory({
      initialEntries: [`/dashboard/${section}`],
    }),
  })
  await router.load()
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

describe('usage statistics page', () => {
  it('uses one page title and names the tabs by what they break usage down by', async () => {
    await renderSection('models')

    expect(
      await screen.findByRole('heading', { name: 'usage.stats.title' })
    ).toBeVisible()
    expect(
      screen.getByRole('tab', { name: 'usage.stats.tab.byModel' })
    ).toHaveAttribute('aria-selected', 'true')
    expect(
      screen.getByRole('tab', { name: 'usage.stats.tab.byKey' })
    ).toBeVisible()
    expect(screen.getByText('usage.stats.tab.byModelDescription')).toBeVisible()
  })

  it('shows the applied time range on the range button', async () => {
    await renderSection('models')

    expect(
      await screen.findByRole('button', {
        name: 'usage.stats.filter.title: usage.stats.range.last24h · usage.stats.range.byHour',
      })
    ).toBeVisible()
  })

  it('shows a single empty state with next steps when there are no requests', async () => {
    await renderSection('models')

    expect(
      await screen.findByText('usage.stats.empty.title')
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'usage.stats.empty.tryPlayground' })
    ).toHaveAttribute('href', '/playground')
    expect(
      screen.queryByText('usage.stats.chart.spend')
    ).not.toBeInTheDocument()
  })

  it('does not claim there are no requests when loading fails', async () => {
    quotaRequest = async () => {
      throw new Error('network down')
    }
    await renderSection('models')

    expect(await screen.findAllByText('--')).not.toHaveLength(0)
    expect(
      await screen.findByText('usage.stats.chart.spend')
    ).toBeInTheDocument()
    expect(
      screen.queryByText('usage.stats.empty.title')
    ).not.toBeInTheDocument()
  })
})
