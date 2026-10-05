/*
 * [user-ui] 用户 UI 功能开关的行为测试（本仓库新增文件，非官方代码）。
 * 使用真实的 USER_UI_FEATURES（不 mock），保护"禁用 = 所有入口隐藏、守卫视为关闭"的契约。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { USER_UI_FEATURES } from '@/config/user-ui-features'
import { useSidebarConfig } from '@/hooks/use-sidebar-config'
import { useSidebarData } from '@/hooks/use-sidebar-data'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import {
  getModuleAccessFromStatus,
  parseHeaderNavModulesFromStatus,
} from '@/lib/nav-modules'
import { useAuthStore } from '@/stores/auth-store'

// 后端把所有模块都打开、并配置了外部文档链接，用来证明本地开关优先
const STATUS_ALL_ENABLED = {
  HeaderNavModules: JSON.stringify({
    home: true,
    console: true,
    pricing: { enabled: true, requireAuth: false },
    rankings: { enabled: true, requireAuth: false },
    docs: true,
    about: true,
  }),
  SidebarModulesAdmin: '',
  docs_link: 'https://docs.example.com',
}

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  useAuthStore.getState().auth.reset()
})

function wrapperWithStatus(status: Record<string, unknown>) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], status)
  return function Wrapper(props: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {props.children}
      </QueryClientProvider>
    )
  }
}

describe('default feature switches', () => {
  it('disables pricing, rankings, about and referral but keeps wallet', () => {
    expect(USER_UI_FEATURES).toEqual({
      pricing: false,
      rankings: false,
      about: false,
      wallet: true,
      referral: false,
    })
  })
})

describe('header navigation modules', () => {
  it('treats disabled modules as off even when the backend enables them', () => {
    const modules = parseHeaderNavModulesFromStatus(STATUS_ALL_ENABLED)

    expect(modules.pricing.enabled).toBe(false)
    expect(modules.rankings.enabled).toBe(false)
    expect(modules.about).toBe(false)
    expect(modules.home).toBe(true)
    expect(modules.docs).toBe(true)
  })

  it('reports disabled modules as not accessible to route guards', () => {
    expect(
      getModuleAccessFromStatus(STATUS_ALL_ENABLED, 'pricing').enabled
    ).toBe(false)
    expect(
      getModuleAccessFromStatus(STATUS_ALL_ENABLED, 'rankings').enabled
    ).toBe(false)
  })
})

describe('top navigation links', () => {
  it('hides disabled entries and points Docs to the private /docs page', () => {
    const { result } = renderHook(() => useTopNavLinks(), {
      wrapper: wrapperWithStatus(STATUS_ALL_ENABLED),
    })
    const hrefs = result.current.map((link) => link.href)

    expect(hrefs).toEqual(['/', '/dashboard', '/docs'])
    expect(result.current.some((link) => link.external)).toBe(false)
  })
})

describe('console sidebar', () => {
  it('hides the chat presets entry and keeps Wallet and the rest', () => {
    useAuthStore.getState().auth.setUser({
      id: 1,
      username: 'alice',
      role: 1,
      permissions: { sidebar_settings: true },
      sidebar_modules: '',
    })
    const { result } = renderHook(
      () => useSidebarConfig(useSidebarData().navGroups),
      { wrapper: wrapperWithStatus(STATUS_ALL_ENABLED) }
    )
    const items = result.current.flatMap((group) => group.items)

    expect(items.some((item) => item.url === '/wallet')).toBe(true)
    expect(items.some((item) => item.type === 'chat-presets')).toBe(false)
    expect(items.some((item) => item.url === '/playground')).toBe(true)
    expect(items.some((item) => item.url === '/keys')).toBe(true)
    expect(items.some((item) => item.url === '/profile')).toBe(true)
  })
})
