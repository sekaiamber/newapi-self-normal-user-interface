/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 文档 Markdown 的纯函数处理：去掉维护者注释、拆分代码块、提取标题目录。
 */

export type DocSegment =
  | { kind: 'prose'; line: number; markdown: string }
  | {
      kind: 'code'
      line: number
      markdown: string
      code: string
      language: string
    }

export interface DocHeading {
  id: string
  text: string
  level: 2 | 3
}

const LEADING_COMMENT_PATTERN = /^\s*<!--[\s\S]*?-->\s*/
const TOP_LEVEL_FENCE_PATTERN = /^(`{3,}|~{3,})(.*)$/
const ANY_FENCE_PATTERN = /^\s*(`{3,}|~{3,})/
const HEADING_PATTERN = /^(#{2,3})[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/

/** Remove the maintainer comment (official doc sources) at the top of a page. */
export function stripLeadingComment(markdown: string): string {
  return markdown.replace(LEADING_COMMENT_PATTERN, '')
}

function isClosingFence(line: string, marker: string): boolean {
  const trimmed = line.trimEnd()
  return (
    trimmed.length >= marker.length &&
    trimmed[0] === marker[0] &&
    /^(`+|~+)$/.test(trimmed)
  )
}

/**
 * Split Markdown into prose and top-level fenced code blocks, so code blocks
 * can be rendered with a copy button. Fences indented inside list items stay
 * in the prose segment.
 */
export function splitDocSegments(markdown: string): DocSegment[] {
  const segments: DocSegment[] = []
  const lines = markdown.split('\n')
  let prose: string[] = []
  let proseStart = 0

  const flushProse = () => {
    const text = prose.join('\n')
    if (text.trim()) {
      segments.push({ kind: 'prose', line: proseStart, markdown: text.trim() })
    }
    prose = []
  }

  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    const open = TOP_LEVEL_FENCE_PATTERN.exec(line)
    if (!open) {
      if (prose.length === 0) proseStart = index
      prose.push(line)
      index += 1
      continue
    }

    flushProse()
    const start = index
    const marker = open[1]
    const language = open[2].trim().split(/\s+/)[0] ?? ''
    const body: string[] = []
    const fenceLines = [line]
    index += 1
    while (index < lines.length && !isClosingFence(lines[index], marker)) {
      body.push(lines[index])
      fenceLines.push(lines[index])
      index += 1
    }
    if (index < lines.length) {
      fenceLines.push(lines[index])
      index += 1
    } else {
      fenceLines.push(marker)
    }

    segments.push({
      kind: 'code',
      line: start,
      markdown: fenceLines.join('\n'),
      code: body.join('\n'),
      language,
    })
  }

  flushProse()
  return segments
}

/** Plain text of an inline Markdown heading (links, code and emphasis removed). */
export function headingPlainText(source: string): string {
  return source
    .replaceAll(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/`([^`]*)`/g, '$1')
    .replaceAll(/(\*\*|__)(.+?)\1/g, '$2')
    .replaceAll(/(\*|_)(.+?)\1/g, '$2')
    .trim()
}

/** URL fragment for a heading; keeps CJK characters so Chinese titles work. */
export function slugifyHeading(text: string): string {
  const slug = text
    .trim()
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{N}\s-]/gu, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .replaceAll(/^-|-$/g, '')
  return slug || 'section'
}

/**
 * `##` and `###` headings outside code fences, in document order, with unique
 * ids. The rendered `h2`/`h3` elements receive these ids by position.
 */
export function extractDocHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = []
  const used = new Map<string, number>()
  let fenceMarker: string | null = null

  for (const line of markdown.split('\n')) {
    const fence = ANY_FENCE_PATTERN.exec(line)
    if (fence) {
      if (fenceMarker === null) {
        fenceMarker = fence[1]
      } else if (isClosingFence(line.trim(), fenceMarker)) {
        fenceMarker = null
      }
      continue
    }
    if (fenceMarker !== null) continue

    const match = HEADING_PATTERN.exec(line)
    if (!match) continue

    const text = headingPlainText(match[2])
    const base = slugifyHeading(text)
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    headings.push({
      id: count === 0 ? base : `${base}-${count}`,
      text,
      level: match[1].length === 2 ? 2 : 3,
    })
  }

  return headings
}
