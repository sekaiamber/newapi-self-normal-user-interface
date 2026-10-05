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
// [user-ui] 重写：选项按已确认的信息架构分组并使用新名称（无"聊天"开关，钱包开关跟随功能开关），
// 不再展示区域级开关；读写规则见 ../lib/sidebar-modules.ts（隐藏模块的原值不会被写成 false）。
// 读取失败时不允许保存，避免用默认值覆盖用户已有设置；有未保存修改时给出提示。
import { LayoutDashboard, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { TitledCard } from '@/components/ui/titled-card'
import { api } from '@/lib/api'
import { handleServerError } from '@/lib/handle-server-error'
import { useAuthStore } from '@/stores/auth-store'

import { getUserProfile } from '../api'
import {
  buildDefaultSidebarConfig,
  getSidebarToggleGroups,
  isSidebarToggleOn,
  parseSidebarModules,
  resetSidebarToggles,
  setSidebarToggle,
  type SidebarModulesConfig,
} from '../lib/sidebar-modules'

type LoadState = 'loading' | 'ready' | 'error'

export function SidebarModulesCard() {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [saved, setSaved] = useState<SidebarModulesConfig>({})
  const [config, setConfig] = useState<SidebarModulesConfig>({})
  const currentUser = useAuthStore((s) => s.auth.user)
  const setUser = useAuthStore((s) => s.auth.setUser)
  const groups = useMemo(() => getSidebarToggleGroups(), [])

  const loadConfig = useCallback(async () => {
    setLoadState('loading')
    try {
      const res = await getUserProfile()
      if (!res.success || !res.data) throw new Error(res.message)
      const stored = parseSidebarModules(
        (res.data as { sidebar_modules?: unknown }).sidebar_modules
      )
      const initial = stored ?? buildDefaultSidebarConfig()
      setSaved(initial)
      setConfig(initial)
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  const dirty = JSON.stringify(config) !== JSON.stringify(saved)
  const ready = loadState === 'ready'

  const handleSave = async () => {
    setSaving(true)
    try {
      const serialized = JSON.stringify(config)
      const res = await api.put('/api/user/self', {
        sidebar_modules: serialized,
      })
      if (res.data.success) {
        // Sync to auth-store so useSidebarConfig re-runs and the sidebar
        // updates immediately without needing a page refresh.
        if (currentUser) {
          setUser({ ...currentUser, sidebar_modules: serialized })
        }
        setSaved(config)
        toast.success(t('Saved successfully'))
      } else {
        handleServerError(res.data, t('Save failed'))
      }
    } catch (error) {
      handleServerError(error, t('Save failed, please retry'))
    } finally {
      setSaving(false)
    }
  }

  let body: React.ReactNode
  if (loadState === 'loading') {
    body = (
      <div role='status' aria-label={t('Loading...')} className='space-y-3'>
        {['a', 'b', 'c'].map((key) => (
          <Skeleton key={key} className='h-12 w-full' />
        ))}
      </div>
    )
  } else if (loadState === 'error') {
    body = (
      <div role='alert' className='flex flex-wrap items-center gap-3'>
        <span className='text-destructive text-sm'>
          {t('account.sidebar.loadFailed')}
        </span>
        <Button size='sm' variant='outline' onClick={() => void loadConfig()}>
          {t('Retry')}
        </Button>
      </div>
    )
  } else {
    body = (
      <div className='space-y-4'>
        {groups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`sidebar-group-${group.id}`}
            className='space-y-1'
          >
            <h4
              id={`sidebar-group-${group.id}`}
              className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'
            >
              {t(group.titleKey)}
            </h4>
            <ul className='divide-border divide-y'>
              {group.toggles.map((toggle) => {
                const id = `sidebar-toggle-${toggle.id}`
                return (
                  <li
                    key={toggle.id}
                    className='flex items-center justify-between gap-3 py-2.5'
                  >
                    <div className='min-w-0'>
                      <label htmlFor={id} className='block text-sm font-medium'>
                        {t(toggle.labelKey)}
                      </label>
                      <p className='text-muted-foreground text-xs'>
                        {t(toggle.descriptionKey)}
                      </p>
                    </div>
                    <Switch
                      id={id}
                      checked={isSidebarToggleOn(config, toggle)}
                      onCheckedChange={(value) =>
                        setConfig((prev) =>
                          setSidebarToggle(prev, toggle, value, groups)
                        )
                      }
                      disabled={saving}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    )
  }

  return (
    <TitledCard
      title={t('account.sidebar.title')}
      description={t('account.sidebar.description')}
      icon={<LayoutDashboard className='h-4 w-4' />}
      iconTone='info'
      disableHoverEffect
    >
      {body}
      <div className='mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end'>
        {dirty && (
          <p role='status' className='text-muted-foreground text-xs sm:mr-auto'>
            {t('account.unsavedChanges')}
          </p>
        )}
        <div className='flex flex-col-reverse gap-2 sm:flex-row'>
          <Button
            variant='outline'
            disabled={!ready || saving}
            onClick={() => {
              setConfig((prev) => resetSidebarToggles(prev, groups))
              toast.success(t('Reset to default configuration'))
            }}
          >
            {t('Reset to Default')}
          </Button>
          <Button onClick={handleSave} disabled={!ready || !dirty || saving}>
            {saving && <Loader2 className='h-4 w-4 animate-spin' />}
            {saving ? t('Saving...') : t('Save Changes')}
          </Button>
        </div>
      </div>
    </TitledCard>
  )
}
