/*
 * [user-ui] 首页 Base URL 复制条（本仓库新增文件，非官方代码）。
 * 地址由调用方通过 lib/api-endpoint.ts 取得；复制交给共享的 CopyButton。
 */
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { cn } from '@/lib/utils'

interface BaseUrlBarProps {
  value: string
  className?: string
}

export function BaseUrlBar(props: BaseUrlBarProps) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        'border-edge bg-card flex min-w-0 items-stretch overflow-hidden rounded-lg border-2',
        props.className
      )}
    >
      <span className='border-edge bg-muted text-muted-foreground flex shrink-0 items-center border-r-2 px-3 font-mono text-xs font-semibold tracking-wider uppercase'>
        Base URL
      </span>
      <code
        className='min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-sm sm:text-base'
        title={props.value}
        data-testid='home-base-url'
      >
        {props.value}
      </code>
      <div className='flex items-center pr-1'>
        <CopyButton
          value={props.value}
          className='size-9'
          iconClassName='size-4'
          tooltip={t('home.hero.copyBaseUrl')}
          aria-label={t('home.hero.copyBaseUrl')}
        />
      </div>
    </div>
  )
}
