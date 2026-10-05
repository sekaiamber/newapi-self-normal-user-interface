/*
 * [user-ui] 文案中的行内代码切分（本仓库新增文件，非官方代码）。
 * 译文用反引号标出代码片段，例如 "请求 `GET /v1/models`"。
 */

export interface TextSegment {
  /** 片段序号（同一段文案内唯一） */
  id: number
  text: string
  code: boolean
}

/** 按反引号切分；落单的反引号（没有配对）按普通文字保留。 */
export function splitInlineCode(text: string): TextSegment[] {
  const parts = text.split('`')
  return parts.map((part, id) => {
    const insidePair = id % 2 === 1 && id < parts.length - 1
    const unpaired = id % 2 === 1 && !insidePair
    return { id, text: unpaired ? `\`${part}` : part, code: insidePair }
  })
}
