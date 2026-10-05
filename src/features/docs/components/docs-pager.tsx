/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 正文底部的上一页 / 下一页。
 */
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { useDocsTranslation } from '../lib/i18n'
import { getAdjacentDocPages } from '../lib/registry'

const CARD_CLASS_NAME =
  'hover:border-primary/40 hover:bg-muted/40 flex min-w-0 flex-col gap-1 rounded-lg border p-4 transition-colors'

export function DocsPager(props: { slug: string }) {
  const { t } = useDocsTranslation()
  const adjacent = getAdjacentDocPages(props.slug)

  if (!adjacent.previous && !adjacent.next) return null

  return (
    <nav
      aria-label={`${t('Previous page')} / ${t('Next page')}`}
      className='mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2'
    >
      {adjacent.previous ? (
        <Link
          to='/docs/$slug'
          params={{ slug: adjacent.previous.slug }}
          rel='prev'
          className={CARD_CLASS_NAME}
        >
          <span className='text-muted-foreground flex items-center gap-1 text-xs'>
            <ChevronLeft className='size-3.5' />
            {t('Previous page')}
          </span>
          <span className='truncate font-medium'>
            {t(adjacent.previous.titleKey)}
          </span>
        </Link>
      ) : (
        <span className='hidden sm:block' />
      )}
      {adjacent.next && (
        <Link
          to='/docs/$slug'
          params={{ slug: adjacent.next.slug }}
          rel='next'
          className={`${CARD_CLASS_NAME} items-end text-right`}
        >
          <span className='text-muted-foreground flex items-center gap-1 text-xs'>
            {t('Next page')}
            <ChevronRight className='size-3.5' />
          </span>
          <span className='max-w-full truncate font-medium'>
            {t(adjacent.next.titleKey)}
          </span>
        </Link>
      )}
    </nav>
  )
}
