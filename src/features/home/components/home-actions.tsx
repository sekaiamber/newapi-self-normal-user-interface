/*
 * [user-ui] 首页主操作按钮组（本仓库新增文件，非官方代码）。
 *
 * 每个视图区只有一个金色主按钮：
 * - 已登录：进入控制台（主）· 创建 API 密钥 · 文档
 * - 未登录且开放注册：注册账号（主）· 登录 · 文档
 * - 未登录且未开放注册：登录（主）· 文档
 */
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useHomeAuth } from '../hooks/use-home-auth'

const LARGE_BUTTON = 'h-11 px-5 text-base'

export function HomeActions(props: { className?: string }) {
  const { t } = useTranslation()
  const { isAuthenticated, canRegister } = useHomeAuth()

  let actions = (
    <Button className={LARGE_BUTTON} render={<Link to='/sign-in' />}>
      {t('home.cta.signIn')}
      <ArrowRight data-icon='inline-end' />
    </Button>
  )
  if (isAuthenticated) {
    actions = (
      <>
        <Button className={LARGE_BUTTON} render={<Link to='/dashboard' />}>
          {t('home.cta.console')}
          <ArrowRight data-icon='inline-end' />
        </Button>
        <Button
          variant='outline'
          className={LARGE_BUTTON}
          render={<Link to='/keys' />}
        >
          {t('home.cta.createKey')}
        </Button>
      </>
    )
  } else if (canRegister) {
    actions = (
      <>
        <Button className={LARGE_BUTTON} render={<Link to='/sign-up' />}>
          {t('home.cta.signUp')}
          <ArrowRight data-icon='inline-end' />
        </Button>
        <Button
          variant='outline'
          className={LARGE_BUTTON}
          render={<Link to='/sign-in' />}
        >
          {t('home.cta.signIn')}
        </Button>
      </>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-3', props.className)}>
      {actions}
      <Button
        variant='ghost'
        className={LARGE_BUTTON}
        render={<Link to='/docs' />}
      >
        <BookOpen data-icon='inline-start' />
        {t('home.cta.readDocs')}
      </Button>
    </div>
  )
}
