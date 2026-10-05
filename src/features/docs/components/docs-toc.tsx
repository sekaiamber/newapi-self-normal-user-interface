/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * "本页目录"：列出当前页的二、三级标题，并高亮当前阅读位置。
 */
import { useMemo, type MouseEvent } from 'react'

import { cn } from '@/lib/utils'

import {
  useActiveHeading,
  useScrollToHeading,
} from '../hooks/use-heading-navigation'
import { useDocsTranslation } from '../lib/i18n'
import type { DocHeading } from '../lib/markdown'

interface DocsTocProps {
  headings: DocHeading[]
}

export function DocsToc(props: DocsTocProps) {
  const { t } = useDocsTranslation()
  const ids = useMemo(
    () => props.headings.map((heading) => heading.id),
    [props.headings]
  )
  const activeId = useActiveHeading(ids)
  const scrollToHeading = useScrollToHeading()

  if (props.headings.length === 0) return null

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault()
    scrollToHeading(id)
  }

  return (
    <nav aria-label={t('On this page')} className='space-y-2 text-sm'>
      <p className='font-medium'>{t('On this page')}</p>
      <ul className='border-border space-y-1 border-l'>
        {props.headings.map((heading) => {
          const active = heading.id === activeId
          return (
            <li key={heading.id}>
              <a
                href={`#${encodeURIComponent(heading.id)}`}
                onClick={(event) => handleClick(event, heading.id)}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  '-ml-px block border-l py-1 leading-snug transition-colors',
                  heading.level === 3 ? 'pl-6' : 'pl-3',
                  active
                    ? 'border-primary text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                )}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
