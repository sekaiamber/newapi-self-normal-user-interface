/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 */
import i18next from 'i18next'
import { describe, expect, it } from 'vitest'

import { ensureDocsTranslations } from '../lib/i18n'

describe('ensureDocsTranslations', () => {
  it('adds the docs strings without overriding global translations', async () => {
    const instance = i18next.createInstance()
    await instance.init({
      lng: 'zhCN',
      fallbackLng: 'en',
      nsSeparator: false,
      resources: {
        zhCN: { translation: { 'Quick start': '全局译文' } },
      },
    })

    ensureDocsTranslations(instance)
    ensureDocsTranslations(instance)

    expect(instance.t('Quick start')).toBe('全局译文')
    expect(instance.t('On this page')).toBe('本页目录')
    expect(instance.t('{{siteName}} Docs', { siteName: 'SwarmRouter' })).toBe(
      'SwarmRouter 文档'
    )
    await instance.changeLanguage('en')
    expect(instance.t('{{siteName}} Docs', { siteName: 'SwarmRouter' })).toBe(
      'SwarmRouter Docs'
    )
  })

  it('waits until the instance is initialised', () => {
    const instance = i18next.createInstance()
    expect(() => ensureDocsTranslations(instance)).not.toThrow()
  })
})
