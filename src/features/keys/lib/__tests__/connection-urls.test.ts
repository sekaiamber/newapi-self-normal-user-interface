/*
 * [user-ui] CC Switch 深链与"接口地址和密钥"文本（本仓库新增文件，非官方代码）。
 */
import { describe, expect, test } from 'vitest'

import { buildCCSwitchURL } from '../cc-switch-url'
import { formatBaseUrlAndKey } from '../connection-text'

function params(url: string): URLSearchParams {
  expect(url.startsWith('ccswitch://v1/import?')).toBe(true)
  return new URLSearchParams(url.slice('ccswitch://v1/import?'.length))
}

describe('buildCCSwitchURL', () => {
  test('keeps the official parameters and uses the site root for Claude Code', () => {
    const result = params(
      buildCCSwitchURL(
        'https://api.example.com',
        'claude',
        'My Claude',
        { model: 'claude-sonnet', haikuModel: '' },
        'sk-test'
      )
    )
    expect(Object.fromEntries(result)).toEqual({
      resource: 'provider',
      app: 'claude',
      name: 'My Claude',
      endpoint: 'https://api.example.com',
      apiKey: 'sk-test',
      model: 'claude-sonnet',
      homepage: 'https://api.example.com',
      enabled: 'true',
    })
  })

  test('appends /v1 for Codex without doubling slashes', () => {
    const result = params(
      buildCCSwitchURL(
        'https://api.example.com/',
        'codex',
        'My Codex',
        { model: 'm' },
        'sk-test'
      )
    )
    expect(result.get('endpoint')).toBe('https://api.example.com/v1')
  })
})

describe('formatBaseUrlAndKey', () => {
  test('writes the OpenAI-compatible Base URL and the key on two lines', () => {
    expect(formatBaseUrlAndKey('https://api.example.com', 'sk-test')).toBe(
      'Base URL: https://api.example.com/v1\nAPI Key: sk-test'
    )
  })
})
