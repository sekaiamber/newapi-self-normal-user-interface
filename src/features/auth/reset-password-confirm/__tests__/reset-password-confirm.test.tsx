/*
 * [user-ui] 重置密码确认页：后端生成的新密码醒目展示的测试（本仓库新增文件，非官方代码）。审计 2.13 U4。
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@/context/theme-provider'
import { api } from '@/lib/api'
import { copyToClipboard } from '@/lib/copy-to-clipboard'

import { ResetPasswordConfirm } from '..'

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { children: ReactNode; to: string; className?: string }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({
    logo: '/favicon.svg',
    systemName: 'SwarmRouter',
    loading: false,
  }),
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({ status: {}, loading: false }),
}))

vi.mock('@/lib/copy-to-clipboard', () => ({
  copyToClipboard: vi.fn(),
}))

function renderPage() {
  return render(
    <ThemeProvider>
      <ResetPasswordConfirm email='demo@example.com' token='reset-token' />
    </ThemeProvider>
  )
}

beforeEach(() => {
  // 网络边界：只替换这一次 POST 请求
  vi.spyOn(api, 'post').mockResolvedValue({
    data: { success: true, message: '', data: 'NewPw-7f3K' },
  })
  vi.mocked(copyToClipboard).mockResolvedValue(true)
})

describe('ResetPasswordConfirm', () => {
  it('shows the generated password with a copy button and next steps', async () => {
    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'auth.resetPasswordConfirm.confirm' })
    )

    const panel = await screen.findByTestId('reset-new-password')
    expect(panel).toHaveTextContent('NewPw-7f3K')
    expect(panel).toHaveTextContent('auth.reset.useThisPassword')
    expect(
      screen.getByRole('button', { name: 'auth.reset.copyPassword' })
    ).toBeInTheDocument()
  })

  it('only claims the password was copied when copying worked', async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(false)
    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'auth.resetPasswordConfirm.confirm' })
    )

    const panel = await screen.findByTestId('reset-new-password')
    expect(panel).not.toHaveTextContent('auth.reset.copied')
  })

  it('sends the reset request with the link parameters', async () => {
    renderPage()

    await userEvent.click(
      screen.getByRole('button', { name: 'auth.resetPasswordConfirm.confirm' })
    )

    expect(api.post).toHaveBeenCalledWith(
      '/api/user/reset',
      { email: 'demo@example.com', token: 'reset-token' },
      expect.anything()
    )
  })
})
