/*
 * [user-ui] 首页"兼容格式"区块（本仓库新增文件，非官方代码）。
 * 四张卡片：接口路径、认证方式、客户端填写的地址。数据与出处见 ../../lib/api-formats.ts。
 */
import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toOpenAiBaseUrl, useApiBaseUrl } from '@/lib/api-endpoint'

import {
  API_FORMAT_FAMILY_KEYS,
  API_FORMATS,
  splitPathForWrapping,
  type ApiFormat,
} from '../../lib/api-formats'
import { SectionHeading } from '../section-heading'

function FormatCard(props: { format: ApiFormat; apiBaseUrl: string }) {
  const { t } = useTranslation()
  const format = props.format
  const clientBase =
    format.clientBase === 'v1'
      ? toOpenAiBaseUrl(props.apiBaseUrl)
      : props.apiBaseUrl

  return (
    <Card className='h-full gap-3' data-card-hover='false'>
      <CardHeader className='gap-1.5'>
        <p className='text-primary-ink font-mono text-xs font-semibold'>
          {t(API_FORMAT_FAMILY_KEYS[format.family])}
        </p>
        <CardTitle className='text-lg'>{format.name}</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        <p className='border-edge-soft bg-muted flex items-start gap-2 rounded-md border-2 px-2.5 py-2 font-mono text-xs leading-5'>
          <span className='bg-foreground text-background shrink-0 rounded-sm px-1 font-bold'>
            {format.method}
          </span>
          <span className='min-w-0 break-words'>
            {splitPathForWrapping(format.path).map((segment) => (
              <Fragment key={segment.offset}>
                {segment.text}
                <wbr />
              </Fragment>
            ))}
          </span>
        </p>
        <dl className='grid gap-3 text-sm'>
          <div>
            <dt className='text-muted-foreground text-xs'>
              {t('home.formats.auth')}
            </dt>
            <dd className='mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1'>
              {format.auth.map((auth, index) => (
                <Fragment key={auth}>
                  {index > 0 && (
                    <span className='text-muted-foreground text-xs'>
                      {t('home.formats.or')}
                    </span>
                  )}
                  <code className='font-mono text-xs'>{auth}</code>
                </Fragment>
              ))}
            </dd>
          </div>
          {format.requiredHeader && (
            <div>
              <dt className='text-muted-foreground text-xs'>
                {t('home.formats.requiredHeader')}
              </dt>
              <dd className='mt-1'>
                <code className='font-mono text-xs'>
                  {format.requiredHeader}
                </code>
              </dd>
            </div>
          )}
          <div>
            <dt className='text-muted-foreground text-xs'>
              {t('home.formats.clientBase')}
            </dt>
            <dd className='mt-1 font-mono text-xs break-words'>{clientBase}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}

export function ApiFormats() {
  const { t } = useTranslation()
  const apiBaseUrl = useApiBaseUrl()

  return (
    <section
      aria-labelledby='home-formats-title'
      className='border-edge-soft bg-card border-b-2'
    >
      <div className='mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8'>
        <SectionHeading
          id='home-formats-title'
          eyebrow={t('home.formats.eyebrow')}
          title={t('home.formats.title')}
          description={t('home.formats.description')}
        />
        <ul className='mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {API_FORMATS.map((format) => (
            <li key={format.id}>
              <FormatCard format={format} apiBaseUrl={apiBaseUrl} />
            </li>
          ))}
        </ul>
        <div className='mt-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4'>
          <p className='text-muted-foreground text-sm'>
            {t('home.formats.more')}
          </p>
          <Button
            variant='link'
            className='h-auto self-start px-0 sm:self-auto'
            render={<Link to='/docs/$slug' params={{ slug: 'api-basics' }} />}
          >
            {t('home.formats.moreLink')}
            <ArrowRight data-icon='inline-end' />
          </Button>
        </div>
      </div>
    </section>
  )
}
