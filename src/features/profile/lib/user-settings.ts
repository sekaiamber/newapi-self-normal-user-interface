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
import {
  DEFAULT_QUOTA_WARNING_THRESHOLD,
  NOTIFICATION_METHODS,
} from '../constants'
import type { NotifyType, UpdateUserSettingsRequest } from '../types'
import { parseUserSettings } from './format'

export function normalizeUserSettings(
  setting?: string
): Required<UpdateUserSettingsRequest> & { notify_type: NotifyType } {
  const parsed = parseUserSettings(setting)
  const notifyType =
    NOTIFICATION_METHODS.find((method) => method.value === parsed.notify_type)
      ?.value ?? 'email'
  return {
    notify_type: notifyType,
    quota_warning_threshold:
      parsed.quota_warning_threshold ?? DEFAULT_QUOTA_WARNING_THRESHOLD,
    notification_email: parsed.notification_email ?? '',
    webhook_url: parsed.webhook_url ?? '',
    webhook_secret: parsed.webhook_secret ?? '',
    bark_url: parsed.bark_url ?? '',
    gotify_url: parsed.gotify_url ?? '',
    gotify_token: parsed.gotify_token ?? '',
    gotify_priority: parsed.gotify_priority ?? 5,
    accept_unset_model_ratio_model:
      parsed.accept_unset_model_ratio_model || false,
    record_ip_log: parsed.record_ip_log || false,
    upstream_model_update_notify_enabled:
      parsed.upstream_model_update_notify_enabled || false,
  }
}

export type NormalizedUserSettings = ReturnType<typeof normalizeUserSettings>

/**
 * [user-ui] Fields saved by the notification form. "Record IP" and "Accept
 * unpriced models" are saved on their own from the preferences card (audit
 * 2.11 P6/P7), so the notification form must never send them: the server-side
 * merge in updateUserSettings keeps their latest stored values.
 */
export const NOTIFICATION_SETTING_FIELDS = [
  'notify_type',
  'quota_warning_threshold',
  'notification_email',
  'webhook_url',
  'webhook_secret',
  'bark_url',
  'gotify_url',
  'gotify_token',
  'gotify_priority',
  'upstream_model_update_notify_enabled',
] as const

export type NotificationSettings = Pick<
  NormalizedUserSettings,
  (typeof NOTIFICATION_SETTING_FIELDS)[number]
>

export function pickNotificationSettings(
  settings: NormalizedUserSettings
): NotificationSettings {
  const picked = {} as Record<string, unknown>
  for (const field of NOTIFICATION_SETTING_FIELDS) {
    picked[field] = settings[field]
  }
  return picked as NotificationSettings
}
