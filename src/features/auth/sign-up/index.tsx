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
import { SignUpForm } from './components/sign-up-form'

// [user-ui] 页面标题改为 h1、左对齐；去掉链接后的英文句点；
// 协议说明并入表单内主按钮上方的勾选框，不再在页面底部重复一句未翻译的 TermsFooter。
export function SignUp() {
  const { t } = useTranslation()

  return (
    <AuthLayout>
      <div className='w-full space-y-6'>
        <div className='space-y-1.5'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {t('Create an account')}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {t('Already have an account?')}{' '}
            <Link
              to='/sign-in'
              className='text-primary-ink font-medium underline-offset-4 hover:underline'
            >
              {t('Sign in')}
            </Link>
          </p>
        </div>

        <SignUpForm />
      </div>
    </AuthLayout>
  )
}
