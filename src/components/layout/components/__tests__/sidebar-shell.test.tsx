/*
 * [user-ui] 侧栏外壳（分组标题、底部 AGPL 声明）的测试（本仓库新增文件，非官方代码）。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { Key, LayoutDashboard } from 'lucide-react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { SidebarProvider } from '@/components/ui/sidebar'
import { USER_UI_SOURCE_URL } from '@/config/user-ui-meta'

import { NavGroup } from '../nav-group'
import { SidebarSourceFooter } from '../sidebar-source-footer'

vi.mock('@tanstack/react-router', () => ({
  // 透传 data-* 等属性，SidebarMenuButton 通过 render 把 data-active 写到链接上
  Link: ({
    to,
    preload: _preload,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string
    preload?: unknown
  }) => <a href={to} {...rest} />,
  useLocation: (options?: {
    select?: (location: { href: string }) => unknown
  }) => {
    const location = { href: '/keys' }
    return options?.select ? options.select(location) : location
  },
}))

function renderInSidebar(node: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], { system_name: 'SwarmRouter' })
  return render(
    <QueryClientProvider client={client}>
      <SidebarProvider>{node}</SidebarProvider>
    </QueryClientProvider>
  )
}

describe('NavGroup heading', () => {
  it('renders no heading for an untitled group such as Overview', () => {
    renderInSidebar(
      <NavGroup
        id='home'
        title=''
        items={[
          {
            title: 'Overview',
            url: '/dashboard/overview',
            icon: LayoutDashboard,
          },
        ]}
      />
    )

    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument()
    expect(
      document.querySelector('[data-sidebar="group-label"]')
    ).not.toBeInTheDocument()
  })

  it('renders the heading for a titled group and marks the current page', () => {
    renderInSidebar(
      <NavGroup
        id='get-started'
        title='Get Started'
        items={[{ title: 'API Keys', url: '/keys', icon: Key }]}
      />
    )

    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'API Keys' })).toHaveAttribute(
      'data-active'
    )
  })
})

describe('SidebarSourceFooter', () => {
  it('links to the public source repository and license (AGPLv3 section 13)', () => {
    renderInSidebar(<SidebarSourceFooter />)

    const sourceLinks = screen
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))
    expect(sourceLinks).toContain(USER_UI_SOURCE_URL)
    expect(screen.getByTestId('source-notice')).toBeInTheDocument()
  })
})
