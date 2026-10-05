/*
 * [user-ui] 首页行为测试（本仓库新增文件，非官方代码）。
 * 保护：本站 Base URL、按登录状态与注册开关切换的主操作、管理员自定义首页内容整页替换、
 * 不出现被禁用功能的链接、聊天预设列表、代码示例切换、减少动态效果。
 */
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/auth-store'

import { Home } from '..'
import { getHomePageContent } from '../api'

const mocks = vi.hoisted(() => ({
  status: {} as Record<string, unknown>,
  features: {
    pricing: false,
    rankings: false,
    about: false,
    wallet: true,
    referral: false,
  } as Record<string, boolean>,
  reducedMotion: false,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    hash,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    to: string
    params?: Record<string, string>
    hash?: string
  }) => {
    let href = to
    for (const [key, value] of Object.entries(params ?? {})) {
      href = href.replace(`$${key}`, value)
    }
    return <a href={hash ? `${href}#${hash}` : href} {...rest} />
  },
}))

vi.mock('@/components/layout', () => ({
  PublicLayout: (props: { children: ReactNode; footer?: string }) => (
    <div data-testid='public-layout' data-footer={props.footer ?? 'slim'}>
      {props.children}
    </div>
  ),
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({ status: mocks.status, loading: false, error: null }),
}))

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({
    systemName: 'SwarmRouter',
    logo: '/favicon.svg',
    footerHtml: '',
    loading: false,
    logoLoaded: true,
  }),
}))

vi.mock('@/hooks/use-media-query', () => ({
  useMediaQuery: (query: string) =>
    query.includes('prefers-reduced-motion') ? mocks.reducedMotion : false,
}))

vi.mock('@/context/theme-provider', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}))

vi.mock('@/config/user-ui-features', () => ({
  isUserUiFeatureEnabled: (feature: string) => mocks.features[feature],
}))

vi.mock('../api', () => ({
  getHomePageContent: vi.fn(),
}))

const BASE_STATUS = {
  system_name: 'SwarmRouter',
  server_address: 'https://api.example.com/',
  register_enabled: true,
  self_use_mode_enabled: false,
}

function signIn() {
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'alice',
    role: 1,
  } as never)
}

async function renderHome(content = '') {
  vi.mocked(getHomePageContent).mockResolvedValue({
    success: true,
    data: content,
  })
  render(<Home />)
  await waitFor(() =>
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  )
}

function hero(): HTMLElement {
  return screen.getByRole('region', { name: /home\.hero\.titleLead/ })
}

// Buttons rendered as router links stay <a href>, but Base UI gives them role="button",
// so links are located by their visible label.
function hrefOf(scope: HTMLElement, label: string): string | null {
  return (
    within(scope).getByText(label).closest('a')?.getAttribute('href') ?? null
  )
}

function allHrefs(): string[] {
  return [...document.querySelectorAll('a[href]')].map(
    (anchor) => anchor.getAttribute('href') ?? ''
  )
}

beforeEach(() => {
  mocks.status = { ...BASE_STATUS }
  mocks.features.wallet = true
  mocks.reducedMotion = false
  localStorage.clear()
})

afterEach(() => {
  useAuthStore.getState().auth.reset()
})

describe('home hero', () => {
  it('shows the site base URL with /v1 from the shared API endpoint helper', async () => {
    await renderHome()

    expect(screen.getByTestId('home-base-url')).toHaveTextContent(
      'https://api.example.com/v1'
    )
  })

  it('offers sign-up as the primary action when registration is open', async () => {
    await renderHome()

    expect(hrefOf(hero(), 'home.cta.signUp')).toBe('/sign-up')
    expect(hrefOf(hero(), 'home.cta.signIn')).toBe('/sign-in')
  })

  it('hides every sign-up link when the site closed registration', async () => {
    mocks.status = { ...BASE_STATUS, register_enabled: false }
    await renderHome()

    expect(allHrefs()).not.toContain('/sign-up')
    expect(hrefOf(hero(), 'home.cta.signIn')).toBe('/sign-in')
    expect(screen.getByText('home.steps.signUp.closed')).toBeInTheDocument()
  })

  it('sends signed-in users to the console and the API keys page', async () => {
    signIn()
    await renderHome()

    expect(hrefOf(hero(), 'home.cta.console')).toBe('/dashboard')
    expect(hrefOf(hero(), 'home.cta.createKey')).toBe('/keys')
    expect(screen.queryByText('home.cta.signUp')).toBeNull()
    expect(screen.getByText('home.steps.signUp.done')).toBeInTheDocument()
  })
})

describe('home page content', () => {
  it('renders the full branded footer for the built-in page', async () => {
    await renderHome()

    expect(screen.getByTestId('public-layout')).toHaveAttribute(
      'data-footer',
      'full'
    )
  })

  it('never links to disabled features (model square, rankings, about)', async () => {
    signIn()
    await renderHome()

    const hrefs = allHrefs()
    for (const href of hrefs) {
      expect(href).not.toMatch(/^\/(pricing|rankings|about)\b/)
    }
    expect(hrefs).toContain('/docs')
  })

  it('lets admin-configured home content replace the built-in page', async () => {
    await renderHome('# Welcome to our gateway')

    expect(screen.getByText('Welcome to our gateway')).toBeInTheDocument()
    expect(screen.queryByTestId('home-base-url')).not.toBeInTheDocument()
    expect(screen.getByTestId('public-layout')).toHaveAttribute(
      'data-footer',
      'slim'
    )
  })

  it('lists configured chat presets without repeating CC Switch', async () => {
    mocks.status = {
      ...BASE_STATUS,
      chats: [
        { 'Cherry Studio': 'cherrystudio://providers/api-keys?v=1' },
        { 'CC Switch': 'ccswitch' },
      ],
    }
    await renderHome()

    const presets = within(screen.getByTestId('home-chat-presets'))
    expect(presets.getByText('Cherry Studio')).toBeInTheDocument()
    expect(presets.queryByText('CC Switch')).not.toBeInTheDocument()
  })

  it('drops the chat apps card when no chat presets are configured', async () => {
    await renderHome()

    expect(screen.queryByTestId('home-chat-presets')).not.toBeInTheDocument()
    expect(screen.getByText('home.clients.other.title')).toBeInTheDocument()
  })

  it('asks the top-up question only while the wallet is enabled', async () => {
    mocks.features.wallet = false
    await renderHome()

    expect(screen.queryByText('home.faq.topUp.question')).toBeNull()
    expect(screen.getByText('home.faq.quota.question')).toBeInTheDocument()
  })
})

describe('home code samples', () => {
  it('switches to the Python sample that uses the site base URL', async () => {
    await renderHome()

    fireEvent.click(screen.getByRole('tab', { name: 'Python' }))

    expect(screen.getByRole('tab', { name: 'Python' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'base_url="https://api.example.com/v1"'
    )
  })
})

describe('home route diagram motion', () => {
  it('animates signal pulses by default', async () => {
    await renderHome()

    expect(screen.getAllByTestId('home-route-pulse')).toHaveLength(3)
  })

  it('renders a static diagram when the user prefers reduced motion', async () => {
    mocks.reducedMotion = true
    await renderHome()

    expect(screen.getByTestId('home-route-diagram')).toBeInTheDocument()
    expect(screen.queryAllByTestId('home-route-pulse')).toHaveLength(0)
  })
})
