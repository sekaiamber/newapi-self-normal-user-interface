/*
 * [user-ui] 认证页品牌区（本仓库新增文件，非官方代码）。
 *
 * - AuthBrandMark：左上角 logo。后台未配置 Logo 时用 SwarmRouter 品牌标识（不裁圆）；
 *   站点名仍是默认名时直接用"图标 + 文字"横排标识。管理员自定义 Logo 保持官方原样式（圆形裁切）。
 * - AuthBrandPanel：宽屏左栏（审计 2.13 U1）。只写可核实的事实：
 *   接口格式与路径见官方文档 guide/feature-guide/user/api.md "Supported API Endpoints"，
 *   Bearer 鉴权见同页 "API Address and Authentication"，调用记录见 guide/feature-guide/user/log.md。
 *   面板固定用暗色 token（.dark 作用域），金色在近黑上对比度约 7:1。
 */
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { isDefaultLogo } from '@/assets/brand'
import { BrandIcon, BrandLogo } from '@/assets/brand-logo'
import { Skeleton } from '@/components/ui/skeleton'
import { useSystemConfig } from '@/hooks/use-system-config'
import { toOpenAiBaseUrl, useApiBaseUrl } from '@/lib/api-endpoint'
import { DEFAULT_SYSTEM_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

import { HoneycombMotif, HexBullet } from './honeycomb-motif'

type AuthBrandMarkProps = {
  className?: string
}

export function AuthBrandMark(props: AuthBrandMarkProps) {
  const { t } = useTranslation()
  const { systemName, logo, loading } = useSystemConfig()

  if (loading) {
    return (
      <div className={cn('flex items-center gap-2', props.className)}>
        <Skeleton className='size-8 rounded-lg' />
        <Skeleton className='h-6 w-28' />
      </div>
    )
  }

  const defaultLogo = isDefaultLogo(logo)
  const lockup = defaultLogo && systemName === DEFAULT_SYSTEM_NAME

  return (
    <Link
      to='/'
      aria-label={t('Go to home')}
      data-testid='auth-brand-mark'
      className={cn(
        'focus-visible:ring-ring inline-flex min-w-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        props.className
      )}
    >
      {lockup ? (
        <BrandLogo className='h-8 w-auto' alt={systemName} />
      ) : (
        <>
          {defaultLogo ? (
            <BrandIcon className='size-8 object-contain' alt={t('Logo')} />
          ) : (
            <img
              src={logo}
              alt={t('Logo')}
              className='size-8 rounded-full object-cover'
            />
          )}
          <span className='truncate text-xl font-semibold'>{systemName}</span>
        </>
      )}
    </Link>
  )
}

const API_PATHS = [
  '/v1/chat/completions',
  '/v1/responses',
  '/v1/messages',
  '/v1beta/models/…',
]

export function AuthBrandPanel(props: { className?: string }) {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const baseUrl = toOpenAiBaseUrl(useApiBaseUrl())

  const points = [
    {
      key: 'formats',
      title: t('auth.brand.formats.title'),
      body: t('auth.brand.formats.body'),
      extra: (
        <ul
          className='mt-2 flex flex-wrap gap-1.5'
          aria-label={t('auth.brand.formats.paths')}
        >
          {API_PATHS.map((p) => (
            <li
              key={p}
              className='border-edge-soft text-foreground rounded-md border-2 px-1.5 py-0.5 font-mono text-xs'
            >
              {p}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'key',
      title: t('auth.brand.key.title'),
      body: t('auth.brand.key.body'),
    },
    {
      key: 'logs',
      title: t('auth.brand.logs.title'),
      body: t('auth.brand.logs.body'),
    },
  ]

  return (
    <aside
      data-testid='auth-brand-panel'
      className={cn(
        // 固定暗色作用域：.dark 让面板内的 token 取暗色值（浅色主题下也是近黑品牌块）
        'dark bg-card text-card-foreground dark:border-edge relative isolate flex-col overflow-hidden border-e-2 border-transparent',
        props.className
      )}
    >
      {/* 底纹只在足够宽时显示，避免压到要点文字 */}
      <HoneycombMotif className='text-primary-ink pointer-events-none absolute -end-8 -bottom-16 -z-10 hidden w-[360px] xl:block' />
      <div className='flex flex-1 flex-col gap-12 p-10 xl:p-14'>
        <AuthBrandMark />
        <div className='my-auto max-w-md space-y-8'>
          <div className='space-y-4'>
            <p className='text-3xl leading-tight font-semibold tracking-tight whitespace-pre-line'>
              {t('auth.brand.headline')}
            </p>
            <p className='text-muted-foreground leading-relaxed'>
              {t('auth.brand.tagline', { siteName: systemName })}
            </p>
          </div>
          <div className='border-edge-soft bg-background rounded-lg border-2 px-3 py-2'>
            <p className='text-muted-foreground text-xs font-medium'>
              {t('auth.brand.baseUrl')}
            </p>
            <p
              className='font-mono text-sm break-all'
              data-testid='auth-brand-base-url'
            >
              {baseUrl}
            </p>
          </div>
          <ul className='space-y-5'>
            {points.map((point) => (
              <li key={point.key} className='flex gap-3'>
                <HexBullet className='text-primary-ink mt-1 size-4 shrink-0' />
                <div className='min-w-0'>
                  <p className='font-semibold'>{point.title}</p>
                  <p className='text-muted-foreground text-sm leading-relaxed'>
                    {point.body}
                  </p>
                  {point.extra}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}
