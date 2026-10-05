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
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import type { SystemStatus } from '../types'

interface LegalConsentProps {
  status: SystemStatus | null
  checked: boolean
  onCheckedChange: (nextValue: boolean) => void
  className?: string
  /**
   * [user-ui] 用户未勾选就点了登录/注册（审计 2.13 U5）：高亮勾选框、显示原因并把焦点移过来。
   */
  invalid?: boolean
}

const linkClassName =
  'text-primary-ink font-medium underline underline-offset-4 hover:no-underline'

// [user-ui] 改版：放在主按钮正上方；整句走 i18n（原来的 " and the " 未翻译）；
// 未勾选时可提示错误状态。勾选逻辑与链接地址不变。
export function LegalConsent({
  status,
  checked,
  onCheckedChange,
  className,
  invalid = false,
}: LegalConsentProps) {
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const hasUserAgreement = Boolean(status?.user_agreement_enabled)
  const hasPrivacyPolicy = Boolean(status?.privacy_policy_enabled)
  const showInvalid = invalid && !checked

  useEffect(() => {
    if (!showInvalid) return
    const container = containerRef.current
    container?.scrollIntoView({ block: 'nearest' })
    container
      ?.querySelector<HTMLElement>('[data-slot="checkbox"]')
      ?.focus({ preventScroll: true })
  }, [showInvalid])

  if (!hasUserAgreement && !hasPrivacyPolicy) {
    return null
  }

  const handleChange = (value: boolean) => {
    onCheckedChange(value === true)
  }

  return (
    <div
      ref={containerRef}
      data-testid='legal-consent'
      data-invalid={showInvalid || undefined}
      className={cn(
        'flex items-start gap-2.5 rounded-lg border-2 px-3 py-2.5 transition-colors motion-reduce:transition-none',
        showInvalid
          ? 'border-destructive bg-destructive/10'
          : 'bg-muted border-transparent',
        className
      )}
    >
      <Checkbox
        id='legal-consent'
        checked={checked}
        onCheckedChange={handleChange}
        aria-invalid={showInvalid || undefined}
        aria-describedby={showInvalid ? 'legal-consent-error' : undefined}
        className='mt-0.5'
      />
      <div className='min-w-0 space-y-1'>
        <Label
          htmlFor='legal-consent'
          className='text-muted-foreground block text-left text-sm leading-5 font-normal'
        >
          {t('auth.consent.prefix')}
          {hasUserAgreement && (
            <a
              href='/user-agreement'
              target='_blank'
              rel='noopener noreferrer'
              className={linkClassName}
            >
              {t('auth.consent.userAgreement')}
            </a>
          )}
          {hasUserAgreement && hasPrivacyPolicy && t('auth.consent.and')}
          {hasPrivacyPolicy && (
            <a
              href='/privacy-policy'
              target='_blank'
              rel='noopener noreferrer'
              className={linkClassName}
            >
              {t('auth.consent.privacyPolicy')}
            </a>
          )}
        </Label>
        {showInvalid && (
          <p
            id='legal-consent-error'
            className='text-destructive text-xs font-medium'
          >
            {t('auth.consent.required')}
          </p>
        )}
      </div>
    </div>
  )
}
