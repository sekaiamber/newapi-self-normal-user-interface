/*
 * [user-ui] 首页文案切分（行内代码、接口路径换行点、聊天预设过滤）的测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import type { ChatPreset } from '@/features/chat/lib/chat-links'

import { splitPathForWrapping } from '../lib/api-formats'
import { getListedChatPresets } from '../lib/chat-presets'
import { splitInlineCode } from '../lib/inline-code'

describe('splitInlineCode', () => {
  it('turns backtick pairs into code segments', () => {
    expect(splitInlineCode('请求 `GET /v1/models` 即可')).toEqual([
      { id: 0, text: '请求 ', code: false },
      { id: 1, text: 'GET /v1/models', code: true },
      { id: 2, text: ' 即可', code: false },
    ])
  })

  it('keeps an unpaired backtick as plain text', () => {
    expect(splitInlineCode('a `b')).toEqual([
      { id: 0, text: 'a ', code: false },
      { id: 1, text: '`b', code: false },
    ])
  })
})

describe('splitPathForWrapping', () => {
  it('breaks after slashes and colons and keeps the full path', () => {
    const segments = splitPathForWrapping(
      '/v1beta/models/{model}:generateContent'
    )

    expect(segments.map((segment) => segment.text)).toEqual([
      '/',
      'v1beta/',
      'models/',
      '{model}:',
      'generateContent',
    ])
    expect(segments.map((segment) => segment.text).join('')).toBe(
      '/v1beta/models/{model}:generateContent'
    )
  })
})

describe('getListedChatPresets', () => {
  it('drops the built-in CC Switch preset that has its own card', () => {
    const presets: ChatPreset[] = [
      {
        id: '0',
        name: 'Cherry Studio',
        url: 'cherrystudio://x',
        type: 'custom-protocol',
      },
      {
        id: '1',
        name: 'CC Switch',
        url: ' CCSwitch ',
        type: 'custom-protocol',
      },
      {
        id: '2',
        name: 'Lobe Chat',
        url: 'https://chat.example.com',
        type: 'web',
      },
    ]

    expect(getListedChatPresets(presets).map((preset) => preset.name)).toEqual([
      'Cherry Studio',
      'Lobe Chat',
    ])
  })
})
