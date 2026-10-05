/*
 * [user-ui] "按密钥"（用量流向）Tab 的测试（本仓库新增文件，非官方代码）。
 * 保护：只有一个分组时默认隐藏"分组"列（可手动显示）、节点很少时不显示无效的数量控件、
 * 没有关联密钥的调用使用可翻译的名称、没有数据时显示说明而不是控件。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import { FlowCharts } from '../flow-charts'

// 画布图表在 jsdom 中无法渲染：记录传给图表的 spec，验证节点名称
let renderedSpec: unknown = null
vi.mock('@visactor/react-vchart', () => ({
  VChart: (props: { spec: unknown }) => {
    renderedSpec = props.spec
    return null
  },
}))
vi.mock('@visactor/vchart', () => ({
  ThemeManager: { setCurrentTheme: () => undefined },
}))

let client: QueryClient
let flowRows: unknown[]

beforeEach(() => {
  renderedSpec = null
  useAuthStore
    .getState()
    .auth.setUser({ id: 1, username: 'flow-user', role: 1 })
  client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  flowRows = []
  vi.spyOn(api, 'get').mockImplementation(async (url) => {
    if (url === '/api/data/flow/self') {
      return { data: { success: true, data: flowRows } }
    }
    throw new Error(`Unexpected flow request: ${url}`)
  })
})

afterEach(() => {
  cleanup()
  client.clear()
  useAuthStore.setState(useAuthStore.getInitialState(), true)
})

function row(fields: Record<string, unknown>) {
  return {
    token_id: 7,
    token_name: 'App key',
    use_group: 'default',
    model_name: 'demo-model',
    count: 2,
    quota: 100,
    token_used: 50,
    ...fields,
  }
}

function renderFlow() {
  return render(
    <QueryClientProvider client={client}>
      <FlowCharts />
    </QueryClientProvider>
  )
}

describe('usage flow by key', () => {
  it('hides the group column by default when every request used the same group', async () => {
    const user = userEvent.setup()
    flowRows = [row({}), row({ model_name: 'other-model' })]
    renderFlow()

    const groupToggle = await screen.findByRole('button', {
      name: 'usage.flow.stage.group',
    })
    await waitFor(() =>
      expect(groupToggle).toHaveAttribute('aria-pressed', 'false')
    )
    await user.click(groupToggle)
    expect(groupToggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps the group column when requests used different groups', async () => {
    flowRows = [row({}), row({ use_group: 'vip' })]
    renderFlow()

    const groupToggle = await screen.findByRole('button', {
      name: 'usage.flow.stage.group',
    })
    await waitFor(() =>
      expect(groupToggle).toHaveAttribute('aria-pressed', 'true')
    )
  })

  it('hides the per-column limit controls when no column has more nodes than the smallest limit', async () => {
    flowRows = [row({})]
    renderFlow()

    expect(
      await screen.findByRole('tablist', { name: 'usage.flow.metric.label' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('tablist', { name: 'usage.flow.limit.label' })
    ).not.toBeInTheDocument()
  })

  it('names requests without a key with a translatable label', async () => {
    flowRows = [row({ token_id: 0, token_name: '' })]
    renderFlow()

    await waitFor(() => expect(renderedSpec).not.toBeNull())
    const specText = JSON.stringify(renderedSpec)
    expect(specText).toContain('usage.flow.noKey')
    expect(specText).not.toContain('Unknown Token')
  })

  it('explains the empty state and hides the chart controls when there is no data', async () => {
    renderFlow()

    expect(await screen.findByText('usage.stats.empty.title')).toBeVisible()
    expect(screen.getByText('usage.flow.emptyDescription')).toBeVisible()
    expect(
      screen.queryByRole('tablist', { name: 'usage.flow.metric.label' })
    ).not.toBeInTheDocument()
  })
})
