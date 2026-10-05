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
import { MESSAGE_STATUS } from '../../constants'
import type { Message } from '../../types'
import { getMessageContent } from './message-utils'
import {
  getPlaygroundErrorInfo,
  type PlaygroundErrorInfo,
} from './playground-error-info'

// [user-ui] 删除 MODEL_PRICING_SETTINGS_PATH（/system-settings/billing/model-pricing）：
// 用户 UI 没有系统设置页，原"Go to Settings"按钮会打开 404（审计 4.1 #10），改为给管理员的文字提示。

export const FALLBACK_ERROR_CONTENT = 'An unknown error occurred'

type MessageErrorState = {
  content: string
  // [user-ui] 错误分类与"下一步"提示（playground-error-info.ts）
  info: PlaygroundErrorInfo
  kind: 'generic' | 'model-price'
  // [user-ui] 原 showSettingsLink：只给管理员显示文字提示，不再给链接
  showAdminHint: boolean
}

export function isAdminRole(role?: number | null): boolean {
  return role != null && role >= 10
}

export function isErrorMessage(message: Message): boolean {
  return message.status === MESSAGE_STATUS.ERROR
}

export function getMessageErrorState(
  message: Message,
  isAdmin: boolean
): MessageErrorState | null {
  if (!isErrorMessage(message)) {
    return null
  }

  const content = getMessageContent(message) || FALLBACK_ERROR_CONTENT
  const info = getPlaygroundErrorInfo(content, message.errorCode)
  const isModelPriceError = info.kind === 'model-price'

  return {
    content,
    info,
    kind: isModelPriceError ? 'model-price' : 'generic',
    showAdminHint: isModelPriceError && isAdmin,
  }
}
