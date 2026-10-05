/*
 * [user-ui] 控制台侧栏底部的源码与许可声明（本仓库新增文件，非官方代码）。
 *
 * AGPLv3 第 13 条要求向通过网络使用的用户提供源码，第 5(d) 条要求交互界面显示适当的法律声明
 * （审计 3.6 挂载点 4）。侧栏在桌面与移动端（抽屉）是同一棵树，挂在这里即可覆盖整个控制台。
 * 展开时显示 SourceNotice compact（源代码 · GNU AGPLv3）；折叠成图标栏时只保留一个源码图标链接。
 */
import { Code } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SourceNotice } from '@/components/legal/source-notice'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { USER_UI_LICENSE_NAME, USER_UI_SOURCE_URL } from '@/config/user-ui-meta'

export function SidebarSourceFooter() {
  const { t } = useTranslation()
  const label = `${t('legal.sourceCode')} · ${USER_UI_LICENSE_NAME}`

  return (
    <SidebarFooter className='border-sidebar-border border-t px-4 py-3 group-data-[collapsible=icon]:px-2'>
      <SourceNotice
        variant='compact'
        className='group-data-[collapsible=icon]:hidden'
      />
      <SidebarMenu
        className='hidden group-data-[collapsible=icon]:flex'
        data-testid='sidebar-source-icon'
      >
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip={label}
            aria-label={label}
            render={
              <a
                href={USER_UI_SOURCE_URL}
                target='_blank'
                rel='noopener noreferrer'
              />
            }
          >
            <Code aria-hidden='true' />
            <span>{label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
