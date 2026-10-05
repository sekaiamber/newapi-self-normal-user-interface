/*
 * [user-ui] 头像菜单的测试（本仓库新增文件，非官方代码）。
 * 控制台顶栏精简后，外观（浅/深/跟随系统）与语言收进头像菜单（审计 1.3）。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeProvider } from '@/context/theme-provider'
import { removeCookie } from '@/lib/cookies'
import { useAuthStore } from '@/stores/auth-store'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

afterEach(() => {
  navigate.mockReset()
  removeCookie('vite-ui-theme')
  document.documentElement.classList.remove('light', 'dark')
  useAuthStore.getState().auth.reset()
})

function renderDropdown(
  node: ReactNode,
  user: { role?: number; group?: string } = {}
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], { SidebarModulesAdmin: '' })
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'alice',
    role: 1,
    permissions: { sidebar_settings: true },
    sidebar_modules: '',
    ...user,
  })
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider>{node}</ThemeProvider>
    </QueryClientProvider>
  )
}

describe('ProfileDropdown preferences', () => {
  it('offers appearance and language submenus when preferences are enabled', async () => {
    const user = userEvent.setup()
    renderDropdown(<ProfileDropdown showPreferences />)

    await user.click(screen.getByRole('button', { name: 'shell.menu.account' }))

    expect(
      await screen.findByRole('menuitem', { name: /shell\.menu\.appearance/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: /shell\.menu\.language/ })
    ).toBeInTheDocument()
  })

  it('keeps the menu free of preferences by default (public header has its own switches)', async () => {
    const user = userEvent.setup()
    renderDropdown(<ProfileDropdown />)

    await user.click(screen.getByRole('button', { name: 'shell.menu.account' }))

    expect(
      await screen.findByRole('menuitem', { name: 'nav.profile' })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('menuitem', { name: /shell\.menu\.appearance/ })
    ).not.toBeInTheDocument()
  })

  it('switches to the dark theme when Dark is chosen from the appearance submenu with the keyboard', async () => {
    const user = userEvent.setup()
    renderDropdown(<ProfileDropdown showPreferences />)

    await user.click(screen.getByRole('button', { name: 'shell.menu.account' }))
    const appearance = await screen.findByRole('menuitem', {
      name: /shell\.menu\.appearance/,
    })
    appearance.focus()
    await user.keyboard('{ArrowRight}')
    const dark = await screen.findByRole('menuitemradio', {
      name: 'shell.theme.dark',
    })
    dark.focus()
    await user.keyboard('{Enter}')

    expect(document.documentElement).toHaveClass('dark')
    expect(
      screen.getByRole('menuitemradio', { name: 'shell.theme.dark' })
    ).toHaveAttribute('aria-checked', 'true')
  })
})

describe('ProfileDropdown header', () => {
  it('shows only the name for a regular user, without the raw billing group', async () => {
    const user = userEvent.setup()
    renderDropdown(<ProfileDropdown />, { role: 1, group: 'default' })

    await user.click(screen.getByRole('button', { name: 'shell.menu.account' }))

    expect(await screen.findByText('alice')).toBeInTheDocument()
    expect(screen.queryByText('default')).toBeNull()
    expect(screen.queryByText('User')).toBeNull()
  })

  it('shows the role for an administrator', async () => {
    const user = userEvent.setup()
    renderDropdown(<ProfileDropdown />, { role: 10, group: 'vip' })

    await user.click(screen.getByRole('button', { name: 'shell.menu.account' }))

    expect(await screen.findByText('Admin')).toBeInTheDocument()
    expect(screen.queryByText('vip')).toBeNull()
  })
})
