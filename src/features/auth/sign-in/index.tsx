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
import { Link, useLocation, useSearch } from '@tanstack/react-router'
import { CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { useStatus } from '@/hooks/use-status'

import { AuthLayout } from '../auth-layout'
import { readSignUpUsername } from '../components/sign-up-handoff'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { t } = useTranslation()
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })
  const { status } = useStatus()
  // [user-ui] 注册成功后带回的用户名：预填并提示输入密码（审计 2.13 U2）
  const signUpUsername = useLocation({
    select: (location) => readSignUpUsername(location.state),
  })

  // [user-ui] 页面标题改为 h1、左对齐；去掉链接后的英文句点；协议说明并入表单内的勾选框（TermsFooter 不再重复显示）
  return (
    <AuthLayout>
      <div className='w-full space-y-6'>
        <div className='space-y-1.5'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {t('Sign in')}
          </h1>
          {!status?.self_use_mode_enabled &&
            status?.register_enabled !== false && (
              <p className='text-muted-foreground text-sm'>
                {t("Don't have an account?")}{' '}
                <Link
                  to='/sign-up'
                  className='text-primary-ink font-medium underline-offset-4 hover:underline'
                >
                  {t('Sign up')}
                </Link>
              </p>
            )}
        </div>

        {signUpUsername && (
          <Alert
            className='border-success/40 bg-success/10 text-success'
            data-testid='sign-up-success'
          >
            <CircleCheck aria-hidden='true' />
            <AlertDescription className='text-foreground'>
              {t('auth.signIn.registered', { username: signUpUsername })}
            </AlertDescription>
          </Alert>
        )}

        <UserAuthForm redirectTo={redirect} defaultUsername={signUpUsername} />
      </div>
    </AuthLayout>
  )
}
