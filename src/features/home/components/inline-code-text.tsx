/*
 * [user-ui] 把文案里用反引号包住的片段渲染成行内代码（本仓库新增文件，非官方代码）。
 * 译文保持纯字符串（例如 "请求 `GET /v1/models`"），不需要 <Trans> 组件。
 */
import { Fragment } from 'react'

import { cn } from '@/lib/utils'

import { splitInlineCode } from '../lib/inline-code'

export function InlineCodeText(props: { text: string; className?: string }) {
  return (
    <>
      {splitInlineCode(props.text).map((segment) =>
        segment.code ? (
          <code
            key={segment.id}
            className={cn(
              'bg-muted text-foreground rounded-sm px-1 py-0.5 font-mono text-[0.85em] break-words',
              props.className
            )}
          >
            {segment.text}
          </code>
        ) : (
          <Fragment key={segment.id}>{segment.text}</Fragment>
        )
      )}
    </>
  )
}
