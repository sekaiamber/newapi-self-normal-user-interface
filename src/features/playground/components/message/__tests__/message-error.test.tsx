/*
 * [user-ui] 在线试用错误卡片的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import playgroundEn from '@/i18n/overrides/playground.en.json'
import { useAuthStore } from '@/stores/auth-store'

import type { Message } from '../../../types'
import { MessageError } from '../message-error'

const sidebar = vi.hoisted(() => ({ walletVisible: true }))

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { children?: ReactNode; to: string; className?: string }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
}))

vi.mock('@/hooks/use-sidebar-config', () => ({
  useIsSidebarModuleVisible: () => sidebar.walletVisible,
}))

beforeAll(() => {
  i18next.addResourceBundle('en', 'translation', playgroundEn, true, true)
})

afterEach(() => {
  useAuthStore.setState(useAuthStore.getInitialState(), true)
  sidebar.walletVisible = true
})

function errorMessage(content: string, errorCode?: string): Message {
  return {
    key: 'assistant-1',
    from: 'assistant',
    status: 'error',
    errorCode: errorCode ?? null,
    versions: [{ id: 'v1', content }],
  }
}

describe('MessageError', () => {
  it('explains an insufficient balance and links to the wallet', () => {
    render(
      <MessageError
        message={errorMessage(
          'Request error occurred: 预扣费额度失败 (request id: 1)',
          'insufficient_user_quota'
        )}
      />
    )

    expect(screen.getByText('Insufficient balance')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Top up in Wallet/ })
    ).toHaveAttribute('href', '/wallet')
  })

  it('omits the wallet link when the wallet is hidden', () => {
    sidebar.walletVisible = false
    render(
      <MessageError
        message={errorMessage('预扣费额度失败', 'insufficient_user_quota')}
      />
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('keeps the original backend text behind a details toggle', async () => {
    const user = userEvent.setup()
    render(
      <MessageError
        message={errorMessage(
          'Request error occurred: No available channel for model gpt-4o under group default (request id: 9)',
          'model_not_found'
        )}
      />
    )

    expect(
      screen.getByText('This model is not available right now')
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: /Original error message/ })
    )
    expect(
      screen.getByText(/No available channel for model gpt-4o/)
    ).toBeInTheDocument()
  })

  it('gives administrators a text hint instead of a settings link for unpriced models', () => {
    useAuthStore.getState().auth.setUser({ id: 1, username: 'root', role: 100 })
    render(
      <MessageError
        message={errorMessage('price missing', 'model_price_error')}
      />
    )

    expect(
      screen.getByText(playgroundEn['playground.error.modelPrice.adminHint'])
    ).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /settings/i })
    ).not.toBeInTheDocument()
  })

  it('hides the administrator hint from regular users', () => {
    useAuthStore.getState().auth.setUser({ id: 2, username: 'user', role: 1 })
    render(
      <MessageError
        message={errorMessage('price missing', 'model_price_error')}
      />
    )

    expect(
      screen.queryByText(playgroundEn['playground.error.modelPrice.adminHint'])
    ).not.toBeInTheDocument()
  })

  it('shows the original text directly for unrecognised errors', () => {
    render(
      <MessageError
        message={errorMessage('Request error occurred: upstream exploded')}
      />
    )

    expect(screen.getByText('Request failed')).toBeInTheDocument()
    expect(screen.getByText('upstream exploded')).toBeInTheDocument()
  })
})
