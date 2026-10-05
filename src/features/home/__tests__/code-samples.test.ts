/*
 * [user-ui] 首页代码示例与极简高亮的测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import { buildCodeSamples, tokenizeCodeLine } from '../lib/code-samples'

const COMMENTS = {
  setKey: '# key',
  listModels: '# models',
  chat: '# chat',
}

describe('buildCodeSamples', () => {
  it('points every sample at the site /v1 base URL without doubling /v1', () => {
    const samples = buildCodeSamples('https://api.example.com/v1/', COMMENTS)

    expect(samples.map((sample) => sample.id)).toEqual([
      'curl',
      'python',
      'node',
    ])
    const curl = samples[0].code
    expect(curl).toContain('curl https://api.example.com/v1/models \\')
    expect(curl).toContain('https://api.example.com/v1/chat/completions')
    expect(curl).not.toContain('/v1/v1')
    expect(samples[1].code).toContain('base_url="https://api.example.com/v1"')
    expect(samples[2].code).toContain('baseURL: "https://api.example.com/v1"')
  })

  it('reads the key from the API_KEY environment variable instead of embedding one', () => {
    const samples = buildCodeSamples('https://api.example.com', COMMENTS)

    expect(samples[0].code).toContain('Authorization: Bearer $API_KEY')
    expect(samples[1].code).toContain('os.environ["API_KEY"]')
    expect(samples[2].code).toContain('process.env.API_KEY')
  })

  it('puts the translated comments above the curl commands', () => {
    const lines = buildCodeSamples(
      'https://api.example.com',
      COMMENTS
    )[0].code.split('\n')

    expect(lines[0]).toBe('# key')
    expect(lines).toContain('# models')
    expect(lines).toContain('# chat')
  })
})

describe('tokenizeCodeLine', () => {
  it('marks quoted literals as strings and keeps the rest plain', () => {
    expect(
      tokenizeCodeLine('  -H "Authorization: Bearer $API_KEY" \\')
    ).toEqual([
      { offset: 0, text: '  -H ', kind: 'plain' },
      { offset: 5, text: '"Authorization: Bearer $API_KEY"', kind: 'string' },
      { offset: 37, text: ' \\', kind: 'plain' },
    ])
  })

  it('treats a whole line starting with # as a comment', () => {
    expect(tokenizeCodeLine('# 查询可用的模型')).toEqual([
      { offset: 0, text: '# 查询可用的模型', kind: 'comment' },
    ])
  })

  it('returns no tokens for an empty line', () => {
    expect(tokenizeCodeLine('')).toEqual([])
  })
})
