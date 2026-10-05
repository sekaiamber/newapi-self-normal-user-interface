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
import type { Row } from '@tanstack/react-table'
import {
  Trash2,
  Edit,
  Power,
  PowerOff,
  ExternalLink,
  Braces,
  Copy,
  Loader2,
  Terminal,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { DataTableRowActionMenu } from '@/components/data-table/core/row-action-menu'
import { Button } from '@/components/ui/button'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ChatPreset } from '@/features/chat/lib/chat-links'
import { useApiBaseUrl } from '@/lib/api-endpoint'
import { encodeChannelConnectionInfo } from '@/lib/channel-connection-info'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { handleServerError } from '@/lib/handle-server-error'

import { updateApiKeyStatus } from '../api'
import { API_KEY_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants'
import { useChatPresetLauncher } from '../hooks/use-chat-preset-launcher'
import { formatBaseUrlAndKey } from '../lib/connection-text'
import { apiKeySchema } from '../types'
import { useApiKeys } from './api-keys-provider'

type DataTableRowActionsProps<TData> = {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const { t } = useTranslation()
  const apiKey = apiKeySchema.parse(row.original)
  const {
    setOpen,
    setCurrentRow,
    triggerRefresh,
    setResolvedKey,
    resolveRealKey,
    loadingKeys,
  } = useApiKeys()
  const isEnabled = apiKey.status === API_KEY_STATUS.ENABLED
  // [user-ui] 接口地址统一取 useApiBaseUrl()；聊天预设的打开逻辑抽到 useChatPresetLauncher
  const apiBaseUrl = useApiBaseUrl()
  const { presets: chatPresets, launch: launchChatPreset } =
    useChatPresetLauncher()
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const isRealKeyLoading = Boolean(loadingKeys[apiKey.id])

  const hasChatPresets = chatPresets.length > 0
  const toggleLabel = isEnabled ? t('Disable') : t('Enable')

  const handleOpenChatPreset = useCallback(
    async (preset: ChatPreset) => {
      const realKey = await resolveRealKey(apiKey.id)
      if (!realKey) return
      launchChatPreset(preset, realKey)
    },
    [resolveRealKey, apiKey.id, launchChatPreset]
  )

  const handleCopy = useCallback(
    async (format: (realKey: string) => string) => {
      const realKey = await resolveRealKey(apiKey.id)
      if (!realKey) return
      const ok = await copyToClipboard(format(realKey))
      if (ok) toast.success(t('Copied'))
    },
    [resolveRealKey, apiKey.id, t]
  )

  const handleToggleStatus = async (
    event?: React.MouseEvent<HTMLButtonElement>
  ) => {
    event?.stopPropagation()
    const newStatus = isEnabled
      ? API_KEY_STATUS.DISABLED
      : API_KEY_STATUS.ENABLED

    setIsTogglingStatus(true)
    try {
      const result = await updateApiKeyStatus(apiKey.id, newStatus)
      if (result.success) {
        const message = isEnabled
          ? t(SUCCESS_MESSAGES.API_KEY_DISABLED)
          : t(SUCCESS_MESSAGES.API_KEY_ENABLED)
        toast.success(message)
        triggerRefresh()
      } else {
        handleServerError(result, t(ERROR_MESSAGES.STATUS_UPDATE_FAILED))
      }
    } catch (error) {
      handleServerError(error, t(ERROR_MESSAGES.UNEXPECTED))
    } finally {
      setIsTogglingStatus(false)
    }
  }

  let statusIcon = <Power className='size-4' />
  if (isTogglingStatus) {
    statusIcon = <Loader2 className='size-4 animate-spin' />
  } else if (isEnabled) {
    statusIcon = <PowerOff className='size-4' />
  }

  return (
    <div className='-ml-1.5 flex items-center gap-1'>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              aria-label={toggleLabel}
              // [user-ui] 启用/停用不是危险操作：去掉红/绿色，红色只留给"删除"（审计 2.5 K9）
              className='text-muted-foreground hover:text-foreground'
            />
          }
        >
          {statusIcon}
        </TooltipTrigger>
        <TooltipContent>{toggleLabel}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={() => {
                setCurrentRow(apiKey)
                setOpen('update')
              }}
              aria-label={t('Edit')}
            />
          }
        >
          <Edit />
        </TooltipTrigger>
        <TooltipContent>{t('Edit')}</TooltipContent>
      </Tooltip>

      {/* [user-ui] 菜单按用途分成"复制"和"一键接入"两组（审计 2.5 K7/K8）：
          复制密钥只保留单元格里的复制按钮；"复制连接信息"改名为导入配置（JSON）；
          CC Switch 写明它接入的是哪些工具；聊天预设改名"聊天应用"。 */}
      <DataTableRowActionMenu
        ariaLabel={t('Open menu')}
        contentClassName='w-64'
        modal={false}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('keys.menu.copyGroup')}</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={isRealKeyLoading}
            onClick={() =>
              handleCopy((realKey) => formatBaseUrlAndKey(apiBaseUrl, realKey))
            }
          >
            {t('keys.menu.copyBaseUrlAndKey')}
            <DropdownMenuShortcut>
              <Copy size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isRealKeyLoading}
            onClick={() =>
              handleCopy((realKey) =>
                encodeChannelConnectionInfo(realKey, apiBaseUrl)
              )
            }
          >
            {t('keys.menu.copyImportJson')}
            <DropdownMenuShortcut>
              <Braces size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('keys.menu.connectGroup')}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={async () => {
              const realKey = await resolveRealKey(apiKey.id)
              if (!realKey) return
              setResolvedKey(realKey)
              setCurrentRow(apiKey)
              setOpen('cc-switch')
            }}
          >
            <span className='flex min-w-0 flex-col'>
              <span>{t('keys.menu.cliTools')}</span>
              <span className='text-muted-foreground text-xs'>
                {t('keys.menu.viaCcSwitch')}
              </span>
            </span>
            <DropdownMenuShortcut>
              <Terminal size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {hasChatPresets && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                {t('keys.menu.chatApps')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {chatPresets.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    onClick={() => handleOpenChatPreset(preset)}
                  >
                    {preset.name}
                    {preset.type !== 'web' && (
                      <DropdownMenuShortcut>
                        <ExternalLink size={16} />
                      </DropdownMenuShortcut>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant='destructive'
          onClick={() => {
            setCurrentRow(apiKey)
            setOpen('delete')
          }}
        >
          {t('Delete')}
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DataTableRowActionMenu>
    </div>
  )
}
