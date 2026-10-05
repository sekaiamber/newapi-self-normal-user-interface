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
import {
  BookOpen,
  ChartColumn,
  FileText,
  FlaskConical,
  History,
  Key,
  LayoutDashboard,
  ListTodo,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { SidebarData } from '@/components/layout/types'

/**
 * Root navigation groups for the application sidebar.
 *
 * These are shown when the URL does not match any nested sidebar view
 * registered in `layout/lib/sidebar-view-registry.ts`.
 *
 * [user-ui] 按已确认的信息架构重排（部署仓库 docs/notes/ui-redesign-ledger.md「控制台信息架构」）：
 * 概览 / 开始使用 / 用量 / 账户。只改分组、名称、顺序，路由不变、页面不合并，
 * 因此 use-sidebar-config.ts 按 URL 的后端 SidebarModulesAdmin / 用户 sidebar_modules 过滤照常生效。
 * 名称一律用 shell 覆盖层的 nav.* 新 key，不改官方共用 key。
 * 原分组：聊天（游乐场）/ 常规（概览、数据看板、API 密钥、使用日志、审计日志、任务日志）/ 个人（钱包、个人资料、安全与访问）。
 */
export function useSidebarData(): SidebarData {
  const { t } = useTranslation()

  return {
    navGroups: [
      {
        // [user-ui] 概览单独一组、不显示分组标题（title 为空时 NavGroup 不渲染标题）
        id: 'home',
        title: '',
        items: [
          {
            title: t('nav.overview'),
            url: '/dashboard/overview',
            icon: LayoutDashboard,
          },
        ],
      },
      {
        id: 'get-started',
        title: t('nav.group.getStarted'),
        items: [
          {
            title: t('nav.apiKeys'),
            url: '/keys',
            icon: Key,
          },
          {
            title: t('nav.playground'),
            url: '/playground',
            icon: FlaskConical,
          },
          // [user-ui] "聊天"（chat-presets）菜单项已删除；令牌页的一键接入仍使用 chat 代码
          {
            // [user-ui] 新增：站内接入文档（公共页面，不对应后端侧边栏模块，始终显示；窄屏抽屉里也能到）
            title: t('nav.docs'),
            url: '/docs',
            icon: BookOpen,
          },
        ],
      },
      {
        id: 'usage',
        title: t('nav.group.usage'),
        items: [
          {
            // [user-ui] 原"数据看板"；页内"分流"Tab（/dashboard/flow）同样高亮本项
            title: t('nav.usageStats'),
            url: '/dashboard/models',
            activeUrls: ['/dashboard/flow'],
            icon: ChartColumn,
          },
          {
            title: t('nav.usageLogs'),
            url: '/usage-logs/common',
            icon: FileText,
          },
          {
            title: t('nav.taskLogs'),
            url: '/usage-logs/task',
            activeUrls: ['/usage-logs/drawing'],
            configUrls: ['/usage-logs/drawing', '/usage-logs/task'],
            icon: ListTodo,
          },
        ],
      },
      {
        id: 'account',
        title: t('nav.group.account'),
        items: [
          {
            title: t('nav.wallet'),
            url: '/wallet',
            icon: Wallet,
          },
          {
            title: t('nav.profile'),
            url: '/profile',
            icon: User,
          },
          {
            title: t('nav.security'),
            url: '/security',
            icon: ShieldCheck,
          },
          {
            // [user-ui] 原"审计日志"，记录登录与安全事件，从"常规"移到"账户"
            title: t('nav.accountActivity'),
            url: '/usage-logs/audit',
            icon: History,
          },
        ],
      },
      // [user-ui] 管理分组（Channels/Models/Users/...）已移除，管理在官方 UI 完成
    ],
  }
}
