/*
 * [user-ui] 界面语言范围测试（本仓库新增文件，非官方代码）：只提供简体中文与英文。
 */
import { describe, expect, it } from 'vitest'

import {
  INTERFACE_LANGUAGE_OPTIONS,
  convertDetectedLanguage,
  normalizeInterfaceLanguage,
} from '../languages'

describe('interface languages', () => {
  it('offers only Simplified Chinese and English', () => {
    expect(INTERFACE_LANGUAGE_OPTIONS.map((lang) => lang.code)).toEqual([
      'zhCN',
      'en',
    ])
  })

  it('maps every Chinese browser locale to Simplified Chinese', () => {
    for (const tag of ['zh', 'zh-CN', 'zh-TW', 'zh-HK', 'zh-Hant-TW']) {
      expect(convertDetectedLanguage(tag)).toBe('zhCN')
    }
  })

  it('leaves non-Chinese browser locales for i18next to match', () => {
    expect(convertDetectedLanguage('fr-FR')).toBe('fr-FR')
  })

  it('normalizes saved Traditional Chinese preferences to Simplified Chinese and unsupported ones to English', () => {
    expect(normalizeInterfaceLanguage('zhTW')).toBe('zhCN')
    expect(normalizeInterfaceLanguage('zh-TW')).toBe('zhCN')
    expect(normalizeInterfaceLanguage('ja')).toBe('en')
    expect(normalizeInterfaceLanguage(null)).toBe('en')
  })
})
