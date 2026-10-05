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
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AuthLayout } from '../auth-layout'
import { ForgotPasswordForm } from './components/forgot-password-form'

// [user-ui] 审计 2.13 U7：找回密码页不再出现"还没有账户？注册"，改为"想起来了？返回登录"，
// 并说明只适用于已绑定邮箱的账户。标题改为 h1、左对齐。
export function ForgotPassword() {
  const { t } = useTranslation()
  return (
    <AuthLayout>
      <div className='w-full space-y-6'>
        <div className='space-y-1.5'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {t('Forgot password')}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {t(
              'Enter your registered email and we will send you a link to reset your password.'
            )}
          </p>
          <p className='text-muted-foreground text-sm'>
            {t('auth.forgot.emailOnly')}
          </p>
        </div>

        <ForgotPasswordForm />

        <p className='text-muted-foreground text-sm'>
          {t('auth.forgot.remembered')}{' '}
          <Link
            to='/sign-in'
            className='text-primary-ink inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline'
          >
            <ArrowLeft className='size-3.5' aria-hidden='true' />
            {t('Back to login')}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
