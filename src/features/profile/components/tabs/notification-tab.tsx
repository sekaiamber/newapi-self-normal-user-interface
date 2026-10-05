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
// [user-ui] 只保留通知设置（审计 2.11）：
// - 通知方式改为下拉，默认邮件（P5）；
// - 余额预警阈值按与余额相同的单位输入，保存时换算回额度点（P3，../../lib/quota-threshold.ts）；
// - "接受未定价模型"移到偏好卡片并即改即存（P4/P6/P7），本表单只提交通知字段（pickNotificationSettings）；
// - 有未保存修改时提示，无修改时保存按钮不可用（P6）。
import { Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { PasswordInput } from '@/components/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatQuota, getEditableQuotaStep } from '@/lib/format'
import { handleServerError } from '@/lib/handle-server-error'
import { ROLE } from '@/lib/roles'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { updateUserSettings } from '../../api'
import { NOTIFICATION_METHODS } from '../../constants'
import {
  thresholdInputSymbol,
  thresholdInputToUnits,
  thresholdUnitsToInput,
} from '../../lib/quota-threshold'
import {
  normalizeUserSettings,
  pickNotificationSettings,
} from '../../lib/user-settings'
import type { UserProfile, NotifyType } from '../../types'

// ============================================================================
// Settings Tab Component
// ============================================================================

interface NotificationTabProps {
  profile: UserProfile | null
  onUpdate: () => void
}

export function NotificationTab({ profile, onUpdate }: NotificationTabProps) {
  const { t } = useTranslation()
  const isAdmin = (profile?.role ?? 0) >= ROLE.ADMIN
  // Re-render (and re-convert the threshold) when the display currency loads.
  const currency = useSystemConfigStore((state) => state.config.currency)
  const [loading, setLoading] = useState(false)
  const baseline = useMemo(
    () => normalizeUserSettings(profile?.setting),
    [profile?.setting]
  )
  const [settings, setSettings] = useState(baseline)
  const [thresholdText, setThresholdText] = useState(() =>
    thresholdUnitsToInput(baseline.quota_warning_threshold)
  )

  // Update form field helper
  const updateField = useCallback(
    <K extends keyof typeof settings>(
      field: K,
      value: (typeof settings)[K]
    ) => {
      setSettings((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  useEffect(() => {
    setSettings(baseline)
  }, [baseline])

  useEffect(() => {
    setThresholdText(thresholdUnitsToInput(baseline.quota_warning_threshold))
  }, [baseline, currency])

  const thresholdUnits = thresholdInputToUnits(thresholdText)
  const thresholdInvalid = thresholdUnits === null
  const payload = pickNotificationSettings({
    ...settings,
    quota_warning_threshold: thresholdUnits ?? baseline.quota_warning_threshold,
  })
  const dirty =
    thresholdInvalid ||
    JSON.stringify(payload) !==
      JSON.stringify(pickNotificationSettings(baseline))
  const symbol = thresholdInputSymbol()

  const handleSave = async () => {
    if (thresholdInvalid) return
    try {
      setLoading(true)
      const response = await updateUserSettings(payload)

      if (response.success) {
        toast.success(t('Settings updated successfully'))
        onUpdate()
      } else {
        handleServerError(response, t('Failed to update settings'))
      }
    } catch (error) {
      handleServerError(error, t('Failed to update settings'))
    } finally {
      setLoading(false)
    }
  }

  const notifyType = settings.notify_type
  const methodItems = NOTIFICATION_METHODS.map((method) => ({
    value: method.value,
    label: t(method.label),
  }))

  return (
    <div className='space-y-4 sm:space-y-5'>
      {/* Notification Type */}
      <div className='space-y-1.5'>
        <Label htmlFor='notifyMethod'>{t('Notification Method')}</Label>
        <Select
          items={methodItems}
          value={notifyType}
          onValueChange={(value) => {
            if (value) updateField('notify_type', value as NotifyType)
          }}
        >
          <SelectTrigger id='notifyMethod' className='h-9 w-full sm:w-64'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              {methodItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className='text-muted-foreground text-xs'>
          {t('account.notify.method.help')}
        </p>
      </div>

      {/* Email Settings */}
      {notifyType === 'email' && (
        <div className='space-y-1.5'>
          <Label htmlFor='notifyEmail'>{t('Notification Email')}</Label>
          <Input
            id='notifyEmail'
            type='email'
            className='h-9'
            value={settings.notification_email}
            onChange={(e) => updateField('notification_email', e.target.value)}
            placeholder={t('Leave empty to use account email')}
          />
        </div>
      )}

      {/* Webhook Settings */}
      {notifyType === 'webhook' && (
        <>
          <div className='space-y-1.5'>
            <Label htmlFor='webhookUrl'>{t('Webhook URL')}</Label>
            <Input
              id='webhookUrl'
              type='url'
              className='h-9'
              value={settings.webhook_url}
              onChange={(e) => updateField('webhook_url', e.target.value)}
              placeholder={t('https://example.com/webhook')}
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='webhookSecret'>{t('Webhook Secret')}</Label>
            <PasswordInput
              id='webhookSecret'
              value={settings.webhook_secret}
              onChange={(e) => updateField('webhook_secret', e.target.value)}
              placeholder={t('Enter secret key')}
            />
          </div>
        </>
      )}

      {/* Bark Settings */}
      {notifyType === 'bark' && (
        <div className='space-y-1.5'>
          <Label htmlFor='barkUrl'>{t('Bark Push URL')}</Label>
          <Input
            id='barkUrl'
            type='url'
            className='h-9'
            value={settings.bark_url}
            onChange={(e) => updateField('bark_url', e.target.value)}
            placeholder={t('https://api.day.app/yourkey/{{title}}/{{content}}')}
          />
          <p className='text-muted-foreground text-xs'>
            {t('Template variables:')} {'{{title}}'}, {'{{content}}'}
          </p>
        </div>
      )}

      {/* Gotify Settings */}
      {notifyType === 'gotify' && (
        <>
          <div className='space-y-1.5'>
            <Label htmlFor='gotifyUrl'>{t('Gotify Server URL')}</Label>
            <Input
              id='gotifyUrl'
              type='url'
              className='h-9'
              value={settings.gotify_url}
              onChange={(e) => updateField('gotify_url', e.target.value)}
              placeholder={t('https://gotify.example.com')}
            />
            <p className='text-muted-foreground text-xs'>
              {t('Enter the full URL of your Gotify server')}
            </p>
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='gotifyToken'>{t('Gotify Application Token')}</Label>
            <PasswordInput
              id='gotifyToken'
              value={settings.gotify_token}
              onChange={(e) => updateField('gotify_token', e.target.value)}
              placeholder={t('Enter application token')}
            />
            <p className='text-muted-foreground text-xs'>
              {t('Token obtained from your Gotify application')}{' '}
              <a
                href='https://gotify.net/'
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary-ink underline underline-offset-4'
              >
                {t('Gotify Documentation')}
              </a>
            </p>
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='gotifyPriority'>{t('Message Priority')}</Label>
            <Input
              id='gotifyPriority'
              type='number'
              className='h-9'
              min='0'
              max='10'
              value={settings.gotify_priority}
              onChange={(e) =>
                updateField('gotify_priority', Number(e.target.value))
              }
              placeholder='5'
            />
            <p className='text-muted-foreground text-xs'>
              {t(
                'Priority level from 0 (lowest) to 10 (highest), default is 5'
              )}
            </p>
          </div>
        </>
      )}

      {/* Warning Threshold (in the same unit as the balance) */}
      <div className='space-y-1.5'>
        <Label htmlFor='threshold'>{t('account.notify.threshold')}</Label>
        <InputGroup className='h-9 sm:max-w-64'>
          {symbol && (
            <InputGroupAddon>
              <InputGroupText className='font-mono'>{symbol}</InputGroupText>
            </InputGroupAddon>
          )}
          <InputGroupInput
            id='threshold'
            type='number'
            inputMode='decimal'
            min={0}
            step={getEditableQuotaStep()}
            className='font-mono tabular-nums'
            value={thresholdText}
            aria-invalid={thresholdInvalid}
            aria-describedby='threshold-help'
            onChange={(e) => setThresholdText(e.target.value)}
          />
        </InputGroup>
        <p id='threshold-help' className='text-muted-foreground text-xs'>
          {t('account.notify.threshold.help', {
            balance: formatQuota(profile?.quota ?? 0),
          })}
        </p>
        {thresholdInvalid && (
          <p role='alert' className='text-destructive text-xs'>
            {t('account.notify.threshold.invalid')}
          </p>
        )}
      </div>

      {/* Receive Upstream Model Update Notifications (admin only) */}
      {isAdmin && (
        <div className='flex items-start justify-between gap-3 border-t pt-4 sm:items-center'>
          <div className='space-y-0.5'>
            <Label htmlFor='upstreamModelUpdateNotify'>
              {t('Receive Upstream Model Update Notifications')}
            </Label>
            <p className='text-muted-foreground line-clamp-3 text-xs sm:line-clamp-none sm:text-sm'>
              {t(
                'Only available for admins. When enabled, you will receive a summary notification via your selected method when the scheduled model check detects upstream model changes or check failures.'
              )}
            </p>
          </div>
          <Switch
            id='upstreamModelUpdateNotify'
            className='shrink-0'
            checked={settings.upstream_model_update_notify_enabled}
            onCheckedChange={(checked) =>
              updateField('upstream_model_update_notify_enabled', checked)
            }
          />
        </div>
      )}

      {/* Save Button */}
      <div className='flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end'>
        {dirty && !thresholdInvalid && (
          <p role='status' className='text-muted-foreground text-xs sm:mr-auto'>
            {t('account.unsavedChanges')}
          </p>
        )}
        <Button
          onClick={handleSave}
          disabled={loading || !dirty || thresholdInvalid}
        >
          {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {loading ? t('Saving...') : t('Save Settings')}
        </Button>
      </div>
    </div>
  )
}
