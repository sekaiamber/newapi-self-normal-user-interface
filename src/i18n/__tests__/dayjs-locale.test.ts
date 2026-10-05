import { afterAll, describe, expect, it } from 'vitest'

// [user-ui] dayjs 相对时间跟随界面语言（本仓库新增文件，非官方代码）
import dayjs from '@/lib/dayjs'

import i18n, { toDayjsLocale } from '../config'

describe('dayjs locale follows the interface language', () => {
  afterAll(async () => {
    await i18n.changeLanguage('en')
  })

  it('maps interface languages to dayjs locales', () => {
    expect(toDayjsLocale('zhCN')).toBe('zh-cn')
    expect(toDayjsLocale('zh-CN')).toBe('zh-cn')
    expect(toDayjsLocale('en')).toBe('en')
    expect(toDayjsLocale(undefined)).toBe('en')
  })

  it('renders relative time in Chinese after switching to zhCN', async () => {
    // dayjs 实例在创建时记住语言，所以每次切换后重新创建（页面渲染时也是如此）
    const tenSecondsAgo = () => dayjs().subtract(10, 'second')

    await i18n.changeLanguage('zhCN')
    expect(dayjs.locale()).toBe('zh-cn')
    expect(tenSecondsAgo().fromNow()).toBe('几秒前')

    await i18n.changeLanguage('en')
    expect(dayjs.locale()).toBe('en')
    expect(tenSecondsAgo().fromNow()).toBe('a few seconds ago')
  })
})
