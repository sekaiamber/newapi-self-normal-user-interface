/*
 * [user-ui] 个人资料页的"偏好"卡片（本仓库新增文件，非官方代码）。
 *
 * 审计 2.11 P4/P6/P7 与 2.12 S5：
 * - 界面语言、记录 IP、接受未定价模型集中在一张卡片里；
 *   官方文档把"记录 IP"列为行为偏好（guide/feature-guide/user/personal-setting.md
 *   "Behavior Preference Settings"），因此从安全页移到这里。
 * - 开关类即改即存并提示；失败时恢复原值。
 * - 打开"接受未定价模型"前确认，文字依据同一文档页的警告（可能导致意外的高额消费）。
 * 保存走 updateUserSettings（先读取服务端最新设置再合并，只改动本项）。
 */
import { useMutation } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { TitledCard } from '@/components/ui/titled-card'
import { handleServerError } from '@/lib/handle-server-error'
import { createServerError } from '@/lib/server-error-message'

import { updateUserSettings } from '../api'
import { parseUserSettings } from '../lib/format'
import type { UpdateUserSettingsRequest, UserProfile } from '../types'
import { LanguagePreferenceRow } from './language-preferences-card'

type PreferenceKey = 'record_ip_log' | 'accept_unset_model_ratio_model'

function readPreference(profile: UserProfile | null, key: PreferenceKey) {
  return Boolean(parseUserSettings(profile?.setting)[key])
}

/** Switch that saves one boolean user setting as soon as it changes. */
function useInstantPreference(
  profile: UserProfile | null,
  key: PreferenceKey,
  onUpdate: () => void
) {
  const { t } = useTranslation()
  const stored = readPreference(profile, key)
  const [value, setValue] = useState(stored)
  useEffect(() => setValue(stored), [stored])

  const mutation = useMutation({
    mutationFn: async (next: boolean) => {
      const data: UpdateUserSettingsRequest = { [key]: next }
      const response = await updateUserSettings(data)
      if (!response.success) {
        throw createServerError(response, t('Failed to update settings'))
      }
    },
    onMutate: (next) => setValue(next),
    onSuccess: () => {
      toast.success(t('Settings updated successfully'))
      onUpdate()
    },
    onError: (error) => {
      setValue(stored)
      handleServerError(error, t('Failed to update settings'))
    },
  })

  return {
    value,
    pending: mutation.isPending,
    save: (next: boolean) => mutation.mutate(next),
  }
}

function PreferenceRow(props: {
  id: string
  label: string
  description: string
  checked: boolean
  disabled: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className='flex items-start justify-between gap-3 sm:items-center'>
      <div className='min-w-0 space-y-0.5'>
        <Label htmlFor={props.id}>{props.label}</Label>
        <p className='text-muted-foreground text-xs sm:text-sm'>
          {props.description}
        </p>
      </div>
      <Switch
        id={props.id}
        className='shrink-0'
        checked={props.checked}
        disabled={props.disabled}
        onCheckedChange={props.onCheckedChange}
      />
    </div>
  )
}

type PreferencesCardProps = {
  profile: UserProfile | null
  onProfileUpdate: () => void
}

export function PreferencesCard(props: PreferencesCardProps) {
  const { t } = useTranslation()
  const [confirmUnpriced, setConfirmUnpriced] = useState(false)
  const recordIp = useInstantPreference(
    props.profile,
    'record_ip_log',
    props.onProfileUpdate
  )
  const unpriced = useInstantPreference(
    props.profile,
    'accept_unset_model_ratio_model',
    props.onProfileUpdate
  )

  return (
    <TitledCard
      title={t('Preferences')}
      description={t('account.preferences.description')}
      icon={<SlidersHorizontal className='h-4 w-4' />}
      iconTone='chart-4'
      disableHoverEffect
    >
      <div className='divide-border divide-y [&>*]:py-4 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0'>
        <LanguagePreferenceRow
          profile={props.profile}
          onProfileUpdate={props.onProfileUpdate}
        />
        <PreferenceRow
          id='preference-record-ip'
          label={t('Record IP Address')}
          description={t('account.preferences.recordIp.desc')}
          checked={recordIp.value}
          disabled={recordIp.pending}
          onCheckedChange={recordIp.save}
        />
        <PreferenceRow
          id='preference-accept-unpriced'
          label={t('Accept Unpriced Models')}
          description={t('account.preferences.unpriced.desc')}
          checked={unpriced.value}
          disabled={unpriced.pending}
          onCheckedChange={(checked) => {
            if (checked) setConfirmUnpriced(true)
            else unpriced.save(false)
          }}
        />
      </div>
      <ConfirmDialog
        open={confirmUnpriced}
        onOpenChange={setConfirmUnpriced}
        title={t('account.preferences.unpriced.confirmTitle')}
        desc={t('account.preferences.unpriced.confirmDesc')}
        confirmText={t('account.preferences.unpriced.confirm')}
        destructive
        handleConfirm={() => {
          setConfirmUnpriced(false)
          unpriced.save(true)
        }}
      />
    </TitledCard>
  )
}
