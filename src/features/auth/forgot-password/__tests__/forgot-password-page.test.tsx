/*
 * [user-ui] 找回密码页文案与链接的测试（本仓库新增文件，非官方代码）。审计 2.13 U7。
 */
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '@/context/theme-provider'

import { ForgotPassword } from '..'

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { children: ReactNode; to: string; className?: string }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
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

function renderPage() {
  return render(
    <ThemeProvider>
      <ForgotPassword />
    </ThemeProvider>
  )
}

describe('ForgotPassword page', () => {
  it('offers a way back to sign-in instead of a sign-up link', () => {
    renderPage()

    const main = screen.getByRole('main')
    expect(
      within(main).getByRole('link', { name: 'Back to login' })
    ).toHaveAttribute('href', '/sign-in')
    for (const link of within(main).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('href', '/sign-up')
    }
  })

  it('says the reset only works for accounts with a linked email', () => {
    renderPage()

    expect(screen.getByText('auth.forgot.emailOnly')).toBeInTheDocument()
  })

  it('labels the email field through i18n', () => {
    renderPage()

    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'placeholder',
      'name@example.com'
    )
  })
})
