/*
 * [user-ui] 侧边栏个人设置读写规则的测试（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import {
  buildDefaultSidebarConfig,
  getSidebarToggleGroups,
  isSidebarToggleOn,
  parseSidebarModules,
  resetSidebarToggles,
  setSidebarToggle,
  type SidebarToggleDef,
} from '../lib/sidebar-modules'

const groups = getSidebarToggleGroups(() => true)
const toggle = (id: string): SidebarToggleDef => {
  const found = groups
    .flatMap((group) => group.toggles)
    .find((item) => item.id === id)
  if (!found) throw new Error(`missing toggle ${id}`)
  return found
}
const toggleIds = (list = groups) =>
  list.flatMap((group) => group.toggles.map((item) => item.id))

describe('sidebar toggle options', () => {
  it('follow the confirmed IA groups and offer no Chat toggle', () => {
    expect(groups.map((group) => group.id)).toEqual([
      'start',
      'usage',
      'account',
    ])
    expect(toggleIds()).toEqual([
      'keys',
      'playground',
      'overview',
      'logs',
      'tasks',
      'wallet',
      'profile',
      'security',
      'activity',
    ])
    const targets = groups.flatMap((group) =>
      group.toggles.flatMap((item) => item.targets)
    )
    expect(targets).not.toContainEqual({ section: 'chat', module: 'chat' })
  })

  it('drop the wallet toggle when the local wallet switch is off', () => {
    const withoutWallet = getSidebarToggleGroups(
      (feature) => feature !== 'wallet'
    )
    expect(toggleIds(withoutWallet)).not.toContain('wallet')
    expect(toggleIds(withoutWallet)).toContain('profile')
  })
})

describe('reading the stored value', () => {
  it('returns null for empty or invalid values so defaults are used', () => {
    expect(parseSidebarModules('')).toBeNull()
    expect(parseSidebarModules(undefined)).toBeNull()
    expect(parseSidebarModules('{not json')).toBeNull()
    expect(parseSidebarModules('[]')).toBeNull()
  })

  it('accepts a JSON string or an already parsed object', () => {
    expect(parseSidebarModules('{"console":{"token":false}}')).toEqual({
      console: { token: false },
    })
    expect(parseSidebarModules({ chat: { enabled: false } })).toEqual({
      chat: { enabled: false },
    })
  })

  it('defaults show every known module, including ones without a toggle', () => {
    const defaults = buildDefaultSidebarConfig()
    expect(defaults.chat).toEqual({
      enabled: true,
      playground: true,
      chat: true,
    })
    expect(defaults.personal.topup).toBe(true)
  })
})

describe('changing toggles', () => {
  it('turning a toggle off writes only its own module', () => {
    const before = { chat: { enabled: true, playground: true, chat: true } }
    expect(
      setSidebarToggle(before, toggle('playground'), false, groups)
    ).toEqual({ chat: { enabled: true, playground: false, chat: true } })
  })

  it('task logs control both the drawing and the async task modules', () => {
    const off = setSidebarToggle({}, toggle('tasks'), false, groups)
    expect(off.console).toEqual({ midjourney: false, task: false })
    expect(isSidebarToggleOn(off, toggle('tasks'))).toBe(false)
    expect(
      isSidebarToggleOn({ console: { midjourney: false } }, toggle('tasks'))
    ).toBe(true)
  })

  it('a disabled section shows its toggles off and re-enabling one keeps the others hidden', () => {
    const before = {
      console: {
        enabled: false,
        detail: true,
        token: true,
        log: true,
        audit: true,
        midjourney: true,
        task: true,
      },
    }
    expect(isSidebarToggleOn(before, toggle('keys'))).toBe(false)
    const after = setSidebarToggle(before, toggle('keys'), true, groups)
    expect(after.console).toEqual({
      enabled: true,
      detail: false,
      token: true,
      log: false,
      audit: false,
      midjourney: false,
      task: false,
    })
  })

  it('never writes false into modules that have no toggle', () => {
    const before = { chat: { enabled: false, playground: true, chat: true } }
    const after = setSidebarToggle(before, toggle('playground'), true, groups)
    expect(after.chat).toEqual({ enabled: true, playground: true, chat: true })

    const noWallet = getSidebarToggleGroups((feature) => feature !== 'wallet')
    const personal = {
      personal: { enabled: false, topup: true, personal: true, security: true },
    }
    const reopened = setSidebarToggle(
      personal,
      toggle('profile'),
      true,
      noWallet
    )
    expect(reopened.personal).toEqual({
      enabled: true,
      topup: true,
      personal: true,
      security: false,
    })
  })

  it('reset turns shown toggles back on and keeps modules without a toggle', () => {
    const before = {
      chat: { enabled: false, playground: false, chat: false },
      console: { token: false },
    }
    const after = resetSidebarToggles(before, groups)
    expect(after.chat).toEqual({ enabled: true, playground: true, chat: false })
    expect(
      groups.flatMap((g) => g.toggles).every((t) => isSidebarToggleOn(after, t))
    ).toBe(true)
  })

  it('does not mutate the previous config', () => {
    const before = { console: { token: true } }
    setSidebarToggle(before, toggle('keys'), false, groups)
    expect(before).toEqual({ console: { token: true } })
  })
})
