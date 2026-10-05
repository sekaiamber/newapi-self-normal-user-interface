/*
 * [user-ui] 接口地址工具测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import {
  buildChatCurl,
  resolveApiBaseUrl,
  toChatCompletionsEndpoint,
  toOpenAiBaseUrl,
} from '../api-endpoint'

describe('resolveApiBaseUrl', () => {
  it('uses the admin server address when it is an http(s) URL', () => {
    expect(
      resolveApiBaseUrl('https://api.example.com/', 'https://app.example.com')
    ).toBe('https://api.example.com')
  })

  it('strips a trailing /v1 from the server address', () => {
    expect(resolveApiBaseUrl('https://api.example.com/v1/', 'x')).toBe(
      'https://api.example.com'
    )
  })

  it('falls back to the page origin when the server address is empty or invalid', () => {
    for (const value of ['', '   ', 'api.example.com', undefined, null, 42]) {
      expect(resolveApiBaseUrl(value, 'https://app.example.com')).toBe(
        'https://app.example.com'
      )
    }
  })
})

describe('endpoint builders', () => {
  it('builds the OpenAI base URL and chat completions endpoint without double slashes', () => {
    expect(toOpenAiBaseUrl('https://a.example.com/')).toBe(
      'https://a.example.com/v1'
    )
    expect(toChatCompletionsEndpoint('https://a.example.com')).toBe(
      'https://a.example.com/v1/chat/completions'
    )
  })

  it('builds a curl command whose body survives single quotes in the prompt', () => {
    const curl = buildChatCurl({
      apiBaseUrl: 'https://a.example.com',
      apiKey: 'sk-test',
      model: 'gpt-x',
      prompt: "it's",
    })

    expect(curl).toContain('curl https://a.example.com/v1/chat/completions')
    expect(curl).toContain('Authorization: Bearer sk-test')
    expect(curl).toContain(`it'\\''s`)
  })
})
