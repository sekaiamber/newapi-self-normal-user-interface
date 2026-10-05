/*
 * [user-ui] 在线试用页面的交互测试（本仓库新增文件，非官方代码）：
 * 起始示例只填入输入框、不发送；"查看代码"使用统一的接口地址。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import playgroundEn from '@/i18n/overrides/playground.en.json'

import { Playground } from '..'
import * as playgroundApi from '../api'

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { children?: ReactNode; to: string; className?: string }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({
    status: { server_address: 'https://api.example.com' },
    loading: false,
    error: null,
  }),
}))

vi.mock('../api', () => ({
  getUserGroups: vi.fn(async () => [
    { label: 'default', value: 'default', ratio: 1, desc: 'Default' },
  ]),
  getUserModels: vi.fn(async () => [
    { label: 'claude-sonnet-5', value: 'claude-sonnet-5' },
  ]),
  sendChatCompletion: vi.fn(),
}))

beforeAll(() => {
  i18next.addResourceBundle('en', 'translation', playgroundEn, true, true)
})

afterEach(() => {
  localStorage.clear()
})

function renderPlayground() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Playground />
      </TooltipProvider>
    </QueryClientProvider>
  )
}

describe('Playground page', () => {
  it('shows the page title', () => {
    renderPlayground()

    expect(
      screen.getByRole('heading', { name: 'Playground' })
    ).toBeInTheDocument()
  })

  it('fills the input with the example prompt without sending it', async () => {
    const user = userEvent.setup()
    renderPlayground()

    // the stored conversation loads asynchronously before the examples appear
    await user.click(
      await screen.findByRole('button', { name: /Explain a concept/ })
    )

    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue(
      playgroundEn['playground.starter.explain.prompt']
    )
    expect(textarea).toHaveFocus()
    expect(playgroundApi.sendChatCompletion).not.toHaveBeenCalled()
    // the examples stay visible: no message was added to the conversation
    expect(
      screen.getByRole('button', { name: /Explain a concept/ })
    ).toBeInTheDocument()
  })

  it('shows a curl example for the shared API address with the current draft', async () => {
    const user = userEvent.setup()
    renderPlayground()
    await screen.findAllByText('claude-sonnet-5')

    await user.type(screen.getByRole('textbox'), 'ping')
    await user.click(screen.getByRole('button', { name: /View code/ }))

    const dialog = await screen.findByRole('dialog')
    const code = within(dialog).getByText(
      /curl https:\/\/api\.example\.com\/v1\/chat\/completions/
    )
    expect(code).toBeInTheDocument()
    expect(within(dialog).getByText(/"content": "ping"/)).toBeInTheDocument()
  })
})
