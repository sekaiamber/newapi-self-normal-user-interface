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
import {
  Laptop,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  SunMoon,
  User,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { LanguageMenuSub } from '@/components/language-switcher'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/context/theme-provider'
import useDialogState from '@/hooks/use-dialog'
import { useIsSidebarModuleVisible } from '@/hooks/use-sidebar-config'
import { useUserDisplay } from '@/hooks/use-user-display'
import { getUserAvatarFallback, getUserAvatarStyle } from '@/lib/avatar'
import { useAuthStore } from '@/stores/auth-store'

const avatarFallbackClassName = 'font-semibold text-white'

type ThemeValue = ReturnType<typeof useTheme>['theme']

/**
 * [user-ui] 外观子菜单（浅色 / 深色 / 跟随系统）。控制台顶栏不再放主题按钮，
 * 明暗切换收进头像菜单（审计 1.3）；主题设置只开放这三项（WP-DESIGN）。
 */
function AppearanceMenuSub() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const options: ReadonlyArray<{
    value: ThemeValue
    label: string
    icon: typeof Sun
  }> = [
    { value: 'light', label: t('shell.theme.light'), icon: Sun },
    { value: 'dark', label: t('shell.theme.dark'), icon: Moon },
    { value: 'system', label: t('shell.theme.system'), icon: Laptop },
  ]
  const currentLabel = options.find((option) => option.value === theme)?.label

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <SunMoon className='size-4' aria-hidden='true' />
        {t('shell.menu.appearance')}
        {currentLabel ? (
          <span className='text-muted-foreground ms-auto text-xs'>
            {currentLabel}
          </span>
        ) : null}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className='min-w-36'>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value as ThemeValue)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              <option.icon aria-hidden='true' />
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}

type ProfileDropdownProps = {
  /**
   * [user-ui] 是否在菜单里提供"外观"和"语言"子菜单。控制台顶栏（AppHeader）打开它；
   * 公共页顶栏自带主题与语言按钮，保持默认关闭，避免重复。
   */
  showPreferences?: boolean
}

export function ProfileDropdown(props: ProfileDropdownProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [open, setOpen] = useDialogState()
  const user = useAuthStore((state) => state.auth.user)
  const { displayName, roleLabel } = useUserDisplay(user)
  const isWalletVisible = useIsSidebarModuleVisible('/wallet')
  const isSecurityVisible = useIsSidebarModuleVisible('/security')
  const avatarName = user?.username || displayName
  const avatarFallback = getUserAvatarFallback(avatarName)
  const avatarFallbackStyle = useMemo(
    () => getUserAvatarStyle(avatarName),
    [avatarName]
  )

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              className='relative size-6 p-0'
              aria-label={t('shell.menu.account')}
            />
          }
        >
          <Avatar className='size-6'>
            <AvatarFallback
              className={`${avatarFallbackClassName} text-[11px]`}
              style={avatarFallbackStyle}
            >
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' sideOffset={8} className='w-56'>
          <div className='flex items-center gap-2 px-1.5 py-1.5'>
            <Avatar className='size-8'>
              <AvatarFallback
                className={`${avatarFallbackClassName} text-xs`}
                style={avatarFallbackStyle}
              >
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className='flex flex-1 flex-col gap-0.5 overflow-hidden'>
              <p className='text-foreground truncate text-sm font-medium'>
                {displayName}
              </p>
              <div className='flex items-center gap-1.5'>
                <span className='text-muted-foreground text-xs'>
                  {roleLabel}
                </span>
                {user?.group && (
                  <>
                    <span className='text-muted-foreground text-xs'>·</span>
                    <span className='text-muted-foreground truncate text-xs'>
                      {String(user.group)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* [user-ui] 菜单项名称与侧边栏一致（nav.* key，见信息架构） */}
          <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
            <User className='size-4' />
            {t('nav.profile')}
          </DropdownMenuItem>

          {isSecurityVisible && (
            <DropdownMenuItem onClick={() => navigate({ to: '/security' })}>
              <ShieldCheck className='size-4' />
              {t('nav.security')}
            </DropdownMenuItem>
          )}

          {isWalletVisible && (
            <DropdownMenuItem onClick={() => navigate({ to: '/wallet' })}>
              <Wallet className='size-4' />
              {t('nav.wallet')}
            </DropdownMenuItem>
          )}

          {/* [user-ui] 系统设置入口属于管理端，已移除 */}

          {props.showPreferences && (
            <>
              <DropdownMenuSeparator />
              <AppearanceMenuSub />
              <LanguageMenuSub />
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem variant='destructive' onClick={() => setOpen(true)}>
            <LogOut className='size-4' />
            {t('Sign out')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
