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
import { Languages, Check } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  INTERFACE_LANGUAGE_OPTIONS,
  normalizeInterfaceLanguage,
} from '@/i18n/languages'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

// [user-ui] 切换语言的逻辑抽成内部 hook，供顶栏按钮（公共页）与头像菜单里的子菜单（控制台）共用；
// 行为不变：切换 i18n 语言，已登录时尽力把偏好写回 /api/user/self。
function useInterfaceLanguage() {
  const { i18n } = useTranslation()
  const user = useAuthStore((s) => s.auth.user)
  const currentLanguage = normalizeInterfaceLanguage(i18n.language)
  const handleChangeLanguage = useCallback(
    async (code: string) => {
      await i18n.changeLanguage(code)
      if (user) {
        try {
          await api.put('/api/user/self', { language: code })
        } catch {
          // Best-effort persistence; don't block the UI on failure
        }
      }
    },
    [i18n, user]
  )
  return { currentLanguage, handleChangeLanguage }
}

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const { currentLanguage, handleChangeLanguage } = useInterfaceLanguage()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={<Button variant='ghost' size='icon' className='h-9 w-9' />}
      >
        <Languages className='size-[1.2rem]' />
        <span className='sr-only'>{t('Change language')}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {INTERFACE_LANGUAGE_OPTIONS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChangeLanguage(lang.code)}
          >
            {lang.label}
            <Check
              size={14}
              className={cn(
                'ms-auto',
                currentLanguage !== lang.code && 'hidden'
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * [user-ui] 语言子菜单，嵌在头像菜单（ProfileDropdown）里使用（审计 1.3：控制台顶栏只留 文档 · 通知 · 头像，
 * 语言收进头像菜单）。触发项右侧显示当前语言。
 */
export function LanguageMenuSub() {
  const { t } = useTranslation()
  const { currentLanguage, handleChangeLanguage } = useInterfaceLanguage()
  const currentLabel = INTERFACE_LANGUAGE_OPTIONS.find(
    (lang) => lang.code === currentLanguage
  )?.label

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages className='size-4' aria-hidden='true' />
        {t('shell.menu.language')}
        {currentLabel ? (
          <span className='text-muted-foreground ms-auto text-xs'>
            {currentLabel}
          </span>
        ) : null}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className='min-w-36'>
        <DropdownMenuRadioGroup
          value={currentLanguage}
          onValueChange={(value) => {
            void handleChangeLanguage(String(value))
          }}
        >
          {INTERFACE_LANGUAGE_OPTIONS.map((lang) => (
            <DropdownMenuRadioItem key={lang.code} value={lang.code}>
              {lang.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
