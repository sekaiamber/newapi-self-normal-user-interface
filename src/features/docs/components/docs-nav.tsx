/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 文档左侧导航：按分区列出页面。桌面端固定在左栏，移动端放进抽屉。
 */
import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

import { useDocsTranslation } from '../lib/i18n'
import { getDocPage, getDocSectionGroups } from '../lib/registry'

const SECTION_GROUPS = getDocSectionGroups()

interface DocsNavProps {
  /** Current page slug; `undefined` on the docs overview. */
  activeSlug?: string
  /** Called after a link is chosen (closes the mobile drawer). */
  onNavigate?: () => void
}

function navLinkClassName(active: boolean): string {
  return cn(
    'block rounded-md px-2.5 py-1.5 text-sm transition-colors',
    active
      ? 'bg-muted text-foreground font-medium'
      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
  )
}

export function DocsNav(props: DocsNavProps) {
  const { t } = useDocsTranslation()

  return (
    <nav aria-label={t('Docs navigation')} className='space-y-6'>
      <Link
        to='/docs'
        onClick={props.onNavigate}
        aria-current={props.activeSlug ? undefined : 'page'}
        className={navLinkClassName(!props.activeSlug)}
      >
        {t('Overview')}
      </Link>
      {SECTION_GROUPS.map((group) => (
        <div key={group.section.id} className='space-y-1'>
          <p className='text-muted-foreground/80 px-2.5 text-xs font-medium tracking-wide'>
            {t(group.section.titleKey)}
          </p>
          <ul className='space-y-0.5'>
            {group.pages.map((page) => {
              const active = page.slug === props.activeSlug
              return (
                <li key={page.slug}>
                  <Link
                    to='/docs/$slug'
                    params={{ slug: page.slug }}
                    onClick={props.onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={navLinkClassName(active)}
                  >
                    {t(page.titleKey)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

/** Drawer trigger shown above the content below the `lg` breakpoint. */
export function DocsMobileNav(props: Pick<DocsNavProps, 'activeSlug'>) {
  const { t } = useDocsTranslation()
  const [open, setOpen] = useState(false)
  const current = props.activeSlug ? getDocPage(props.activeSlug) : undefined

  return (
    <div className='mb-6 lg:hidden'>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              variant='outline'
              size='sm'
              className='max-w-full justify-start gap-2'
            />
          }
        >
          <Menu className='size-4' />
          <span>{t('Docs menu')}</span>
          {current && (
            <span className='text-muted-foreground truncate'>
              / {t(current.titleKey)}
            </span>
          )}
        </SheetTrigger>
        <SheetContent side='left' className='w-72 gap-0'>
          <SheetHeader className='border-b'>
            <SheetTitle>{t('Docs')}</SheetTitle>
          </SheetHeader>
          <div className='flex-1 overflow-y-auto p-3'>
            <DocsNav
              activeSlug={props.activeSlug}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
