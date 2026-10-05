/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 *
 * 文档界面文案（导航、分页、目录等）的翻译。键为英文原文，与全局 locales 的约定一致；
 * 以 overwrite=false 合并进 i18next，全局 locales 中已有同名键时以全局为准。
 * 若之后把这些键并入 src/i18n/locales/*.json，可删除本文件。
 */
import i18next, { type i18n as I18nInstance } from 'i18next'
import { useTranslation } from 'react-i18next'

type TranslationTable = Record<string, string>

const ZH_CN: TranslationTable = {
  '{{siteName}} Docs': '{{siteName}} 文档',
  'Learn how to call the API, manage API keys and quota, and connect your clients.':
    '了解如何调用 API、管理 API 密钥与额度，以及接入常用客户端。',
  'Your API base URL': '你的 API 地址',
  'OpenAI-compatible clients use the /v1 address; Claude and Gemini native clients use the site root.':
    'OpenAI 兼容客户端使用 /v1 地址；Claude、Gemini 原生客户端使用站点根地址。',
  'Getting started': '入门',
  Guides: '使用指南',
  Help: '帮助',
  'Quick start': '快速开始',
  'Sign in, create an API key and send your first request in a few minutes.':
    '登录、创建 API 密钥，几分钟内发出第一个请求。',
  'API basics': 'API 基础',
  'Base URLs, authentication, OpenAI, Claude and Gemini formats, model list and streaming.':
    '地址规则、认证方式、OpenAI / Claude / Gemini 请求格式、模型列表与流式输出。',
  'API keys and quota': 'API 密钥与额度',
  'What each API key option does, and how account balance differs from key quota.':
    'API 密钥各项设置的含义，以及账户余额与密钥额度的区别。',
  'Client setup': '客户端接入',
  'Connect Claude Code, Codex CLI, Cherry Studio, CC Switch and other clients.':
    '接入 Claude Code、Codex CLI、Cherry Studio、CC Switch 等客户端。',
  'Common issues': '常见问题',
  'Invalid keys, insufficient quota, unavailable models, rate limits and streaming problems.':
    '密钥无效、额度不足、模型不可用、请求限流与流式输出问题。',
  'On this page': '本页目录',
  'Docs navigation': '文档导航',
  'Docs menu': '文档目录',
}

const ZH_TW: TranslationTable = {
  '{{siteName}} Docs': '{{siteName}} 文件',
  'Learn how to call the API, manage API keys and quota, and connect your clients.':
    '了解如何呼叫 API、管理 API 金鑰與額度，以及接入常用用戶端。',
  'Your API base URL': '你的 API 位址',
  'OpenAI-compatible clients use the /v1 address; Claude and Gemini native clients use the site root.':
    'OpenAI 相容用戶端使用 /v1 位址；Claude、Gemini 原生用戶端使用站點根位址。',
  'Getting started': '入門',
  Guides: '使用指南',
  Help: '說明',
  'Quick start': '快速開始',
  'Sign in, create an API key and send your first request in a few minutes.':
    '登入、建立 API 金鑰，幾分鐘內發出第一個請求。',
  'API basics': 'API 基礎',
  'Base URLs, authentication, OpenAI, Claude and Gemini formats, model list and streaming.':
    '位址規則、認證方式、OpenAI / Claude / Gemini 請求格式、模型清單與串流輸出。',
  'API keys and quota': 'API 金鑰與額度',
  'What each API key option does, and how account balance differs from key quota.':
    'API 金鑰各項設定的含義，以及帳戶餘額與金鑰額度的區別。',
  'Client setup': '用戶端接入',
  'Connect Claude Code, Codex CLI, Cherry Studio, CC Switch and other clients.':
    '接入 Claude Code、Codex CLI、Cherry Studio、CC Switch 等用戶端。',
  'Common issues': '常見問題',
  'Invalid keys, insufficient quota, unavailable models, rate limits and streaming problems.':
    '金鑰無效、額度不足、模型不可用、請求限流與串流輸出問題。',
  'On this page': '本頁目錄',
  'Docs navigation': '文件導覽',
  'Docs menu': '文件目錄',
}

/** Locale codes match `supportedLngs` in `src/i18n/config.ts`. */
export const DOCS_TRANSLATIONS: Readonly<Record<string, TranslationTable>> = {
  zhCN: ZH_CN,
  zhTW: ZH_TW,
}

const registeredInstances = new WeakSet<I18nInstance>()

/** Merge the docs strings into i18next once; existing global keys win. */
export function ensureDocsTranslations(instance: I18nInstance = i18next): void {
  // `store` only exists after `init()`; retry on the next call until then.
  if (registeredInstances.has(instance) || !instance.store) return
  for (const [language, table] of Object.entries(DOCS_TRANSLATIONS)) {
    instance.addResourceBundle(language, 'translation', table, true, false)
  }
  registeredInstances.add(instance)
}

/** `useTranslation()` with the docs strings registered. */
export function useDocsTranslation() {
  ensureDocsTranslations()
  return useTranslation()
}
