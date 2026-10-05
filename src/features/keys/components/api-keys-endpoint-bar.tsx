/*
 * [user-ui] 密钥页顶部的接口地址条（本仓库新增文件，非官方代码）。
 *
 * 审计 2.5 K1：/keys 页原本完全不显示 Base URL。这里显示 OpenAI 兼容的接口地址
 * （useApiBaseUrl + toOpenAiBaseUrl，全站统一取法）并可复制，旁边链接到站内接入文档。
 */
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { toOpenAiBaseUrl, useApiBaseUrl } from '@/lib/api-endpoint'

export function ApiKeysEndpointBar() {
  const { t } = useTranslation()
  const baseUrl = toOpenAiBaseUrl(useApiBaseUrl())

  return (
    <div
      data-slot='api-keys-endpoint-bar'
      className='border-edge-soft bg-card flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border-2 py-1 pr-1 pl-3'
    >
      <span className='text-muted-foreground shrink-0 text-xs font-semibold'>
        {t('keys.page.baseUrlLabel')}
      </span>
      {/* 窄屏时地址单独占一行，避免被截成 "http:…" */}
      <div className='order-last flex min-w-0 basis-full items-center gap-1 sm:order-none sm:flex-1 sm:basis-auto'>
        <code className='min-w-0 truncate font-mono text-sm' title={baseUrl}>
          {baseUrl}
        </code>
        <CopyButton
          value={baseUrl}
          className='size-8'
          iconClassName='size-3.5'
          tooltip={t('keys.page.copyBaseUrl')}
          aria-label={t('keys.page.copyBaseUrl')}
        />
      </div>
      <Link
        to='/docs/$slug'
        params={{ slug: 'clients' }}
        className='text-primary-ink ml-auto inline-flex shrink-0 items-center gap-1 px-2 py-1 text-sm font-semibold underline-offset-4 hover:underline'
      >
        {t('keys.page.howToConnect')}
        <ArrowRight className='size-3.5' aria-hidden='true' />
      </Link>
    </div>
  )
}
