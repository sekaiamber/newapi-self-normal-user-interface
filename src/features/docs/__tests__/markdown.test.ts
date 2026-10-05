/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import {
  extractDocHeadings,
  headingPlainText,
  slugifyHeading,
  splitDocSegments,
  stripLeadingComment,
} from '../lib/markdown'

describe('stripLeadingComment', () => {
  it('removes only the leading maintainer comment', () => {
    expect(
      stripLeadingComment('<!--\nsources\n-->\n\nText <!-- keep -->')
    ).toBe('Text <!-- keep -->')
  })

  it('returns content without a comment unchanged', () => {
    expect(stripLeadingComment('## Title')).toBe('## Title')
  })
})

describe('splitDocSegments', () => {
  it('separates prose from top-level fenced code', () => {
    const markdown = [
      'Intro',
      '',
      '```bash title',
      'curl "$BASE_URL/v1/models"',
      '',
      'echo done',
      '```',
      '',
      '## Next',
    ].join('\n')

    expect(splitDocSegments(markdown)).toEqual([
      { kind: 'prose', line: 0, markdown: 'Intro' },
      {
        kind: 'code',
        line: 2,
        language: 'bash',
        code: 'curl "$BASE_URL/v1/models"\n\necho done',
        markdown: '```bash title\ncurl "$BASE_URL/v1/models"\n\necho done\n```',
      },
      { kind: 'prose', line: 7, markdown: '## Next' },
    ])
  })

  it('handles tilde fences, longer closing fences and missing languages', () => {
    const segments = splitDocSegments('~~~\na\n~~~~\n```\nb\n````')
    expect(segments.map((segment) => segment.kind)).toEqual(['code', 'code'])
    expect(segments[0]).toMatchObject({ code: 'a', language: '' })
    expect(segments[1]).toMatchObject({ code: 'b', language: '' })
  })

  it('does not close a fence on a line with an info string', () => {
    const [segment] = splitDocSegments('```md\n```js\nx\n```')
    expect(segment).toMatchObject({ kind: 'code', code: '```js\nx' })
  })

  it('treats an unclosed fence as code until the end', () => {
    const segments = splitDocSegments('text\n```json\n{"a": 1}')
    expect(segments[1]).toMatchObject({
      kind: 'code',
      code: '{"a": 1}',
      markdown: '```json\n{"a": 1}\n```',
    })
  })

  it('keeps fences nested in list items inside the prose segment', () => {
    const markdown = '1. Step\n\n   ```bash\n   ls\n   ```\n2. Next'
    expect(splitDocSegments(markdown)).toEqual([
      { kind: 'prose', line: 0, markdown },
    ])
  })
})

describe('headings', () => {
  it('strips inline Markdown from heading text', () => {
    expect(headingPlainText('Use `curl` with **care** and [docs](/x)')).toBe(
      'Use curl with care and docs'
    )
  })

  it('creates fragment ids that keep Chinese characters', () => {
    expect(slugifyHeading('第 1 步：注册并登录')).toBe('第-1-步注册并登录')
    expect(slugifyHeading('Chat Completions（OpenAI 兼容）')).toBe(
      'chat-completionsopenai-兼容'
    )
    expect(slugifyHeading('请求过于频繁（429）')).toBe('请求过于频繁429')
    expect(slugifyHeading('!!!')).toBe('section')
  })

  it('extracts h2 and h3 outside code fences with unique ids', () => {
    const markdown = [
      '# Title',
      '## 安装',
      '```bash',
      '## not a heading',
      '```',
      '### 安装',
      '## CC Switch ##',
      '#### too deep',
    ].join('\n')

    expect(extractDocHeadings(markdown)).toEqual([
      { id: '安装', text: '安装', level: 2 },
      { id: '安装-1', text: '安装', level: 3 },
      { id: 'cc-switch', text: 'CC Switch', level: 2 },
    ])
  })
})
