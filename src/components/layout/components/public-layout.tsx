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
import type { TopNavLink } from '../types'
// [user-ui] 公共页统一带页脚：AGPLv3 第 13 条要求网络用户能拿到源码（审计 3.6 #2），
// 文档、协议、自定义首页等公共页默认显示精简页脚；默认首页用完整页脚。
import { Footer, PublicFooter } from './footer'
import { PublicHeader, type PublicHeaderProps } from './public-header'

/** full：品牌页脚（首页）；slim：一行版权与源码声明；none：不显示 */
export type PublicFooterVariant = 'full' | 'slim' | 'none'

type PublicLayoutProps = {
  children: React.ReactNode
  showMainContainer?: boolean
  navContent?: React.ReactNode
  headerProps?: Omit<PublicHeaderProps, 'navContent'>
  navLinks?: TopNavLink[]
  showThemeSwitch?: boolean
  showAuthButtons?: boolean
  showNotifications?: boolean
  logo?: React.ReactNode
  siteName?: string
  /** [user-ui] 页脚样式，默认 slim */
  footer?: PublicFooterVariant
}

export function PublicLayout(props: PublicLayoutProps) {
  const footer = props.footer ?? 'slim'
  return (
    // [user-ui] 纵向 flex，内容不足一屏时页脚贴底
    <div className='bg-background text-foreground relative flex min-h-svh flex-col overflow-x-clip'>
      <PublicHeader
        navContent={props.navContent}
        navLinks={props.navLinks}
        showThemeSwitch={props.showThemeSwitch}
        showAuthButtons={props.showAuthButtons}
        showNotifications={props.showNotifications}
        logo={props.logo}
        siteName={props.siteName}
        {...props.headerProps}
      />

      {props.showMainContainer !== false ? (
        <main className='container flex-1 px-4 py-6 pt-20 md:px-4'>
          {props.children}
        </main>
      ) : (
        <div className='flex-1'>{props.children}</div>
      )}

      {footer === 'full' && <Footer />}
      {footer === 'slim' && <PublicFooter />}
    </div>
  )
}
