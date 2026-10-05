/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 文档页面骨架：左侧导航（lg 以上）、正文、右侧"本页目录"（xl 以上，可选）。
 */
import type { ReactNode } from 'react'

import { PublicLayout } from '@/components/layout'
import { cn } from '@/lib/utils'

import { DocsMobileNav, DocsNav } from './docs-nav'

interface DocsShellProps {
  activeSlug?: string
  /** Optional right column, e.g. the table of contents. */
  aside?: ReactNode
  children: ReactNode
}

export function DocsShell(props: DocsShellProps) {
  return (
    <PublicLayout>
      <div
        className={cn(
          'mx-auto w-full max-w-7xl lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10',
          props.aside && 'xl:grid-cols-[13rem_minmax(0,1fr)_13rem]'
        )}
      >
        <aside className='hidden lg:block'>
          <div className='sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto pb-8'>
            <DocsNav activeSlug={props.activeSlug} />
          </div>
        </aside>

        <div className='min-w-0 pb-16'>
          <DocsMobileNav activeSlug={props.activeSlug} />
          {props.children}
        </div>

        {props.aside && (
          <aside className='hidden xl:block'>
            <div className='sticky top-24 max-h-[calc(100svh-7rem)] overflow-y-auto pb-8'>
              {props.aside}
            </div>
          </aside>
        )}
      </div>
    </PublicLayout>
  )
}
