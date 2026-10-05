/*
 * [user-ui] 首页各区块的标题（本仓库新增文件，非官方代码）。
 * 等宽小标题（带金色六边形符号）+ 粗标题 + 说明。
 */
import { cn } from '@/lib/utils'

import { HexBadge } from './honeycomb'

interface SectionHeadingProps {
  id: string
  eyebrow: string
  title: string
  description?: string
  className?: string
}

export function SectionHeading(props: SectionHeadingProps) {
  return (
    <div className={cn('max-w-2xl', props.className)}>
      <p className='text-primary-ink flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.14em] uppercase'>
        <HexBadge className='size-3.5' />
        {props.eyebrow}
      </p>
      <h2
        id={props.id}
        className='mt-4 text-3xl leading-tight font-bold tracking-tight text-balance md:text-4xl'
      >
        {props.title}
      </h2>
      {props.description && (
        <p className='text-muted-foreground mt-4 text-base leading-relaxed'>
          {props.description}
        </p>
      )}
    </div>
  )
}
