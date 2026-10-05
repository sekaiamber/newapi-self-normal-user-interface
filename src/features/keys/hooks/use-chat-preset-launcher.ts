/*
 * [user-ui] 用指定密钥打开聊天应用预设（本仓库新增文件，非官方代码）。
 *
 * Adapted from QuantumNous/new-api web/src/features/keys/components/data-table-row-actions.tsx
 * @ v1.0.0-rc.37 (AGPL-3.0)：原来写在行菜单里的打开逻辑抽出来，供行菜单和"密钥已创建"
 * 对话框共用。改动：接口地址统一取 useApiBaseUrl()；"ccswitch" 预设不进聊天列表
 * （由 CC Switch 对话框处理，见 isCcSwitchPreset）；AQBot 的提供商名称用站点名称。
 */
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { useChatPresets } from '@/features/chat/hooks/use-chat-presets'
import {
  isCcSwitchPreset,
  resolveChatUrl,
  type ChatPreset,
} from '@/features/chat/lib/chat-links'
import { sendToFluent } from '@/features/chat/lib/send-to-fluent'
import { useApiBaseUrl } from '@/lib/api-endpoint'
import { useSystemConfigStore } from '@/stores/system-config-store'

export function useChatPresetLauncher() {
  const { t } = useTranslation()
  const { chatPresets } = useChatPresets()
  const apiBaseUrl = useApiBaseUrl()
  const systemName = useSystemConfigStore((state) => state.config.systemName)

  const presets = useMemo(
    () => chatPresets.filter((preset) => !isCcSwitchPreset(preset)),
    [chatPresets]
  )

  /** realKey 为完整密钥（带 sk- 前缀）。 */
  const launch = useCallback(
    (preset: ChatPreset, realKey: string) => {
      if (preset.type === 'fluent') {
        // sendToFluent 自己会加 sk- 前缀；官方行菜单传入的是带前缀的密钥，会变成 "sk-sk-…"
        const rawKey = realKey.startsWith('sk-') ? realKey.slice(3) : realKey
        const success = sendToFluent(rawKey, apiBaseUrl)
        if (success) {
          toast.success(t('Sent the API key to FluentRead.'))
        } else {
          toast.info(
            t(
              'FluentRead extension not detected. Please ensure it is installed and active.'
            )
          )
        }
        return
      }

      const resolvedUrl = resolveChatUrl({
        template: preset.url,
        apiKey: realKey,
        serverAddress: apiBaseUrl,
        providerName: systemName,
      })

      if (!resolvedUrl) {
        toast.error(t('Invalid chat link. Please contact your administrator.'))
        return
      }

      if (typeof window === 'undefined') return

      try {
        window.open(resolvedUrl, '_blank', 'noopener')
      } catch {
        window.location.href = resolvedUrl
      }
    },
    [apiBaseUrl, systemName, t]
  )

  return { presets, launch }
}
