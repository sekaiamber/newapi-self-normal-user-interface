/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { checkIsActive } from '@/components/layout/lib/url-utils'
import type { NavGroup, NavItem } from '@/components/layout/types'
import { useAuthStore } from '@/stores/auth-store'

import { useSidebarConfig } from '../use-sidebar-config'
import { useSidebarData } from '../use-sidebar-data'

// [user-ui] 本文件验证官方逻辑，因此打开全部本地功能开关；
// 开关本身的行为见 src/config/__tests__/user-ui-features.test.ts
vi.mock('@/config/user-ui-features', () => ({
  USER_UI_FEATURES: {
    pricing: true,
    rankings: true,
    about: true,
    wallet: true,
    referral: true,
  },
  isUserUiFeatureEnabled: () => true,
}))

// [user-ui] 侧边栏按已确认的信息架构重排（概览 / 开始使用 / 用量 / 账户），名称改为 nav.* key，
// 因此断言改用 URL 与分组 id，不再依赖官方的分组（chat / general / personal）与英文标题；
// 后端 SidebarModulesAdmin × 用户 sidebar_modules 的过滤规则与官方用例保持一致。

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

function sidebarFor(admin?: object, user?: object, canConfigure = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], {
    SidebarModulesAdmin: admin ? JSON.stringify(admin) : '',
  })
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'alice',
    role: 1,
    permissions: { sidebar_settings: canConfigure },
    sidebar_modules: user ? JSON.stringify(user) : '',
  })
  function Wrapper(props: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {props.children}
      </QueryClientProvider>
    )
  }
  const result = renderHook(
    () => useSidebarConfig(useSidebarData().navGroups),
    { wrapper: Wrapper }
  )
  return result
}

function urlsOf(items: NavItem[] | undefined): unknown[] {
  return (items ?? []).map((item) => item.url)
}

function groupUrls(groups: NavGroup[], id: string): unknown[] {
  return urlsOf(groups.find((group) => group.id === id)?.items)
}

function allUrls(groups: NavGroup[]): unknown[] {
  return urlsOf(groups.flatMap((group) => group.items))
}

describe('console information architecture', () => {
  it('default configuration groups entries as Overview / Get Started / Usage / Account without changing routes', () => {
    const { result } = sidebarFor()

    expect(result.current.map((group) => group.id)).toEqual([
      'home',
      'get-started',
      'usage',
      'account',
    ])
    expect(groupUrls(result.current, 'home')).toEqual(['/dashboard/overview'])
    expect(groupUrls(result.current, 'get-started')).toEqual([
      '/keys',
      '/playground',
      '/docs',
    ])
    expect(groupUrls(result.current, 'usage')).toEqual([
      '/dashboard/models',
      '/usage-logs/common',
      '/usage-logs/task',
    ])
    expect(groupUrls(result.current, 'account')).toEqual([
      '/wallet',
      '/profile',
      '/security',
      '/usage-logs/audit',
    ])
  })

  it('overview group has no heading while the other groups have one', () => {
    const { result } = sidebarFor()

    expect(result.current.find((group) => group.id === 'home')?.title).toBe('')
    for (const id of ['get-started', 'usage', 'account']) {
      expect(result.current.find((group) => group.id === id)?.title).not.toBe(
        ''
      )
    }
  })

  it('backend disabling every module still keeps the Integration Docs entry', () => {
    const { result } = sidebarFor({
      chat: { enabled: false },
      console: { enabled: false },
      personal: { enabled: false },
    })

    expect(result.current.map((group) => group.id)).toEqual(['get-started'])
    expect(allUrls(result.current)).toEqual(['/docs'])
  })

  it('usage stats stays selected on the flow tab and task logs on the drawing tab', () => {
    const { result } = sidebarFor()
    const items = result.current.flatMap((group) => group.items)

    expect(
      items
        .filter((item) => checkIsActive('/dashboard/flow', item))
        .map((item) => item.url)
    ).toEqual(['/dashboard/models'])
    expect(
      items
        .filter((item) => checkIsActive('/usage-logs/drawing', item))
        .map((item) => item.url)
    ).toEqual(['/usage-logs/task'])
  })

  it.each([
    [{ console: { enabled: true, midjourney: false } }, true],
    [{ console: { enabled: true, task: false } }, true],
    [{ console: { enabled: true, midjourney: false, task: false } }, false],
  ])(
    'task logs entry visibility follows drawing or task modules (%j)',
    (admin, visible) => {
      const { result } = sidebarFor(admin)

      expect(allUrls(result.current).includes('/usage-logs/task')).toBe(visible)
    }
  )
})

describe('security sidebar visibility', () => {
  it('old configurations show Security right after Profile and keep API Keys', () => {
    const { result } = sidebarFor(
      { personal: { enabled: true, personal: true, topup: true } },
      { personal: { enabled: true, personal: true } }
    )
    expect(groupUrls(result.current, 'account')).toEqual([
      '/wallet',
      '/profile',
      '/security',
      '/usage-logs/audit',
    ])
    expect(allUrls(result.current)).toContain('/keys')
  })
  it.each([
    [{ personal: { enabled: true, security: false } }, undefined],
    [{ personal: { enabled: false } }, { personal: { security: true } }],
    [undefined, { personal: { enabled: true, security: false } }],
    [undefined, { personal: { enabled: false } }],
  ])('admin or user disablement hides Security (%j, %j)', (admin, user) => {
    const { result } = sidebarFor(admin, user)
    expect(allUrls(result.current)).not.toContain('/security')
  })
  it('users without sidebar configuration permission retain the admin view', () => {
    const { result } = sidebarFor(
      undefined,
      { personal: { security: false } },
      false
    )
    expect(allUrls(result.current)).toContain('/security')
  })
})

describe('account activity sidebar entry', () => {
  it('legacy configurations show Account Activity at the end of the Account group as the only active item on its route', () => {
    const { result } = sidebarFor(
      { console: { enabled: true, log: true } },
      { console: { enabled: true, log: true } }
    )
    const accountUrls = groupUrls(result.current, 'account')
    expect(accountUrls.at(-1)).toBe('/usage-logs/audit')
    const selected = result.current
      .flatMap((group) => group.items)
      .filter((item) => checkIsActive('/usage-logs/audit', item))
    expect(selected.map((item) => item.url)).toEqual(['/usage-logs/audit'])
  })

  it.each([
    [{ console: { enabled: true, audit: false } }, undefined],
    [{ console: { enabled: false } }, { console: { audit: true } }],
    [undefined, { console: { enabled: true, audit: false } }],
    [undefined, { console: { enabled: false } }],
  ])(
    'admin and personal visibility rules can hide Account Activity (%j, %j)',
    (admin, user) => {
      const { result } = sidebarFor(admin, user)
      expect(allUrls(result.current)).not.toContain('/usage-logs/audit')
    }
  )

  it('hiding Request Logs does not hide the independently configured Account Activity entry', () => {
    const { result } = sidebarFor({ console: { enabled: true, log: false } })
    const urls = allUrls(result.current)
    expect(urls).not.toContain('/usage-logs/common')
    expect(urls).toContain('/usage-logs/audit')
  })
})
