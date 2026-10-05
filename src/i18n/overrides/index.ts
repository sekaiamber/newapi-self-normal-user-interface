/*
 * [user-ui] i18n 覆盖层（本仓库新增文件，非官方代码）。
 *
 * 官方 locale 文件（../locales/*.json）保持原样，便于同步官方升级。
 * 用户 UI 的新文案与改写文案放在这里，每个工作包一对文件：<包名>.zh.json / <包名>.en.json，
 * 内容是扁平的 key → 文案，与官方 locale 的 "translation" 段同构。
 *
 * 规则：
 * - 只改自己工作包的文件；本 index 已登记全部工作包，不需要改。
 * - 改名优先新增语义化 key（如 "nav.usageStats"），不要覆盖被多处共用的官方 key。
 * - 同一个 key 出现在多个包里时，排在后面的包优先（见 PACKAGES 顺序），应避免这种情况。
 */
import accountEn from './account.en.json'
import accountZh from './account.zh.json'
import authEn from './auth.en.json'
import authZh from './auth.zh.json'
import baseEn from './base.en.json'
import baseZh from './base.zh.json'
import designEn from './design.en.json'
import designZh from './design.zh.json'
import docsEn from './docs.en.json'
import docsZh from './docs.zh.json'
import homeEn from './home.en.json'
import homeZh from './home.zh.json'
import keysEn from './keys.en.json'
import keysZh from './keys.zh.json'
import logsEn from './logs.en.json'
import logsZh from './logs.zh.json'
import playgroundEn from './playground.en.json'
import playgroundZh from './playground.zh.json'
import shellEn from './shell.en.json'
import shellZh from './shell.zh.json'
import usageEn from './usage.en.json'
import usageZh from './usage.zh.json'
import walletEn from './wallet.en.json'
import walletZh from './wallet.zh.json'

type Bundle = Record<string, string>

const PACKAGES: ReadonlyArray<{ name: string; zh: Bundle; en: Bundle }> = [
  { name: 'base', zh: baseZh, en: baseEn },
  { name: 'design', zh: designZh, en: designEn },
  { name: 'shell', zh: shellZh, en: shellEn },
  { name: 'usage', zh: usageZh, en: usageEn },
  { name: 'keys', zh: keysZh, en: keysEn },
  { name: 'logs', zh: logsZh, en: logsEn },
  { name: 'account', zh: accountZh, en: accountEn },
  { name: 'wallet', zh: walletZh, en: walletEn },
  { name: 'playground', zh: playgroundZh, en: playgroundEn },
  { name: 'docs', zh: docsZh, en: docsEn },
  { name: 'home', zh: homeZh, en: homeEn },
  { name: 'auth', zh: authZh, en: authEn },
]

export const overridePackageNames = PACKAGES.map((p) => p.name)

export function mergeBundles(bundles: ReadonlyArray<Bundle>): Bundle {
  return Object.assign({}, ...bundles) as Bundle
}

export const overridesZh: Bundle = mergeBundles(PACKAGES.map((p) => p.zh))
export const overridesEn: Bundle = mergeBundles(PACKAGES.map((p) => p.en))

/** 把覆盖层合并进官方 locale（覆盖层优先）。 */
export function withOverrides<
  T extends { translation: Record<string, unknown> },
>(locale: T, overrides: Bundle): T {
  return { ...locale, translation: { ...locale.translation, ...overrides } }
}
