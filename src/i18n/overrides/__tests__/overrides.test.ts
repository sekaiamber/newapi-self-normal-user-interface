/*
 * [user-ui] i18n 覆盖层测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import {
  mergeBundles,
  overridePackageNames,
  overridesEn,
  overridesZh,
  withOverrides,
} from '..'

describe('i18n overrides', () => {
  it('lets overrides win over the official translation', () => {
    const merged = withOverrides(
      { translation: { Docs: '文档', Home: '首页' } },
      { Docs: '接入文档' }
    )

    expect(merged.translation).toEqual({ Docs: '接入文档', Home: '首页' })
  })

  it('applies later bundles over earlier ones', () => {
    expect(mergeBundles([{ a: '1', b: '1' }, { b: '2' }])).toEqual({
      a: '1',
      b: '2',
    })
  })

  it('registers one bundle pair per work package', () => {
    expect(overridePackageNames).toEqual([
      'base',
      'design',
      'shell',
      'usage',
      'keys',
      'logs',
      'account',
      'wallet',
      'playground',
      'docs',
      'home',
      'auth',
    ])
  })

  it('keeps zh and en override keys in sync', () => {
    expect(Object.keys(overridesZh).sort()).toEqual(
      Object.keys(overridesEn).sort()
    )
  })
})
