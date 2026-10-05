/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import { hashToId, resolveDocLink } from '../lib/links'

const origin = 'https://ai.example.com'

describe('resolveDocLink', () => {
  it('treats fragments as in-page heading links', () => {
    expect(
      resolveDocLink('#%E6%B5%81%E5%BC%8F%E8%BE%93%E5%87%BA', origin)
    ).toEqual({ kind: 'hash', id: '流式输出' })
  })

  it('routes same-origin links inside the app', () => {
    expect(resolveDocLink('/docs/faq#429', origin)).toEqual({
      kind: 'internal',
      href: '/docs/faq#429',
    })
    expect(resolveDocLink('https://ai.example.com/keys?x=1', origin)).toEqual({
      kind: 'internal',
      href: '/keys?x=1',
    })
  })

  it('leaves other origins and schemes alone', () => {
    expect(resolveDocLink('https://github.com/x', origin).kind).toBe('external')
    expect(resolveDocLink('mailto:a@b.c', origin).kind).toBe('external')
    expect(resolveDocLink('http://ai.example.com/', origin).kind).toBe(
      'external'
    )
  })
})

describe('hashToId', () => {
  it('decodes percent-encoded hashes and tolerates malformed ones', () => {
    expect(hashToId('#cc-switch')).toBe('cc-switch')
    expect(hashToId('%E5%AE%89%E8%A3%85')).toBe('安装')
    expect(hashToId('#%E0%A4%A')).toBe('%E0%A4%A')
    expect(hashToId('')).toBe('')
  })
})
