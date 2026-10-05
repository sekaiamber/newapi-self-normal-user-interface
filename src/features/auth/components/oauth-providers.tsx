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
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  IconDiscord,
  IconGithub,
  IconLinuxDo,
  IconTelegram,
  IconWeChat,
} from '@/assets/brand-icons'
import { Button } from '@/components/ui/button'
import { FieldSeparator } from '@/components/ui/field'
import { cn } from '@/lib/utils'

import { useOAuthLogin } from '../hooks/use-oauth-login'
import type { SystemStatus } from '../types'

type OAuthProvidersProps = {
  status: SystemStatus | null
  disabled?: boolean
  className?: string
  onWeChatLogin?: () => void
  isWeChatLoading?: boolean
  redirectTo?: string
  /**
   * [user-ui] 分隔线（"或使用以下方式…"）。登录与注册页共用同一种分隔线（审计 2.13 U6）；
   * 页面上没有密码表单时传 false，不显示"或"。
   */
  divider?: ReactNode | false
  /** [user-ui] 排在第三方按钮前面的其他登录方式（登录页的通行密钥），与第三方按钮共用分隔线 */
  leading?: ReactNode
  /**
   * [user-ui] 点击任一第三方按钮前的检查（例如未勾选用户协议时提示并返回 false）。
   * 原来是在未勾选时直接禁用按钮，用户不知道为什么点不了（审计 2.13 U5）。
   */
  onBeforeLogin?: () => boolean
}

type ProviderButton = {
  key: string
  /** 按钮上显示的名称（分隔线已经说明"使用以下方式"） */
  label: string
  /** 读屏用的完整说法，如"使用 GitHub 继续" */
  ariaLabel: string
  onClick: () => void
  icon?: ReactNode
  disabled?: boolean
  /** 按钮上是状态文字（如"正在跳转到 GitHub…"）时占满一行 */
  wide?: boolean
}

export function OAuthProviders({
  status,
  disabled = false,
  className,
  onWeChatLogin,
  isWeChatLoading = false,
  redirectTo,
  divider,
  leading,
  onBeforeLogin,
}: OAuthProvidersProps) {
  const { t } = useTranslation()
  const {
    isLoading,
    githubButtonText,
    githubButtonDisabled,
    handleGitHubLogin,
    handleDiscordLogin,
    handleOIDCLogin,
    handleLinuxDOLogin,
    handleTelegramLogin,
    handleCustomOAuthLogin,
  } = useOAuthLogin(status, redirectTo)

  const providerButtons: ProviderButton[] = []
  const continueWith = (name: string) => t('Continue with {{name}}', { name })

  if (status?.wechat_login && onWeChatLogin) {
    const name = t('auth.provider.wechat')
    providerButtons.push({
      key: 'wechat',
      label: name,
      ariaLabel: continueWith(name),
      onClick: onWeChatLogin,
      icon: <IconWeChat className='h-4 w-4' />,
      disabled: isWeChatLoading,
    })
  }

  if (status?.github_oauth) {
    // hook 空闲时的文字就是"使用 GitHub 继续"；跳转中/超时时显示 hook 给出的状态文字
    const githubIdle =
      !githubButtonText || githubButtonText === t('Continue with GitHub')
    providerButtons.push({
      key: 'github',
      label: githubIdle ? 'GitHub' : githubButtonText,
      ariaLabel: githubIdle ? continueWith('GitHub') : githubButtonText,
      wide: !githubIdle,
      onClick: handleGitHubLogin,
      icon: <IconGithub className='h-4 w-4' />,
      disabled: githubButtonDisabled,
    })
  }

  if (status?.discord_oauth) {
    providerButtons.push({
      key: 'discord',
      label: 'Discord',
      ariaLabel: continueWith('Discord'),
      onClick: handleDiscordLogin,
      icon: <IconDiscord className='h-4 w-4' />,
    })
  }

  if (status?.oidc_enabled) {
    const oidcDisplayName = status.oidc_display_name?.trim() || 'OIDC'
    providerButtons.push({
      key: 'oidc',
      label: oidcDisplayName,
      ariaLabel: continueWith(oidcDisplayName),
      onClick: handleOIDCLogin,
    })
  }

  if (status?.linuxdo_oauth) {
    providerButtons.push({
      key: 'linuxdo',
      label: 'LinuxDO',
      ariaLabel: continueWith('LinuxDO'),
      onClick: handleLinuxDOLogin,
      icon: <IconLinuxDo className='h-4 w-4' />,
    })
  }

  if (status?.telegram_oauth) {
    providerButtons.push({
      key: 'telegram',
      label: 'Telegram',
      ariaLabel: continueWith('Telegram'),
      onClick: handleTelegramLogin,
      icon: <IconTelegram className='h-4 w-4' />,
    })
  }

  // Custom OAuth providers
  const customProviders = status?.custom_oauth_providers
  if (customProviders && customProviders.length > 0) {
    for (const provider of customProviders) {
      providerButtons.push({
        key: `custom-${provider.slug}`,
        label: provider.name,
        ariaLabel: continueWith(provider.name),
        onClick: () => handleCustomOAuthLogin(provider),
      })
    }
  }

  if (providerButtons.length === 0 && !leading) return null

  const dividerContent =
    divider === undefined ? t('auth.divider.continueWith') : divider
  const twoColumns = providerButtons.length > 1

  // [user-ui] 改版：统一分隔线 + 两列按钮（只写平台名，读屏仍读完整说法）；数量为奇数时最后一个占满一行
  return (
    <div className={cn('grid gap-3', className)} data-testid='oauth-providers'>
      {dividerContent !== false && (
        <FieldSeparator className='my-1'>{dividerContent}</FieldSeparator>
      )}

      {leading}

      {providerButtons.length > 0 && (
        <div
          className={cn('grid gap-2', twoColumns && 'grid-cols-2')}
          data-testid='oauth-provider-buttons'
        >
          {providerButtons.map((button, index) => (
            <Button
              key={button.key}
              variant='outline'
              type='button'
              aria-label={button.ariaLabel}
              disabled={disabled || isLoading || button.disabled}
              onClick={() => {
                if (onBeforeLogin && !onBeforeLogin()) return
                button.onClick()
              }}
              className={cn(
                'h-auto min-h-10 w-full min-w-0 justify-center gap-2 py-2 text-center whitespace-normal',
                twoColumns &&
                  (button.wide ||
                    (index === providerButtons.length - 1 &&
                      providerButtons.length % 2 === 1)) &&
                  'col-span-2'
              )}
            >
              {button.icon}
              <span className='min-w-0 break-words'>{button.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
