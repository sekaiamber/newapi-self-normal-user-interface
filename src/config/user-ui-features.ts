/*
 * [user-ui] 用户 UI 功能开关（本仓库新增文件，非官方代码）。
 *
 * false = 禁用：隐藏所有入口（顶部导航、侧边栏、菜单、页面内按钮），对应路由不可访问；
 * 代码全部保留，改回 true 即恢复。开关在构建时生效。
 *
 * 与后端 HeaderNavModules / SidebarModulesAdmin 的关系：两者取"与"。
 * 后端开着、这里关掉 → 用户 UI 不显示；这里开着、后端关掉 → 仍不显示。
 */
export const USER_UI_FEATURES = {
  /** 模型广场：/pricing、/pricing/:modelId */
  pricing: false,
  /** 排行榜：/rankings */
  rankings: false,
  /** 关于：/about */
  about: false,
  /** 钱包：/wallet（在线充值、兑换码、订阅购买、账单） */
  wallet: true,
  /** 推荐计划：钱包页内的邀请返利卡片 */
  referral: false,
} as const

export type UserUiFeature = keyof typeof USER_UI_FEATURES

export function isUserUiFeatureEnabled(feature: UserUiFeature): boolean {
  return USER_UI_FEATURES[feature]
}
