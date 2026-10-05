/*
 * [user-ui] 公共页页脚测试（本仓库新增文件，非官方代码）。
 * 保护：AGPL 源码声明在每个公共页都在、没有上游品牌外链、条款链接跟随后台开关、
 * 管理员页脚 HTML 仍显示、PublicLayout 的页脚样式切换。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { USER_UI_SOURCE_URL } from '@/config/user-ui-meta'

import { Footer, PublicFooter } from '../footer'
import { PublicLayout } from '../public-layout'

const mocks = vi.hoisted(() => ({ footerHtml: '' }))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) => (
    <a href={to} {...rest} />
  ),
}))

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({
    systemName: 'SwarmRouter',
    logo: '/favicon.svg',
    footerHtml: mocks.footerHtml,
    loading: false,
    logoLoaded: true,
  }),
}))

vi.mock('../public-header', () => ({
  PublicHeader: () => <header data-testid='public-header' />,
}))

function renderWithStatus(
  node: ReactNode,
  status: Record<string, unknown> = {}
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], { system_name: 'SwarmRouter', ...status })
  return render(
    <QueryClientProvider client={client}>{node}</QueryClientProvider>
  )
}

function hrefs(): string[] {
  return [...document.querySelectorAll('a[href]')].map(
    (anchor) => anchor.getAttribute('href') ?? ''
  )
}

beforeEach(() => {
  mocks.footerHtml = ''
  localStorage.clear()
})

describe('Footer (home)', () => {
  it('links to the public source code and our own docs, never to upstream New API sites', () => {
    renderWithStatus(<Footer />)

    expect(screen.getByTestId('source-notice')).toBeInTheDocument()
    const links = hrefs()
    expect(links).toContain(USER_UI_SOURCE_URL)
    expect(links).toEqual(
      expect.arrayContaining(['/docs/quick-start', '/docs/faq'])
    )
    for (const href of links) {
      expect(href).not.toMatch(/newapi\.pro|QuantumNous\/new-api|one-api/i)
      expect(href).not.toMatch(/^\/(pricing|rankings|about)\b/)
    }
  })

  it('shows legal links only when the site enables them', () => {
    renderWithStatus(<Footer />, {
      user_agreement_enabled: true,
      privacy_policy_enabled: false,
    })

    expect(hrefs()).toContain('/user-agreement')
    expect(hrefs()).not.toContain('/privacy-policy')
  })

  it('keeps the admin footer HTML together with the source notice', () => {
    mocks.footerHtml = '<p>Operated by Example Ltd.</p>'
    renderWithStatus(<Footer />)

    expect(screen.getByText('Operated by Example Ltd.')).toBeInTheDocument()
    expect(screen.getByTestId('source-notice')).toBeInTheDocument()
  })
})

describe('PublicFooter (other public pages)', () => {
  it('carries the copyright line and the source notice', () => {
    renderWithStatus(<PublicFooter />, { privacy_policy_enabled: true })

    expect(screen.getByRole('contentinfo')).toHaveTextContent('SwarmRouter')
    expect(screen.getByTestId('source-notice')).toBeInTheDocument()
    expect(hrefs()).toContain('/privacy-policy')
  })
})

describe('PublicLayout footer variants', () => {
  it('renders the slim footer by default', () => {
    renderWithStatus(<PublicLayout>page</PublicLayout>)

    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(screen.getByTestId('source-notice')).toBeInTheDocument()
  })

  it('renders no footer when asked for none', () => {
    renderWithStatus(<PublicLayout footer='none'>page</PublicLayout>)

    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument()
  })
})
