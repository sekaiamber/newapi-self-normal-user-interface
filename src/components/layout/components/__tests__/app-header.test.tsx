/*
 * [user-ui] 控制台顶栏的测试（本仓库新增文件，非官方代码）。
 * 顶栏按信息架构精简为：文档 · 通知 · 头像（审计 1.2 #5/#6、1.3）。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SidebarProvider } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth-store'

import { AppHeader } from '../app-header'

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { children: ReactNode; to: string; className?: string }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    popoverOpen: false,
    setPopoverOpen: () => undefined,
    unreadCount: 0,
    activeTab: 'notice',
    setActiveTab: () => undefined,
    notice: '',
    announcements: [],
    loading: false,
  }),
}))

afterEach(() => {
  useAuthStore.getState().auth.reset()
})

function renderHeader(headerNavModules?: object) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], {
    system_name: 'SwarmRouter',
    SidebarModulesAdmin: '',
    HeaderNavModules: headerNavModules ? JSON.stringify(headerNavModules) : '',
  })
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'alice',
    role: 1,
    permissions: { sidebar_settings: true },
    sidebar_modules: '',
  })
  return render(
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <AppHeader />
      </SidebarProvider>
    </QueryClientProvider>
  )
}

describe('AppHeader', () => {
  it('shows only Docs, notifications and the account menu on the right', () => {
    renderHeader()

    expect(
      screen.getByRole('link', { name: 'shell.header.docs' })
    ).toHaveAttribute('href', '/docs')
    expect(
      screen.getByRole('button', { name: 'Notifications' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'shell.menu.account' })
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Search' })).toBeNull()
    expect(screen.queryByText('Change language')).toBeNull()
    expect(
      screen.queryByRole('button', { name: 'Open theme settings' })
    ).toBeNull()
  })

  it('drops the former Home and Console top-nav links', () => {
    renderHeader()

    const hrefs = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(hrefs).not.toContain('/dashboard')
    // the brand logo is the only way back to the public home page
    expect(hrefs.filter((href) => href === '/')).toHaveLength(1)
  })

  it('hides the Docs link when the backend turns the docs module off', () => {
    renderHeader({ home: true, console: true, docs: false })

    expect(screen.queryByRole('link', { name: 'shell.header.docs' })).toBeNull()
  })
})
