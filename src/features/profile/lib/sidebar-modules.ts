/*
 * [user-ui] 侧边栏个人设置：选项定义与读写逻辑（本仓库新增文件，非官方代码）。
 *
 * 后端 `sidebar_modules` 按"区域 → 模块"存储（chat / console / personal），
 * 用户 UI 的侧边栏按已确认的信息架构分组（开始使用 / 用量 / 账户，见部署仓库
 * docs/notes/ui-redesign-ledger.md）。这里把界面上的每个开关映射到一个或多个后端模块：
 *
 * - 不再提供"聊天"开关（侧边栏已删除该项）；钱包开关跟随本地功能开关 `wallet`。
 * - 不展示区域级开关：区域被关掉时，打开其中一项会重新启用区域，并把同区域里
 *   界面上可见、原本因区域关闭而隐藏的其它模块显式写成 false，保持它们的显示效果不变。
 * - 界面上没有开关的模块（如 chat.chat、钱包关闭时的 personal.topup）原值保留，
 *   永远不会被写成 false。
 *
 * 可见性判定与 `src/hooks/use-sidebar-config.ts` 一致：区域 enabled !== false 且模块 !== false。
 */
import { isUserUiFeatureEnabled } from '@/config/user-ui-features'

export type SidebarModuleSection = Record<string, boolean>
export type SidebarModulesConfig = Record<string, SidebarModuleSection>

export type SidebarModuleTarget = { section: string; module: string }

export type SidebarToggleDef = {
  id: string
  /** i18n key of the label (IA name of the sidebar entry) */
  labelKey: string
  /** i18n key of the one-line description */
  descriptionKey: string
  /** Backend modules controlled by this toggle (all set together) */
  targets: SidebarModuleTarget[]
}

export type SidebarToggleGroup = {
  id: string
  titleKey: string
  toggles: SidebarToggleDef[]
}

/** Every module key the backend stores for a user (same shape as the official defaults). */
export const KNOWN_SIDEBAR_MODULES: Readonly<
  Record<string, readonly string[]>
> = {
  chat: ['playground', 'chat'],
  console: ['detail', 'token', 'log', 'audit', 'midjourney', 'task'],
  personal: ['topup', 'personal', 'security'],
}

const ALL_GROUPS: SidebarToggleGroup[] = [
  {
    id: 'start',
    titleKey: 'account.sidebar.group.start',
    toggles: [
      {
        id: 'keys',
        labelKey: 'account.sidebar.keys',
        descriptionKey: 'account.sidebar.keys.desc',
        targets: [{ section: 'console', module: 'token' }],
      },
      {
        id: 'playground',
        labelKey: 'account.sidebar.playground',
        descriptionKey: 'account.sidebar.playground.desc',
        targets: [{ section: 'chat', module: 'playground' }],
      },
    ],
  },
  {
    id: 'usage',
    titleKey: 'account.sidebar.group.usage',
    toggles: [
      {
        // 概览与用量统计在侧边栏里共用同一个后端模块 console.detail
        id: 'overview',
        labelKey: 'account.sidebar.overview',
        descriptionKey: 'account.sidebar.overview.desc',
        targets: [{ section: 'console', module: 'detail' }],
      },
      {
        id: 'logs',
        labelKey: 'account.sidebar.logs',
        descriptionKey: 'account.sidebar.logs.desc',
        targets: [{ section: 'console', module: 'log' }],
      },
      {
        // 任务记录同时覆盖绘图与异步任务两个模块（侧边栏 configUrls 同样如此）
        id: 'tasks',
        labelKey: 'account.sidebar.tasks',
        descriptionKey: 'account.sidebar.tasks.desc',
        targets: [
          { section: 'console', module: 'midjourney' },
          { section: 'console', module: 'task' },
        ],
      },
    ],
  },
  {
    id: 'account',
    titleKey: 'account.sidebar.group.account',
    toggles: [
      {
        id: 'wallet',
        labelKey: 'account.sidebar.wallet',
        descriptionKey: 'account.sidebar.wallet.desc',
        targets: [{ section: 'personal', module: 'topup' }],
      },
      {
        id: 'profile',
        labelKey: 'account.sidebar.profile',
        descriptionKey: 'account.sidebar.profile.desc',
        targets: [{ section: 'personal', module: 'personal' }],
      },
      {
        id: 'security',
        labelKey: 'account.sidebar.security',
        descriptionKey: 'account.sidebar.security.desc',
        targets: [{ section: 'personal', module: 'security' }],
      },
      {
        id: 'activity',
        labelKey: 'account.sidebar.activity',
        descriptionKey: 'account.sidebar.activity.desc',
        targets: [{ section: 'console', module: 'audit' }],
      },
    ],
  },
]

/** Toggle groups shown to the user, filtered by the local feature switches. */
export function getSidebarToggleGroups(
  isEnabled: typeof isUserUiFeatureEnabled = isUserUiFeatureEnabled
): SidebarToggleGroup[] {
  return ALL_GROUPS.map((group) => ({
    ...group,
    toggles: group.toggles.filter(
      (toggle) => toggle.id !== 'wallet' || isEnabled('wallet')
    ),
  })).filter((group) => group.toggles.length > 0)
}

/** Full default config (every known section and module visible). */
export function buildDefaultSidebarConfig(): SidebarModulesConfig {
  const config: SidebarModulesConfig = {}
  for (const [section, modules] of Object.entries(KNOWN_SIDEBAR_MODULES)) {
    config[section] = { enabled: true }
    for (const module of modules) config[section][module] = true
  }
  return config
}

/**
 * Parse the stored `sidebar_modules` value. Returns null when it is empty or
 * unusable so the caller can fall back to the defaults.
 */
export function parseSidebarModules(raw: unknown): SidebarModulesConfig | null {
  if (raw == null || raw === '') return null
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null
  }
  return parsed as SidebarModulesConfig
}

function isTargetVisible(
  config: SidebarModulesConfig,
  target: SidebarModuleTarget
): boolean {
  const section = config[target.section]
  if (!section) return true
  return section.enabled !== false && section[target.module] !== false
}

/** A toggle is on when at least one of its modules is visible (sidebar uses `some`). */
export function isSidebarToggleOn(
  config: SidebarModulesConfig,
  toggle: SidebarToggleDef
): boolean {
  return toggle.targets.some((target) => isTargetVisible(config, target))
}

function shownModulesBySection(
  groups: SidebarToggleGroup[]
): Map<string, Set<string>> {
  const shown = new Map<string, Set<string>>()
  for (const group of groups) {
    for (const toggle of group.toggles) {
      for (const target of toggle.targets) {
        const modules = shown.get(target.section) ?? new Set<string>()
        modules.add(target.module)
        shown.set(target.section, modules)
      }
    }
  }
  return shown
}

function cloneConfig(config: SidebarModulesConfig): SidebarModulesConfig {
  const next: SidebarModulesConfig = {}
  for (const [section, value] of Object.entries(config)) {
    next[section] = { ...value }
  }
  return next
}

/**
 * Set a toggle on or off. Only the toggle's own modules change, except when a
 * module is turned on inside a disabled section: the section is re-enabled and
 * the other modules of that section that are shown in the card are written as
 * false so they stay hidden. Modules without a toggle are never touched.
 */
export function setSidebarToggle(
  config: SidebarModulesConfig,
  toggle: SidebarToggleDef,
  value: boolean,
  groups: SidebarToggleGroup[]
): SidebarModulesConfig {
  const next = cloneConfig(config)
  const shown = shownModulesBySection(groups)
  const own = new Set(toggle.targets.map((t) => `${t.section}.${t.module}`))

  for (const target of toggle.targets) {
    const section: SidebarModuleSection = { ...next[target.section] }
    if (value && section.enabled === false) {
      section.enabled = true
      for (const module of shown.get(target.section) ?? []) {
        if (!own.has(`${target.section}.${module}`)) section[module] = false
      }
    }
    section[target.module] = value
    next[target.section] = section
  }
  return next
}

/** Turn every shown toggle back on; modules without a toggle keep their value. */
export function resetSidebarToggles(
  config: SidebarModulesConfig,
  groups: SidebarToggleGroup[]
): SidebarModulesConfig {
  const next = cloneConfig(config)
  for (const [section, modules] of shownModulesBySection(groups)) {
    const value: SidebarModuleSection = {
      ...next[section],
      enabled: true,
    }
    for (const module of modules) value[module] = true
    next[section] = value
  }
  return next
}
