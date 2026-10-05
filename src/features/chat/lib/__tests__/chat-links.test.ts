/*
 * [user-ui] 聊天应用一键导入链接（本仓库新增文件，非官方代码）。
 * 保护两点：第三方客户端识别用的 id/platform "new-api" 不变；AQBot 显示名不再写死 "New API"。
 */
import { afterEach, describe, expect, test } from 'vitest'

import { useSystemConfigStore } from '@/stores/system-config-store'

import { isCcSwitchPreset, resolveChatUrl } from '../chat-links'

function decodePayload(url: string, placeholderPrefix: string): unknown {
  const encoded = url.slice(placeholderPrefix.length)
  return JSON.parse(atob(decodeURIComponent(encoded)))
}

const originalSystemName = useSystemConfigStore.getState().config.systemName

afterEach(() => {
  useSystemConfigStore.getState().setConfig({ systemName: originalSystemName })
})

describe('resolveChatUrl', () => {
  test('keeps the Cherry Studio provider id used by the client import', () => {
    const prefix = 'cherrystudio://providers/api-keys?v=1&data='
    const url = resolveChatUrl({
      template: `${prefix}{cherryConfig}`,
      apiKey: 'abc',
      serverAddress: 'https://api.example.com',
    })
    expect(decodePayload(url, prefix)).toEqual({
      id: 'new-api',
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-abc',
    })
  })

  test('names the AQBot provider after the site instead of New API', () => {
    useSystemConfigStore.getState().setConfig({ systemName: 'SwarmRouter' })
    const url = resolveChatUrl({
      template: 'aqbot://providers?{aqbotConfig}',
      apiKey: 'sk-abc',
      serverAddress: 'https://api.example.com',
    })
    const query = new URLSearchParams(url.slice('aqbot://providers?'.length))
    expect(query.get('name')).toBe('SwarmRouter')
    expect(query.get('type')).toBe('openai')
    expect(url).not.toContain('New%20API')
  })

  test('prefers an explicit provider name', () => {
    const url = resolveChatUrl({
      template: 'aqbot://providers?{aqbotConfig}',
      apiKey: 'sk-abc',
      serverAddress: 'https://api.example.com',
      providerName: 'Acme Gateway',
    })
    expect(url).toContain('name=Acme%20Gateway')
  })
})

describe('isCcSwitchPreset', () => {
  test.each([
    ['ccswitch', true],
    [' CCSwitch ', true],
    ['ccswitch://v1/import', false],
    ['https://chat.example.com', false],
  ])('treats %j as the CC Switch shortcut: %s', (url, expected) => {
    expect(isCcSwitchPreset({ url })).toBe(expected)
  })
})
