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
import { afterEach, describe, expect, test } from 'vitest'

import { USER_UI_FEATURES } from '@/config/user-ui-features'

import { resolveLegacyRoute } from './legacy-route'

// [user-ui] 用户 UI 已裁剪管理端页面：管理端旧地址改为回到控制台首页，订阅旧地址指向钱包；
// 并保证没有任何旧地址落到被裁剪或被功能开关关闭的路由上（审计 4.1 #7）。
const REMOVED_OR_DISABLED_PREFIXES = [
  '/models',
  '/channels',
  '/users',
  '/redemption-codes',
  '/subscriptions',
  '/system-settings',
  '/system-info',
  '/task-plugins',
  '/setup',
  '/pricing',
  '/rankings',
  '/about',
]

const mutableFeatures = USER_UI_FEATURES as { wallet: boolean }
const walletDefault = mutableFeatures.wallet

afterEach(() => {
  mutableFeatures.wallet = walletDefault
})

describe('legacy frontend route migration', () => {
  test('maps former public and console routes to their current destinations', () => {
    const routes = {
      '/login': '/sign-in',
      '/forbidden': '/403',
      '/console': '/dashboard',
      '/console/subscription': '/wallet',
      '/console/topup': '/wallet',
      '/console/token': '/keys',
      '/console/playground': '/playground',
      '/console/personal': '/profile',
      '/console/log': '/usage-logs',
      '/console/midjourney': '/usage-logs/drawing',
      '/console/task': '/usage-logs/task',
      '/console/chat/42': '/chat/42',
    }

    for (const [source, target] of Object.entries(routes)) {
      expect(resolveLegacyRoute(source)).toBe(target)
    }
  })

  test('sends former admin pages to the console home instead of removed routes', () => {
    for (const source of [
      '/console/models',
      '/console/deployment',
      '/console/channel',
      '/console/redemption',
      '/console/user',
      '/console/setting',
    ]) {
      expect(resolveLegacyRoute(source)).toBe('/dashboard')
    }
  })

  test('never redirects a legacy address to a removed or disabled route', () => {
    const sources = [
      '/console',
      '/console/models',
      '/console/deployment',
      '/console/subscription',
      '/console/topup',
      '/console/channel',
      '/console/token',
      '/console/playground',
      '/console/redemption',
      '/console/user',
      '/console/personal',
      '/console/log',
      '/console/midjourney',
      '/console/task',
      '/console/chat',
      '/console/chat/42',
      '/console/removed',
      ...[
        'operation',
        'dashboard',
        'chats',
        'drawing',
        'payment',
        'ratio',
        'ratelimit',
        'models',
        'model-deployment',
        'performance',
        'system',
        'other',
        'unknown',
      ].map((tab) => `/console/setting?tab=${tab}`),
    ]

    for (const source of sources) {
      const target = resolveLegacyRoute(source) ?? ''
      const pathname = target.split(/[?#]/)[0]
      const hit = REMOVED_OR_DISABLED_PREFIXES.find(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      )
      expect(hit, `${source} -> ${target}`).toBeUndefined()
    }
  })

  test('sends top-up and subscription addresses to the console home when the wallet is disabled', () => {
    mutableFeatures.wallet = false

    expect(resolveLegacyRoute('/console/topup')).toBe('/dashboard')
    expect(resolveLegacyRoute('/console/subscription')).toBe('/dashboard')
  })

  test('preserves search and hash while applying route-specific behavior', () => {
    expect(resolveLegacyRoute('/login?redirect=%2Fkeys#continue')).toBe(
      '/sign-in?redirect=%2Fkeys#continue'
    )
    expect(resolveLegacyRoute('/console/topup?source=email#orders')).toBe(
      '/wallet?source=email#orders'
    )
    expect(
      resolveLegacyRoute('/console/setting?tab=payment&from=bookmark#form')
    ).toBe('/dashboard?tab=payment&from=bookmark#form')
  })

  test('safely redirects unknown console locations without touching new routes', () => {
    expect(resolveLegacyRoute('/console/removed?page=2#old')).toBe(
      '/dashboard?page=2#old'
    )
    expect(resolveLegacyRoute('/dashboard')).toBe(null)
    expect(resolveLegacyRoute('/api/status')).toBe(null)
  })
})
