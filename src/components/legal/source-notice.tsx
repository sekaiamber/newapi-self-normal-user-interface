/*
 * [user-ui] AGPLv3 源码与许可声明（本仓库新增文件，非官方代码）。
 *
 * AGPLv3 第 5(d) 条要求交互界面展示"适当的法律声明"（版权、无担保、许可及查看方式），
 * 第 13 条要求向通过网络使用者提供源码。各页面外壳（首页页脚、控制台侧栏、认证页、文档页）挂载本组件。
 */
import { useTranslation } from 'react-i18next'

import {
  UPSTREAM_PROJECT,
  USER_UI_LICENSE_NAME,
  USER_UI_LICENSE_URL,
  USER_UI_SOURCE_URL,
} from '@/config/user-ui-meta'
import { useSystemConfig } from '@/hooks/use-system-config'
import { cn } from '@/lib/utils'

export type SourceNoticeVariant = 'full' | 'compact'

interface SourceNoticeProps {
  /** full：页脚整句声明；compact：侧边栏等窄处，只放两个链接 */
  variant?: SourceNoticeVariant
  className?: string
}

const linkClassName =
  'underline-offset-4 hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline'

export function SourceNotice(props: SourceNoticeProps) {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const variant = props.variant ?? 'full'

  const sourceLink = (
    <a
      href={USER_UI_SOURCE_URL}
      target='_blank'
      rel='noopener noreferrer'
      className={linkClassName}
    >
      {t('legal.sourceCode')}
    </a>
  )
  const licenseLink = (
    <a
      href={USER_UI_LICENSE_URL}
      target='_blank'
      rel='noopener noreferrer'
      className={linkClassName}
    >
      {USER_UI_LICENSE_NAME}
    </a>
  )

  if (variant === 'compact') {
    return (
      <p
        className={cn('text-muted-foreground text-xs', props.className)}
        data-testid='source-notice'
      >
        {sourceLink}
        <span aria-hidden='true'> · </span>
        {licenseLink}
      </p>
    )
  }

  return (
    <p
      className={cn(
        'text-muted-foreground text-xs leading-relaxed',
        props.className
      )}
      data-testid='source-notice'
    >
      {t('legal.notice', {
        siteName: systemName,
        upstream: UPSTREAM_PROJECT.name,
        holder: UPSTREAM_PROJECT.copyrightHolder,
      })}{' '}
      {sourceLink}
      <span aria-hidden='true'> · </span>
      {licenseLink}
    </p>
  )
}
