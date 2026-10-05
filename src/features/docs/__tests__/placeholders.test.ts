/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import {
  applyDocPlaceholders,
  resolveDocPlaceholderValues,
} from '../lib/placeholders'

describe('applyDocPlaceholders', () => {
  const values = { siteName: 'SwarmRouter', baseUrl: 'https://api.example.com' }

  it('replaces every occurrence of both placeholders', () => {
    const markdown = [
      '# {{SITE_NAME}}',
      'Base URL: {{BASE_URL}}/v1',
      '```bash',
      'curl {{BASE_URL}}/v1/models # {{SITE_NAME}}',
      '```',
    ].join('\n')

    expect(applyDocPlaceholders(markdown, values)).toBe(
      [
        '# SwarmRouter',
        'Base URL: https://api.example.com/v1',
        '```bash',
        'curl https://api.example.com/v1/models # SwarmRouter',
        '```',
      ].join('\n')
    )
  })

  it('leaves other double-brace text untouched', () => {
    expect(applyDocPlaceholders('{{OTHER}} {{ SITE_NAME }}', values)).toBe(
      '{{OTHER}} {{ SITE_NAME }}'
    )
  })

  it('does not reinterpret replacement patterns in values', () => {
    expect(
      applyDocPlaceholders('{{SITE_NAME}}', {
        siteName: '$& $1',
        baseUrl: '',
      })
    ).toBe('$& $1')
  })
})

describe('resolveDocPlaceholderValues', () => {
  const page = { origin: 'https://ai.example.com', hostname: 'ai.example.com' }

  it('uses the configured system name, trimmed', () => {
    expect(
      resolveDocPlaceholderValues({ ...page, systemName: '  SwarmRouter ' })
    ).toEqual({ siteName: 'SwarmRouter', baseUrl: 'https://ai.example.com' })
  })

  it.each([undefined, null, '', '   ', 42])(
    'falls back to the host name when system_name is %j',
    (systemName) => {
      expect(
        resolveDocPlaceholderValues({ ...page, systemName }).siteName
      ).toBe('ai.example.com')
    }
  )

  it('strips trailing slashes from the base URL', () => {
    expect(
      resolveDocPlaceholderValues({
        systemName: 'X',
        origin: 'http://localhost:3001/',
        hostname: 'localhost',
      }).baseUrl
    ).toBe('http://localhost:3001')
  })

  it.each([
    ['http://localhost:3000', 'http://localhost:3000'],
    ['https://api.example.com/', 'https://api.example.com'],
    ['  https://api.example.com//  ', 'https://api.example.com'],
    ['https://example.com/gateway/', 'https://example.com/gateway'],
  ])(
    'prefers server_address %j for the base URL',
    (serverAddress, expected) => {
      expect(
        resolveDocPlaceholderValues({ ...page, serverAddress }).baseUrl
      ).toBe(expected)
    }
  )

  it.each([
    undefined,
    null,
    '',
    '   ',
    'api.example.com',
    'ftp://x.example',
    7,
  ])(
    'falls back to the page origin when server_address is %j',
    (serverAddress) => {
      expect(
        resolveDocPlaceholderValues({ ...page, serverAddress }).baseUrl
      ).toBe('https://ai.example.com')
    }
  )

  it('keeps the site name independent of server_address', () => {
    expect(
      resolveDocPlaceholderValues({
        ...page,
        serverAddress: 'https://api.example.com',
      }).siteName
    ).toBe('ai.example.com')
  })
})
