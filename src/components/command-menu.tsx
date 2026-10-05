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
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronRight, Laptop, Moon, Sun } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import { useSidebarView } from '@/hooks/use-sidebar-view'

import { ScrollArea } from './ui/scroll-area'

/**
 * Command palette (⌘K / Ctrl+K).
 *
 * [user-ui] 导航条目改为与侧边栏完全相同的数据：useSidebarView() 已经过
 * 角色过滤 + 后端 SidebarModulesAdmin × 用户 sidebar_modules 过滤 + 本地功能开关，
 * 原来直接用 useSidebarData() 的未过滤数据，会列出被禁用的入口（审计 4.1 #1）。
 * 保留命令面板的理由：顶栏不再显示搜索按钮，但 ⌘K 是零视觉成本的键盘导航
 * （11 个入口 + 外观切换），过滤后不会再出现 404 入口。
 */
export function CommandMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()
  const { navGroups } = useSidebarView()

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder={t('Type a command or search...')} />
        <CommandList>
          <ScrollArea className='h-72 pe-1'>
            <CommandEmpty>{t('No results found.')}</CommandEmpty>
            {navGroups.map((group) => (
              <CommandGroup
                key={group.id || group.title}
                // [user-ui] 无标题分组（概览）不显示组名
                heading={group.title || undefined}
              >
                {/* [user-ui] key 改用 URL（导航里 URL 唯一），去掉数组下标与无花括号的 if（lint） */}
                {group.items.map((navItem) => {
                  if (navItem.url) {
                    return (
                      <CommandItem
                        key={String(navItem.url)}
                        value={navItem.title}
                        onSelect={() => {
                          runCommand(() => navigate({ to: navItem.url }))
                        }}
                      >
                        <div className='flex size-4 items-center justify-center'>
                          <ArrowRight className='text-muted-foreground/80 size-2' />
                        </div>
                        {navItem.title}
                      </CommandItem>
                    )
                  }

                  return navItem.items?.map((subItem) => (
                    <CommandItem
                      key={`${navItem.title}-${String(subItem.url)}`}
                      value={`${navItem.title}-${subItem.url}`}
                      onSelect={() => {
                        runCommand(() => navigate({ to: subItem.url }))
                      }}
                    >
                      <div className='flex size-4 items-center justify-center'>
                        <ArrowRight className='text-muted-foreground/80 size-2' />
                      </div>
                      {navItem.title} <ChevronRight /> {subItem.title}
                    </CommandItem>
                  ))
                })}
              </CommandGroup>
            ))}
            <CommandSeparator />
            {/* [user-ui] 组名与选项文案走 i18n（原为写死的 'Theme' / 'System'），与头像菜单的外观子菜单一致 */}
            <CommandGroup heading={t('shell.menu.appearance')}>
              <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                <Sun /> <span>{t('shell.theme.light')}</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                <Moon className='scale-90' />
                <span>{t('shell.theme.dark')}</span>
              </CommandItem>
              <CommandItem
                onSelect={() => runCommand(() => setTheme('system'))}
              >
                <Laptop />
                <span>{t('shell.theme.system')}</span>
              </CommandItem>
            </CommandGroup>
          </ScrollArea>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
