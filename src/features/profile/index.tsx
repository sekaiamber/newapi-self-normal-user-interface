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
// [user-ui] 页面标题按信息架构显示"个人资料"（与侧边栏一致）；左栏为"通知"与"偏好"两张卡
// （语言、记录 IP、接受未定价模型集中到偏好卡，审计 2.11 P7 / 2.12 S5），右栏签到与侧边栏设置。
import { useTranslation } from 'react-i18next'

import { SectionPageLayout } from '@/components/layout'
import {
  CardStaggerContainer,
  CardStaggerItem,
} from '@/components/page-transition'
import { useStatus } from '@/hooks/use-status'
import { useAuthStore } from '@/stores/auth-store'

import { CheckinCalendarCard } from './components/checkin-calendar-card'
import { PreferencesCard } from './components/preferences-card'
import { ProfileHeader } from './components/profile-header'
import { ProfileSettingsCard } from './components/profile-settings-card'
import { SidebarModulesCard } from './components/sidebar-modules-card'
import { useProfile } from './hooks'

export function Profile() {
  const { t } = useTranslation()
  const { profile, loading, refreshProfile } = useProfile()
  const { status } = useStatus()
  const permissions = useAuthStore((s) => s.auth.user?.permissions)

  const checkinEnabled = status?.checkin_enabled === true
  const turnstileEnabled = !!(
    status?.turnstile_check && status?.turnstile_site_key
  )
  const turnstileSiteKey = status?.turnstile_site_key || ''
  const canConfigureSidebar = permissions?.sidebar_settings !== false

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>
        {t('account.profile.title')}
      </SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <CardStaggerContainer className='mx-auto flex w-full max-w-7xl flex-col gap-4 sm:gap-6'>
          <CardStaggerItem>
            <ProfileHeader profile={profile} loading={loading} />
          </CardStaggerItem>

          <CardStaggerItem>
            <div className='grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.46fr)] xl:items-start'>
              <div className='min-w-0 space-y-4 sm:space-y-6'>
                <ProfileSettingsCard
                  profile={profile}
                  loading={loading}
                  onProfileUpdate={refreshProfile}
                />
                {!loading && (
                  <PreferencesCard
                    profile={profile}
                    onProfileUpdate={refreshProfile}
                  />
                )}
              </div>

              <div className='min-w-0 space-y-4 sm:space-y-6 xl:sticky xl:top-0'>
                {checkinEnabled && (
                  <CheckinCalendarCard
                    checkinEnabled={checkinEnabled}
                    turnstileEnabled={turnstileEnabled}
                    turnstileSiteKey={turnstileSiteKey}
                  />
                )}
                {canConfigureSidebar && <SidebarModulesCard />}
              </div>
            </div>
          </CardStaggerItem>
        </CardStaggerContainer>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
