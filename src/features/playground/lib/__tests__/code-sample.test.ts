/*
 * [user-ui] "查看代码"示例生成的测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import {
  buildPlaygroundCodeRequest,
  buildPlaygroundCurl,
  buildPlaygroundPython,
  CODE_SAMPLE_DEFAULT_PROMPT,
  getCodeSamplePrompt,
} from '..'
import { DEFAULT_CONFIG, DEFAULT_PARAMETER_ENABLED } from '../../constants'
import type { Message, ParameterEnabled } from '../../types'

function message(from: Message['from'], content: string): Message {
  return { key: `${from}-${content}`, from, versions: [{ id: 'v', content }] }
}

const NO_PARAMETERS: ParameterEnabled = {
  temperature: false,
  top_p: false,
  max_tokens: false,
  frequency_penalty: false,
  presence_penalty: false,
  seed: false,
}

describe('getCodeSamplePrompt', () => {
  it('uses the unsent draft when there is one', () => {
    expect(getCodeSamplePrompt('draft text', [message('user', 'old')])).toBe(
      'draft text'
    )
  })

  it('falls back to the latest user message when the draft is empty', () => {
    const messages = [
      message('user', 'first'),
      message('assistant', 'answer'),
      message('user', 'second'),
      message('assistant', 'answer 2'),
    ]

    expect(getCodeSamplePrompt('  ', messages)).toBe('second')
  })

  it('uses a short greeting when there is nothing to show', () => {
    expect(getCodeSamplePrompt('', [])).toBe(CODE_SAMPLE_DEFAULT_PROMPT)
  })
})

describe('buildPlaygroundCodeRequest', () => {
  it('drops the playground-only group and stream fields', () => {
    const request = buildPlaygroundCodeRequest(
      { ...DEFAULT_CONFIG, model: 'claude-sonnet-5', group: 'vip' },
      NO_PARAMETERS,
      'hi'
    )

    expect(request).toEqual({
      model: 'claude-sonnet-5',
      messages: [{ role: 'user', content: 'hi' }],
    })
  })

  it('includes only the parameters that are enabled', () => {
    const request = buildPlaygroundCodeRequest(
      { ...DEFAULT_CONFIG, model: 'm', temperature: 0.3, max_tokens: 256 },
      { ...NO_PARAMETERS, temperature: true },
      'hi'
    )

    expect(request.temperature).toBe(0.3)
    expect(request).not.toHaveProperty('max_tokens')
  })
})

describe('code samples', () => {
  const request = buildPlaygroundCodeRequest(
    { ...DEFAULT_CONFIG, model: 'claude-sonnet-5' },
    DEFAULT_PARAMETER_ENABLED,
    "it's fine"
  )

  it('builds a curl call to the shared /v1 endpoint with a key placeholder', () => {
    const curl = buildPlaygroundCurl('https://api.example.com/', request)

    expect(curl).toContain('curl https://api.example.com/v1/chat/completions')
    expect(curl).toContain('Authorization: Bearer YOUR_API_KEY')
    expect(curl).toContain(`"content": "it'\\''s fine"`)
    expect(curl).toContain('"temperature": 0.7')
  })

  it('builds an OpenAI SDK call with the /v1 base URL and keyword parameters', () => {
    const python = buildPlaygroundPython('https://api.example.com', request)

    expect(python).toContain('base_url="https://api.example.com/v1"')
    expect(python).toContain('model="claude-sonnet-5"')
    expect(python).toContain(`{"role": "user", "content": "it's fine"}`)
    expect(python).toContain('    temperature=0.7,')
    expect(python).not.toContain('group')
  })
})
