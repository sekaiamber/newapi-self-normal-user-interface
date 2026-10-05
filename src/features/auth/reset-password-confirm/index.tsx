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
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CopyButton } from '@/components/copy-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCountdown } from '@/hooks/use-countdown'
import { api } from '@/lib/api'
import { copyToClipboard } from '@/lib/copy-to-clipboard'
import { handleServerError } from '@/lib/handle-server-error'
import { AuthOperationError } from '@/lib/secure-verification'
import { createServerError } from '@/lib/server-error-message'

import { AuthLayout } from '../auth-layout'

export type ResetPasswordSearchParams = {
  email?: string
  token?: string
}

type ResetPasswordConfirmProps = ResetPasswordSearchParams

export function ResetPasswordConfirm({
  email,
  token,
}: ResetPasswordConfirmProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  // [user-ui] 记录自动复制是否成功，界面上只在成功时说"已复制"
  const [autoCopied, setAutoCopied] = useState(false)
  const {
    secondsLeft,
    isActive,
    start: startCountdown,
  } = useCountdown({ initialSeconds: 30 })

  const isValidResetLink = Boolean(email && token)

  async function handleSubmit() {
    if (!isValidResetLink || !email || !token) {
      toast.error(t('Invalid reset link, please request a new password reset'))
      return
    }

    startCountdown()
    setLoading(true)
    try {
      const res = await api.post('/api/user/reset', { email, token }, {
        skipBusinessError: true,
      } as Record<string, unknown>)

      if (res?.data?.success) {
        const password = res.data.data
        setNewPassword(password)
        const copySuccess = await copyToClipboard(password)
        setAutoCopied(copySuccess)
        if (copySuccess) {
          toast.success(
            t('Password reset and copied to clipboard: {{password}}', {
              password,
            })
          )
        } else {
          toast.success(t('Password reset: {{password}}', { password }))
        }
      } else {
        handleServerError(createServerError(res.data, t('Request failed')))
      }
    } catch (error) {
      handleServerError(AuthOperationError.from(error))
    } finally {
      setLoading(false)
    }
  }

  // [user-ui] 审计 2.13 U4：后端在这里生成随机新密码（不是让用户自己设置，与官方文档
  // guide/feature-guide/user/auth.md 的描述不同）。新密码改为大字醒目展示 + 复制按钮（共享 CopyButton），
  // 并提示用它登录后到"安全设置"修改。请求与按钮逻辑不变。
  return (
    <AuthLayout>
      <div className='w-full space-y-6'>
        <div className='space-y-1.5'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            {t('Reset password')}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {newPassword
              ? t('auth.resetPasswordConfirm.success')
              : t('auth.resetPasswordConfirm.description')}
          </p>
        </div>

        <div className='space-y-4'>
          {!isValidResetLink && (
            <Alert variant='destructive'>
              <AlertDescription>
                {t('Invalid reset link, please request a new password reset.')}
              </AlertDescription>
            </Alert>
          )}

          <div className='space-y-2'>
            <Label htmlFor='email'>{t('Email')}</Label>
            <Input
              id='email'
              type='email'
              value={email || ''}
              disabled
              placeholder={t('Waiting for email...')}
            />
          </div>

          {newPassword && (
            <div
              className='border-edge bg-card space-y-3 rounded-lg border-2 p-4'
              data-testid='reset-new-password'
            >
              <p className='text-sm font-semibold'>{t('New password')}</p>
              <div className='bg-muted flex items-center gap-2 rounded-lg py-2 ps-3 pe-2'>
                <code className='min-w-0 flex-1 font-mono text-xl font-semibold tracking-wide break-all select-all'>
                  {newPassword}
                </code>
                <CopyButton
                  value={newPassword}
                  variant='outline'
                  aria-label={t('auth.reset.copyPassword')}
                />
              </div>
              <p className='text-muted-foreground text-sm'>
                {autoCopied && t('auth.reset.copied')}
                {t('auth.reset.useThisPassword')}
              </p>
            </div>
          )}

          <Button
            className='h-10 w-full'
            onClick={
              newPassword
                ? () => navigate({ to: '/sign-in', replace: true })
                : handleSubmit
            }
            disabled={
              newPassword ? false : loading || isActive || !isValidResetLink
            }
          >
            {newPassword && t('auth.resetPasswordConfirm.backToLogin')}
            {!newPassword &&
              isActive &&
              t('auth.resetPasswordConfirm.retry', {
                seconds: secondsLeft,
              })}
            {!newPassword &&
              !isActive &&
              t('auth.resetPasswordConfirm.confirm')}
          </Button>

          {!newPassword && (
            <Button
              variant='link'
              className='w-full'
              onClick={() => navigate({ to: '/sign-in', replace: true })}
            >
              {t('Back to login')}
            </Button>
          )}
        </div>
      </div>
    </AuthLayout>
  )
}
