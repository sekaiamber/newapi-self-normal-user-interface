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
import { isUserUiFeatureEnabled } from '@/config/user-ui-features'

const legacyOrigin = 'https://legacy-route.invalid'

// [user-ui] 用户 UI 没有管理端页面（渠道、模型、用户、兑换码、套餐管理、系统设置都已裁剪，见 UPSTREAM.md），
// 旧的管理端地址统一落到控制台首页，而不是 404；管理请到官方管理 UI。
const CONSOLE_HOME = '/dashboard'

// [user-ui] 钱包关闭时（功能开关），充值/订阅的旧地址同样回到控制台首页
function walletOrConsoleHome(): string {
  return isUserUiFeatureEnabled('wallet') ? '/wallet' : CONSOLE_HOME
}

const legacyConsoleRoutes: Record<string, string> = {
  '/console': '/dashboard',
  // [user-ui] 以下管理端目标在用户 UI 中不存在，改为控制台首页（原为 /models、/models/deployments、/channels、/redemption-codes、/users）
  '/console/models': CONSOLE_HOME,
  '/console/deployment': CONSOLE_HOME,
  '/console/channel': CONSOLE_HOME,
  '/console/token': '/keys',
  '/console/playground': '/playground',
  '/console/redemption': CONSOLE_HOME,
  '/console/user': CONSOLE_HOME,
  '/console/personal': '/profile',
  '/console/log': '/usage-logs',
  '/console/midjourney': '/usage-logs/drawing',
  '/console/task': '/usage-logs/task',
}

function normalizeLegacyPath(pathname: string): string {
  if (pathname === '/') return pathname
  return pathname.replace(/\/+$/, '')
}

function buildTargetHref(targetPath: string, source: URL): string {
  const target = new URL(targetPath, legacyOrigin)
  source.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value)
  })
  target.hash = source.hash
  return `${target.pathname}${target.search}${target.hash}`
}

export function resolveLegacyRoute(rawHref: string): string | null {
  let source: URL
  try {
    source = new URL(rawHref, legacyOrigin)
  } catch {
    return null
  }

  const pathname = normalizeLegacyPath(source.pathname)
  if (pathname === '/login') {
    return buildTargetHref('/sign-in', source)
  }
  if (pathname === '/forbidden') {
    return buildTargetHref('/403', source)
  }
  // [user-ui] 订阅购买与"我的订阅"在钱包页（套餐管理 /subscriptions 属于管理端，已裁剪；审计 4.1 #7）。
  // 官方文档仍让用户访问 /console/topup 与 /console/subscription
  // （guide/feature-guide/user/topup.md、guide/feature-guide/user/subscription.md）。
  if (pathname === '/console/topup' || pathname === '/console/subscription') {
    return buildTargetHref(walletOrConsoleHome(), source)
  }
  // [user-ui] 系统设置属于管理端，旧的 /console/setting?tab=... 一律回到控制台首页
  // （原按 tab 映射到 /system-settings/*，这些路由在用户 UI 中不存在）
  if (pathname === '/console/setting') {
    return buildTargetHref(CONSOLE_HOME, source)
  }
  if (pathname === '/console/chat') {
    return buildTargetHref('/dashboard', source)
  }
  if (pathname.startsWith('/console/chat/')) {
    const chatID = pathname.slice('/console/chat/'.length)
    return buildTargetHref(chatID ? `/chat/${chatID}` : '/dashboard', source)
  }

  const target = legacyConsoleRoutes[pathname]
  if (target) return buildTargetHref(target, source)
  if (pathname.startsWith('/console/')) {
    return buildTargetHref('/dashboard', source)
  }

  return null
}
