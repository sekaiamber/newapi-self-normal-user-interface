/*
 * [user-ui] 调用记录表格的默认列与空状态测试（本仓库新增文件，非官方代码）。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'

import { overridesEn } from '@/i18n/overrides'
import { api } from '@/lib/api'

import { getPresetRange } from '../../lib/time-range-presets'
import type { LogCategory } from '../../types'
import { UsageLogsProvider } from '../usage-logs-provider'
import { UsageLogsTable } from '../usage-logs-table'

vi.mock('@lobehub/icons', () => ({}))

beforeAll(() => {
  i18next.addResourceBundle('en', 'translation', overridesEn, true, true)
})

beforeEach(() => {
  window.localStorage.clear()
  vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
    if (url.startsWith('/api/log/self/stat')) {
      return { data: { success: true, data: { quota: 0, rpm: 0, tpm: 0 } } }
    }
    if (url.startsWith('/api/log/self') || url.startsWith('/api/task/self')) {
      return { data: { success: true, data: { items: [], total: 0 } } }
    }
    return { data: { success: true, data: {} } }
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function renderTable(initialEntry: string, logCategory: LogCategory) {
  const root = createRootRoute()
  const auth = createRoute({ getParentRoute: () => root, id: '_authenticated' })
  const logs = createRoute({
    getParentRoute: () => auth,
    path: '/usage-logs/$section',
    component: () => (
      <UsageLogsProvider>
        <UsageLogsTable logCategory={logCategory} />
      </UsageLogsProvider>
    ),
    validateSearch: (search: Record<string, unknown>) => search,
  })
  const docs = createRoute({ getParentRoute: () => root, path: '/docs' })
  const playground = createRoute({
    getParentRoute: () => root,
    path: '/playground',
  })
  const router = createRouter({
    routeTree: root.addChildren([auth.addChildren([logs]), docs, playground]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  })
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  return router
}

it('shows key, model, tokens and cost by default and hides streaming and timing', async () => {
  renderTable('/usage-logs/common', 'common')
  for (const name of ['API key', 'Model', 'Input / output tokens', 'Cost']) {
    expect(await screen.findByRole('columnheader', { name })).toBeVisible()
  }
  expect(
    screen.queryByRole('columnheader', { name: 'Streaming' })
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('columnheader', { name: 'Timing' })
  ).not.toBeInTheDocument()
})

it('explains an empty call log and widens the range to the last 30 days', async () => {
  const router = renderTable('/usage-logs/common', 'common')
  expect(await screen.findByText('No API calls in this period')).toBeVisible()
  // Base UI renders the link-styled Button with role="button"
  expect(
    screen.getByRole('button', { name: 'Read the docs' }).closest('a')
  ).toHaveAttribute('href', '/docs')
  expect(
    screen.getByRole('button', { name: 'Try the playground' }).closest('a')
  ).toHaveAttribute('href', '/playground')
  await userEvent.click(
    screen.getByRole('button', { name: 'Show last 30 days' })
  )
  const expected = getPresetRange('30d')
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({
      page: 1,
      startTime: expected.start.getTime(),
    })
  )
  expect(
    screen.queryByRole('button', { name: 'Show last 30 days' })
  ).not.toBeInTheDocument()
})

it('says nothing matches when a filter is set and clears the filters', async () => {
  const router = renderTable('/usage-logs/common?model=gpt-x', 'common')
  expect(await screen.findByText('No matching records')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  await waitFor(() =>
    expect(router.state.location.search).not.toHaveProperty('model')
  )
  expect(await screen.findByText('No API calls in this period')).toBeVisible()
})

it('describes async tasks on an empty task log', async () => {
  renderTable('/usage-logs/task', 'task')
  expect(await screen.findByText('No tasks in this period')).toBeVisible()
  expect(
    screen.getByText(/asynchronous generation API/, { exact: false })
  ).toBeVisible()
  expect(
    screen.queryByRole('button', { name: 'Try the playground' })
  ).not.toBeInTheDocument()
})
