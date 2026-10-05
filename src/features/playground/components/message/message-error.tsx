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
import { AlertCircle, AlertTriangle, ChevronDown, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useIsSidebarModuleVisible } from '@/hooks/use-sidebar-config'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import {
  FALLBACK_ERROR_CONTENT,
  getMessageErrorState,
  isAdminRole,
} from '../../lib'
import type { Message } from '../../types'

interface MessageErrorProps {
  message: Message
  className?: string
  actions?: ReactNode
}

/**
 * Display error messages using Alert component
 * Following ai-elements pattern for error handling
 *
 * [user-ui] 错误提示改成人话（审计 2.10 #5）：标题说明发生了什么，正文给出下一步；
 * 后端原文（含 request id）保留在"原始错误信息"里。管理员遇到"模型未定价"时只给文字提示，
 * 不再打开用户 UI 中不存在的 /system-settings 页面（审计 4.1 #10）。
 */
export function MessageError({
  message,
  className = '',
  actions,
}: MessageErrorProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.auth.user)
  const isWalletVisible = useIsSidebarModuleVisible('/wallet')
  const errorState = getMessageErrorState(message, isAdminRole(user?.role))

  if (!errorState) {
    return null
  }

  const { info } = errorState
  const isWarning = info.tone === 'warning'
  const Icon = isWarning ? AlertTriangle : AlertCircle
  const detail =
    info.detail === FALLBACK_ERROR_CONTENT
      ? t(FALLBACK_ERROR_CONTENT)
      : info.detail
  const showDetailInline = info.kind === 'generic'

  return (
    <Alert
      variant={isWarning ? 'default' : 'destructive'}
      className={cn(
        isWarning ? 'border-warning/60' : 'border-destructive/60',
        className
      )}
      data-error-kind={info.kind}
    >
      <Icon className={isWarning ? 'text-warning' : undefined} />
      <AlertTitle className={isWarning ? 'text-foreground' : undefined}>
        {t(info.titleKey)}
      </AlertTitle>
      <AlertDescription className='space-y-2'>
        <p>{t(info.descriptionKey)}</p>
        {errorState.showAdminHint && (
          <p className='text-foreground'>
            {t('playground.error.modelPrice.adminHint')}
          </p>
        )}
        {showDetailInline ? (
          <p className='font-mono text-xs break-all'>{detail}</p>
        ) : (
          <Collapsible>
            <CollapsibleTrigger className='text-muted-foreground hover:text-foreground focus-visible:ring-ring group/detail inline-flex items-center gap-1 rounded-sm text-xs font-medium outline-none focus-visible:ring-2'>
              {t('playground.error.details')}
              <ChevronDown
                aria-hidden='true'
                className='size-3.5 transition-transform group-data-[panel-open]/detail:rotate-180 motion-reduce:transition-none'
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className='bg-muted text-muted-foreground mt-1.5 rounded-sm px-2 py-1.5 font-mono text-xs break-all'>
                {detail}
              </p>
            </CollapsibleContent>
          </Collapsible>
        )}
        {actions}
      </AlertDescription>
      {/* 放在 AlertDescription 之外：描述区会给其中的链接加下划线 */}
      {info.kind === 'quota' && isWalletVisible && (
        <div className='col-start-2 mt-2'>
          <Button render={<Link to='/wallet' />} size='sm' variant='outline'>
            <Wallet aria-hidden='true' />
            {t('playground.error.quota.action')}
          </Button>
        </div>
      )}
    </Alert>
  )
}
