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
import { useTranslation } from 'react-i18next'

import { AuthLayout } from '../auth-layout'
import { OtpForm } from './components/otp-form'

export function Otp() {
  const { t } = useTranslation()
  return (
    <AuthLayout>
      {/* [user-ui] 与其他认证页统一：h1、左对齐、品牌链接色，去掉链接后的英文句点 */}
      <div className='w-full space-y-6'>
        <div className='space-y-1.5'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {t('Security verification')}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {t('Verify your identity to finish signing in.')}
          </p>
          <p className='text-muted-foreground text-sm'>
            {t('Session expired?')}{' '}
            <Link
              to='/sign-in'
              className='text-primary-ink font-medium underline-offset-4 hover:underline'
            >
              {t('Re-login')}
            </Link>
          </p>
        </div>

        <OtpForm />
      </div>
    </AuthLayout>
  )
}
