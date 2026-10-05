/*
 * [user-ui] 日志时间范围选择器（预设名称、立即生效）测试（本仓库新增文件，非官方代码）。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import { afterEach, beforeAll, expect, it, vi } from 'vitest'

import { overridesEn } from '@/i18n/overrides'
import { api } from '@/lib/api'

import { getPresetRange } from '../../lib/time-range-presets'
import { getDefaultTimeRange } from '../../lib/utils'
import { CommonLogsFilterBar } from '../common-logs-filter-bar'
import { CompactDateTimeRangePicker } from '../compact-date-time-range-picker'
import { UsageLogsProvider } from '../usage-logs-provider'

beforeAll(() => {
  i18next.addResourceBundle('en', 'translation', overridesEn, true, true)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('names a preset range on the trigger and keeps the exact dates in its accessible name', () => {
  const range = getDefaultTimeRange()
  render(
    <CompactDateTimeRangePicker
      namePresets
      start={range.start}
      end={range.end}
      onChange={() => {}}
    />
  )
  const trigger = screen.getByRole('button', { name: /^Last 7 days \(/ })
  expect(trigger).toHaveTextContent('Last 7 days')
  expect(trigger.getAttribute('aria-label')).toMatch(
    /\(\d{4}-\d{2}-\d{2} 00:00 ~ \d{4}-\d{2}-\d{2} 23:59\)$/
  )
})

it('keeps the timestamp label when preset names are not requested', () => {
  const range = getDefaultTimeRange()
  render(
    <CompactDateTimeRangePicker
      start={range.start}
      end={range.end}
      onChange={() => {}}
    />
  )
  expect(
    screen.getByRole('button', { name: /^\d{4}-\d{2}-\d{2} 00:00 ~/ })
  ).toBeVisible()
})

function Fixture() {
  const table = useReactTable({
    data: [],
    columns: [],
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <UsageLogsProvider>
      <CommonLogsFilterBar table={table} />
    </UsageLogsProvider>
  )
}

it('applies a picked preset on desktop without pressing Search', async () => {
  vi.spyOn(api, 'get').mockImplementation(async () => ({
    data: { success: true, data: { quota: 0, rpm: 0, tpm: 0 } },
  }))
  const root = createRootRoute()
  const auth = createRoute({ getParentRoute: () => root, id: '_authenticated' })
  const logs = createRoute({
    getParentRoute: () => auth,
    path: '/usage-logs/$section',
    component: Fixture,
    validateSearch: (search: Record<string, unknown>) => search,
  })
  const router = createRouter({
    routeTree: root.addChildren([auth.addChildren([logs])]),
    history: createMemoryHistory({
      initialEntries: ['/usage-logs/common?page=2&model=gpt-x'],
    }),
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
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: /^Last 7 days/ }))
  await user.click(screen.getByRole('button', { name: '30 Days' }))
  const expected = getPresetRange('30d')
  await waitFor(() =>
    expect(router.state.location.search).toMatchObject({
      page: 1,
      model: 'gpt-x',
      startTime: expected.start.getTime(),
      endTime: expected.end.getTime(),
    })
  )
  expect(
    screen.getByRole('button', { name: /^Last 30 days/ })
  ).toHaveTextContent('Last 30 days')
})
