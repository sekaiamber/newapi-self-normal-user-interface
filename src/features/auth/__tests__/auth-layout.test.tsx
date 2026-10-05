/*
 * [user-ui] 认证页布局（品牌区、logo、源码声明）的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BRAND_ASSETS } from '@/assets/brand'
import { ThemeProvider } from '@/context/theme-provider'
import { DEFAULT_LOGO } from '@/lib/constants'

import { AuthLayout } from '../auth-layout'

const config = vi.hoisted(() => ({
  logo: '/favicon.svg',
  systemName: 'SwarmRouter',
  loading: false,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: (props: {
    children: ReactNode
    to: string
    className?: string
    'aria-label'?: string
    'data-testid'?: string
  }) => (
    <a
      href={props.to}
      className={props.className}
      aria-label={props['aria-label']}
      data-testid={props['data-testid']}
    >
      {props.children}
    </a>
  ),
}))

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({ ...config }),
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({
    status: { server_address: 'https://api.example.com' },
    loading: false,
  }),
}))

function renderLayout() {
  return render(
    <ThemeProvider>
      <AuthLayout>
        <h1>Sign in</h1>
      </AuthLayout>
    </ThemeProvider>
  )
}

beforeEach(() => {
  config.logo = DEFAULT_LOGO
  config.systemName = 'SwarmRouter'
  config.loading = false
})

describe('AuthLayout', () => {
  it('shows the uncropped SwarmRouter lockup when no custom logo is configured', () => {
    renderLayout()

    for (const mark of screen.getAllByTestId('auth-brand-mark')) {
      const images = within(mark).getAllByRole('img', { name: 'SwarmRouter' })
      expect(images.map((img) => img.getAttribute('src'))).toEqual([
        BRAND_ASSETS.logo,
        BRAND_ASSETS.logoDark,
      ])
      for (const img of images) expect(img).not.toHaveClass('rounded-full')
    }
  })

  it('keeps an admin-configured logo next to the configured site name', () => {
    config.logo = 'https://cdn.example.com/acme.png'
    config.systemName = 'Acme AI'
    renderLayout()

    const mark = screen.getAllByTestId('auth-brand-mark')[0]
    expect(within(mark).getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/acme.png'
    )
    expect(within(mark).getByText('Acme AI')).toBeInTheDocument()
  })

  it('shows the brand icon beside a renamed site that still uses the default logo', () => {
    config.systemName = 'Acme AI'
    renderLayout()

    const mark = screen.getAllByTestId('auth-brand-mark')[0]
    expect(
      within(mark)
        .getAllByRole('img')
        .map((img) => img.getAttribute('src'))
    ).toEqual([BRAND_ASSETS.icon, BRAND_ASSETS.iconDark])
    expect(within(mark).getByText('Acme AI')).toBeInTheDocument()
  })

  it('shows the source code and license links', () => {
    renderLayout()

    expect(
      within(screen.getByTestId('source-notice')).getAllByRole('link')
    ).toHaveLength(2)
  })

  it('shows the OpenAI-compatible base URL from the configured server address', () => {
    renderLayout()

    expect(screen.getByTestId('auth-brand-base-url')).toHaveTextContent(
      'https://api.example.com/v1'
    )
  })

  it('renders the page content in the form column', () => {
    renderLayout()

    expect(
      within(screen.getByRole('main')).getByRole('heading', { name: 'Sign in' })
    ).toBeInTheDocument()
  })
})
