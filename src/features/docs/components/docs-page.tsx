/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 单个文档页：标题、正文、上一页 / 下一页，宽屏显示"本页目录"。
 */
import { useMemo } from 'react'

import { getDocContent } from '../content'
import { useDocPlaceholderValues } from '../hooks/use-doc-placeholders'
import { useDocsTranslation } from '../lib/i18n'
import { extractDocHeadings, stripLeadingComment } from '../lib/markdown'
import { applyDocPlaceholders } from '../lib/placeholders'
import { getDocPage, getDocSection } from '../lib/registry'
import { DocsArticle } from './docs-article'
import { DocsPager } from './docs-pager'
import { DocsShell } from './docs-shell'
import { DocsToc } from './docs-toc'

export function DocsPage(props: { slug: string }) {
  const { t } = useDocsTranslation()
  const values = useDocPlaceholderValues()
  const page = getDocPage(props.slug)
  const rawContent = getDocContent(props.slug) ?? ''

  const markdown = useMemo(
    () => applyDocPlaceholders(stripLeadingComment(rawContent), values),
    [rawContent, values]
  )
  const headings = useMemo(() => extractDocHeadings(markdown), [markdown])

  // The route guard rejects unknown slugs; this only satisfies the types.
  if (!page) return null
  const section = getDocSection(page.section)

  return (
    <DocsShell
      activeSlug={page.slug}
      aside={<DocsToc key={page.slug} headings={headings} />}
    >
      <article>
        <header className='mb-8 space-y-2 border-b pb-6'>
          <p className='text-primary text-sm font-medium'>
            {section ? t(section.titleKey) : t('Docs')}
          </p>
          <h1 className='text-3xl font-bold tracking-tight'>
            {t(page.titleKey)}
          </h1>
          <p className='text-muted-foreground'>{t(page.descriptionKey)}</p>
        </header>
        <DocsArticle markdown={markdown} headings={headings} />
      </article>
      <DocsPager slug={page.slug} />
    </DocsShell>
  )
}
