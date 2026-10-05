/*
 * [user-ui] 公共顶栏测试（本仓库新增文件，非官方代码）。
 * 保护：只显示已开启的入口（功能开关优先于后端）、当前页标记、登录状态、移动端菜单的开关与键盘关闭。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import type { AnchorHTMLAttributes } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/auth-store'

import { PublicHeader } from '../public-header'

const mocks = vi.hoisted(() => ({
  pathname: '/',
  systemName: 'SwarmRouter',
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    disabled: _disabled,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string
    disabled?: boolean
  }) => <a href={to} {...rest} />,
  useNavigate: () => vi.fn(),
  useRouterState: () => ({ location: { pathname: mocks.pathname } }),
}))

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({
    systemName: mocks.systemName,
    logo: '/favicon.svg',
    footerHtml: '',
    loading: false,
    logoLoaded: true,
  }),
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

vi.mock('@/components/notification-popover', () => ({
  NotificationPopover: () => <button type='button'>notifications</button>,
}))
vi.mock('@/components/profile-dropdown', () => ({
  ProfileDropdown: () => <div data-testid='profile-dropdown' />,
}))
vi.mock('@/components/theme-switch', () => ({
  ThemeSwitch: () => <button type='button'>theme</button>,
}))
vi.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <button type='button'>language</button>,
}))

// 后端把所有模块都打开，用来证明本地功能开关优先
const STATUS_ALL_ENABLED = {
  system_name: 'SwarmRouter',
  HeaderNavModules: JSON.stringify({
    home: true,
    console: true,
    pricing: { enabled: true, requireAuth: false },
    rankings: { enabled: true, requireAuth: false },
    docs: true,
    about: true,
  }),
}

function renderHeader(): void {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], STATUS_ALL_ENABLED)
  render(
    <QueryClientProvider client={client}>
      <PublicHeader />
    </QueryClientProvider>
  )
}

function desktopNav(): HTMLElement {
  return screen.getAllByRole('navigation', { name: 'home.nav.main' })[0]
}

function hrefs(scope: HTMLElement): string[] {
  return [...scope.querySelectorAll('a[href]')].map(
    (anchor) => anchor.getAttribute('href') ?? ''
  )
}

beforeEach(() => {
  mocks.pathname = '/'
  mocks.systemName = 'SwarmRouter'
  localStorage.clear()
})

afterEach(() => {
  useAuthStore.getState().auth.reset()
})

describe('PublicHeader navigation', () => {
  it('shows only Home, Console and Docs even when the backend enables more', () => {
    renderHeader()

    const nav = within(desktopNav())
    expect(nav.getByText('home.nav.home').closest('a')).toHaveAttribute(
      'href',
      '/'
    )
    expect(nav.getByText('home.nav.console').closest('a')).toHaveAttribute(
      'href',
      '/dashboard'
    )
    expect(nav.getByText('home.nav.docs').closest('a')).toHaveAttribute(
      'href',
      '/docs'
    )
    for (const href of hrefs(desktopNav())) {
      expect(href).not.toMatch(/^\/(pricing|rankings|about)\b/)
    }
  })

  it('marks Docs as the current page on a docs sub-page', () => {
    mocks.pathname = '/docs/quick-start'
    renderHeader()

    const nav = within(desktopNav())
    expect(nav.getByText('home.nav.docs').closest('a')).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(nav.getByText('home.nav.home').closest('a')).not.toHaveAttribute(
      'aria-current'
    )
  })
})

describe('PublicHeader account area', () => {
  it('offers a sign-in link to signed-out visitors', () => {
    renderHeader()

    expect(hrefs(desktopNav())).toContain('/sign-in')
    expect(screen.queryByTestId('profile-dropdown')).not.toBeInTheDocument()
  })

  it('shows the profile menu instead of sign-in once signed in', () => {
    useAuthStore.getState().auth.setUser({
      id: 1,
      username: 'alice',
      role: 1,
    } as never)
    renderHeader()

    expect(screen.getAllByTestId('profile-dropdown').length).toBeGreaterThan(0)
    expect(hrefs(desktopNav())).not.toContain('/sign-in')
  })

  it('shows a custom site name as text instead of the brand lockup', () => {
    mocks.systemName = 'Acme AI'
    renderHeader()

    expect(screen.getByTitle('Acme AI')).toHaveTextContent('Acme AI')
  })
})

describe('PublicHeader mobile menu', () => {
  it('opens with the toggle and closes with Escape', () => {
    renderHeader()
    const toggle = screen.getByRole('button', { name: 'home.nav.openMenu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.querySelector('#public-mobile-menu')).toBeNull()

    fireEvent.click(toggle)

    const menu = document.querySelector('#public-mobile-menu')
    expect(menu).not.toBeNull()
    expect(
      screen.getByRole('button', { name: 'home.nav.closeMenu' })
    ).toHaveAttribute('aria-expanded', 'true')
    expect(hrefs(menu as HTMLElement)).toEqual(
      expect.arrayContaining(['/', '/dashboard', '/docs', '/sign-in'])
    )

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(document.querySelector('#public-mobile-menu')).toBeNull()
  })
})
