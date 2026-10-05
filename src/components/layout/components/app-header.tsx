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
import { Link } from '@tanstack/react-router'
import { BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ConfigDrawer } from '@/components/config-drawer'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/use-notifications'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'

import { defaultTopNavLinks } from '../config/top-nav.config'
import type { TopNavLink } from '../types'
import { Header } from './header'
import { SystemBrand } from './system-brand'

/**
 * General application Header component
 * Integrates navigation bar, search, configuration and profile functions
 *
 * [user-ui] 控制台顶栏按信息架构精简为：文档 · 通知 · 头像（审计 1.2 #6、1.3）。
 * - 顶部导航只保留"文档"（/docs），所有宽度都显示（原导航在 1024px 以下整体隐藏，窄屏没有文档入口，审计 1.2 #5）；
 *   "首页"由左上角品牌标识承担，"控制台"即当前所在位置，不再重复。
 * - 搜索框（⌘K 命令面板的按钮）与主题设置抽屉默认不显示；⌘K 快捷键仍可用（见 command-menu.tsx）。
 * - 明暗与语言收进头像菜单（ProfileDropdown showPreferences）。
 * 原有 props 保留，便于官方升级时对照。
 *
 * @example
 * // Basic usage
 * <AppHeader />
 */
type AppHeaderProps = {
  /**
   * Custom navigation links, uses default global navigation or dynamically generated from backend if not provided
   */
  navLinks?: TopNavLink[]
  /**
   * Whether to show top navigation bar
   * [user-ui] 现在只渲染"文档"一项
   * @default true
   */
  showTopNav?: boolean
  /**
   * Left content, overrides TopNav if provided
   */
  leftContent?: React.ReactNode
  /**
   * Whether to show search box
   * [user-ui] 默认改为 false
   * @default false
   */
  showSearch?: boolean
  /**
   * Custom right content, overrides default right content if provided
   */
  rightContent?: React.ReactNode
  /**
   * Whether to show notification button
   * @default true
   */
  showNotifications?: boolean
  /**
   * Whether to show config drawer
   * [user-ui] 默认改为 false（外观已收进头像菜单）
   * @default false
   */
  showConfigDrawer?: boolean
  /**
   * Whether to show profile dropdown
   * @default true
   */
  showProfileDropdown?: boolean
}

export function AppHeader({
  navLinks = defaultTopNavLinks,
  showTopNav = true,
  leftContent,
  showSearch = false,
  rightContent,
  showNotifications = true,
  showConfigDrawer = false,
  showProfileDropdown = true,
}: AppHeaderProps) {
  const { t } = useTranslation()
  // Prioritize dynamically generated links from backend
  const dynamicLinks = useTopNavLinks()
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks
  // [user-ui] 只取"文档"：仍服从后端 HeaderNavModules 的 docs 开关（useTopNavLinks 已处理），固定指向站内 /docs
  const docsLink = links.find((link) => link.href === '/docs')

  // Notifications hook
  const notifications = useNotifications()

  return (
    <Header>
      <div className='@container/system-brand flex min-w-0 flex-1 items-center gap-1'>
        <SystemBrand variant='inline' />
        {/* [user-ui] 版本更新按钮（管理员功能）已移除 */}
      </div>

      {leftContent ? (
        <div className='ms-2 flex items-center'>{leftContent}</div>
      ) : null}

      {rightContent ?? (
        <div className='ms-auto flex shrink-0 items-center gap-1 sm:gap-2'>
          {showTopNav && docsLink && (
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground hover:text-foreground gap-1.5 px-2'
              render={<Link to='/docs' />}
            >
              <BookOpen className='hidden size-4 sm:block' aria-hidden='true' />
              {t('shell.header.docs')}
            </Button>
          )}
          {showSearch && (
            <Search className='w-8 flex-none [&>span]:hidden sm:[&>span]:inline' />
          )}
          {showNotifications && (
            <NotificationPopover
              open={notifications.popoverOpen}
              onOpenChange={notifications.setPopoverOpen}
              unreadCount={notifications.unreadCount}
              activeTab={notifications.activeTab}
              onTabChange={notifications.setActiveTab}
              notice={notifications.notice}
              announcements={notifications.announcements}
              loading={notifications.loading}
            />
          )}
          {/* [user-ui] 语言切换按钮移入头像菜单 */}
          {showConfigDrawer && <ConfigDrawer />}
          {showProfileDropdown && <ProfileDropdown showPreferences />}
        </div>
      )}
    </Header>
  )
}
