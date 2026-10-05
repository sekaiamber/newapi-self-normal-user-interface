/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 文档正文：用通用 Markdown 组件渲染，代码块附带复制按钮；
 * 为标题补上锚点 id，站内链接交给路由处理而不是打开新标签页。
 */
import { useRouter } from '@tanstack/react-router'
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type MouseEvent,
} from 'react'

import { CopyButton } from '@/components/copy-button'
import { Markdown } from '@/components/ui/markdown'
import { cn } from '@/lib/utils'

import { useScrollToHeading } from '../hooks/use-heading-navigation'
import { useDocsTranslation } from '../lib/i18n'
import { hashToId, resolveDocLink } from '../lib/links'
import { splitDocSegments, type DocHeading } from '../lib/markdown'

interface DocsArticleProps {
  /** Markdown with placeholders already replaced. */
  markdown: string
  /** Headings of `markdown`, in order; assigned to the rendered h2/h3. */
  headings: DocHeading[]
}

const HEADING_CLASS_NAME = '[&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24'
/** Restore heading spacing when a prose segment starts right after code. */
const FOLLOWING_SEGMENT_CLASS_NAME =
  '[&>h2:first-child]:mt-6 [&>h3:first-child]:mt-4'

function isModifiedClick(event: MouseEvent): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
}

interface DocsCodeBlockProps {
  markdown: string
  code: string
}

/*
 * The segment renderers are memoised: `Markdown` passes a fresh
 * `dangerouslySetInnerHTML` object on every render, and React then rewrites
 * `innerHTML`, which drops the heading ids set below and any text selection.
 */
const DocsCodeBlock = memo(function DocsCodeBlock(props: DocsCodeBlockProps) {
  const { t } = useDocsTranslation()

  return (
    <div className='relative'>
      <Markdown className='[&_pre]:my-0 [&_pre]:pr-12'>
        {props.markdown}
      </Markdown>
      <CopyButton
        value={props.code}
        size='icon'
        className='bg-background/80 absolute top-1.5 right-1.5 size-8 backdrop-blur'
        iconClassName='size-4'
        tooltip={t('Copy code')}
        successTooltip={t('Copied!')}
      />
    </div>
  )
})

const DocsProse = memo(function DocsProse(props: {
  markdown: string
  className: string
}) {
  return <Markdown className={props.className}>{props.markdown}</Markdown>
})

export function DocsArticle(props: DocsArticleProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const scrollToHeading = useScrollToHeading()
  const segments = useMemo(
    () => splitDocSegments(props.markdown),
    [props.markdown]
  )

  // Give rendered headings the ids listed in the table of contents. Runs after
  // every commit, so ids survive any re-render that rewrites the HTML.
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.querySelectorAll('h2, h3').forEach((element, index) => {
      const heading = props.headings[index]
      if (heading && element.id !== heading.id) element.id = heading.id
    })
  })

  // Honour a hash in the URL once the ids exist (direct links, cross-page links).
  useEffect(() => {
    const id = hashToId(window.location.hash)
    if (id) document.getElementById(id)?.scrollIntoView({ block: 'start' })
  }, [segments])

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || isModifiedClick(event)) return
    const anchor = (event.target as Element).closest('a')
    const href = anchor?.getAttribute('href')
    if (!anchor || !href) return

    const target = resolveDocLink(href, window.location.origin)
    if (target.kind === 'external') return

    event.preventDefault()
    if (target.kind === 'hash') {
      scrollToHeading(target.id)
      return
    }
    void router.navigate({ href: target.href })
  }

  return (
    // Click delegation only: every interactive element inside is a real link.
    <div
      ref={containerRef}
      onClick={handleClick}
      className='flex flex-col gap-4'
    >
      {segments.map((segment, index) =>
        segment.kind === 'code' ? (
          <DocsCodeBlock
            key={`code-${segment.line}`}
            markdown={segment.markdown}
            code={segment.code}
          />
        ) : (
          <DocsProse
            key={`prose-${segment.line}`}
            markdown={segment.markdown}
            className={cn(
              HEADING_CLASS_NAME,
              index > 0 && FOLLOWING_SEGMENT_CLASS_NAME
            )}
          />
        )
      )}
    </div>
  )
}
