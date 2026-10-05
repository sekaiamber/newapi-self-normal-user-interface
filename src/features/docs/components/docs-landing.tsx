/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 文档首页：站点 API 地址 + 按分区排列的页面卡片。
 */
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  Braces,
  KeyRound,
  LifeBuoy,
  MonitorSmartphone,
  Rocket,
  type LucideIcon,
} from 'lucide-react'

import { CopyButton } from '@/components/copy-button'
import { Card, CardContent } from '@/components/ui/card'

import { useDocPlaceholderValues } from '../hooks/use-doc-placeholders'
import { useDocsTranslation } from '../lib/i18n'
import { getDocSectionGroups } from '../lib/registry'
import { DocsShell } from './docs-shell'

const SECTION_GROUPS = getDocSectionGroups()

const PAGE_ICONS: Readonly<Record<string, LucideIcon>> = {
  'quick-start': Rocket,
  'api-basics': Braces,
  'tokens-and-quota': KeyRound,
  clients: MonitorSmartphone,
  faq: LifeBuoy,
}

function BaseUrlRow(props: { value: string }) {
  const { t } = useDocsTranslation()

  return (
    <div className='bg-muted/50 flex min-w-0 items-center gap-2 rounded-md border py-1 pr-1 pl-3'>
      <code className='min-w-0 flex-1 truncate font-mono text-sm'>
        {props.value}
      </code>
      <CopyButton
        value={props.value}
        size='icon'
        className='size-8'
        iconClassName='size-4'
        tooltip={t('Copy to clipboard')}
        successTooltip={t('Copied!')}
      />
    </div>
  )
}

export function DocsLanding() {
  const { t } = useDocsTranslation()
  const values = useDocPlaceholderValues()

  return (
    <DocsShell>
      <header className='mb-8 space-y-3'>
        <p className='text-primary flex items-center gap-2 text-sm font-medium'>
          <BookOpen className='size-4' />
          {t('Docs')}
        </p>
        <h1 className='text-3xl font-bold tracking-tight break-words'>
          {t('{{siteName}} Docs', { siteName: values.siteName })}
        </h1>
        <p className='text-muted-foreground max-w-2xl'>
          {t(
            'Learn how to call the API, manage API keys and quota, and connect your clients.'
          )}
        </p>
      </header>

      <Card className='mb-10'>
        <CardContent className='space-y-3'>
          <p className='font-medium'>{t('Your API base URL')}</p>
          <div className='grid gap-2 sm:grid-cols-2'>
            <BaseUrlRow value={`${values.baseUrl}/v1`} />
            <BaseUrlRow value={values.baseUrl} />
          </div>
          <p className='text-muted-foreground text-sm'>
            {t(
              'OpenAI-compatible clients use the /v1 address; Claude and Gemini native clients use the site root.'
            )}
          </p>
        </CardContent>
      </Card>

      <div className='space-y-10'>
        {SECTION_GROUPS.map((group) => (
          <section key={group.section.id} className='space-y-3'>
            <h2 className='text-lg font-semibold'>
              {t(group.section.titleKey)}
            </h2>
            <div className='grid gap-3 sm:grid-cols-2'>
              {group.pages.map((page) => {
                const Icon = PAGE_ICONS[page.slug] ?? BookOpen
                return (
                  <Link
                    key={page.slug}
                    to='/docs/$slug'
                    params={{ slug: page.slug }}
                    className='group hover:border-primary/40 hover:bg-muted/40 flex gap-3 rounded-xl border p-4 transition-colors'
                  >
                    <span className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg'>
                      <Icon className='size-4' />
                    </span>
                    <span className='min-w-0 flex-1 space-y-1'>
                      <span className='flex items-center gap-1 font-medium'>
                        {t(page.titleKey)}
                        <ArrowRight className='text-muted-foreground size-3.5 transition-transform group-hover:translate-x-0.5' />
                      </span>
                      <span className='text-muted-foreground block text-sm'>
                        {t(page.descriptionKey)}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </DocsShell>
  )
}
