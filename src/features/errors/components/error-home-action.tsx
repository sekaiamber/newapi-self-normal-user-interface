/*
 * [user-ui] 错误页的主操作按钮（本仓库新增文件，非官方代码）。
 *
 * 已登录用户回到控制台（/dashboard），未登录用户回到首页（/）。原错误页一律"返回主页"，
 * 控制台用户还要再点一次"控制台"才能回到工作区（审计 3.3：错误页改为"返回控制台 / 联系管理员"）。
 */
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

export function ErrorHomeAction() {
  const { t } = useTranslation()
  const isSignedIn = useAuthStore((state) => Boolean(state.auth.user))

  if (isSignedIn) {
    return (
      <Button render={<Link to='/dashboard' />}>
        {t('shell.error.backToConsole')}
      </Button>
    )
  }

  return <Button render={<Link to='/' />}>{t('Back to Home')}</Button>
}
