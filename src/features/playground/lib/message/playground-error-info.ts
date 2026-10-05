/*
 * [user-ui] 在线试用的错误分类：把后端/网络错误翻成"发生了什么 + 下一步怎么做"（本仓库新增文件，非官方代码）。
 *
 * 依据（只用能核实的信号，不猜后端文案）：
 * - 错误码来自响应体 error.code（流式与非流式都会保存到 message.errorCode，见 hooks/use-chat-handler.ts）。
 *   2026-10-05 在本地实例（rc.37）上实测：
 *     insufficient_user_quota（403，"预扣费额度失败, 用户剩余额度…"）、
 *     model_not_found（503，"No available channel for model … under group …"）、
 *     invalid_request（400，"max_tokens is invalid"）、
 *     model_price_error（400，模型未定价，官方前端已按此码区分）、
 *     分组无权限（403，code 为空，"No permission to access this group"）、
 *     未登录（401，{"code":"AUTH_UNAUTHORIZED"}）。
 * - "Current group load is saturated" 表示上游 429（官方文档 support/faq.md）。
 * 原始错误文本始终保留，在界面上作为"原始错误信息"展示，便于反馈给管理员（含 request id）。
 */
import i18next from 'i18next'

import { ERROR_MESSAGES } from '../../constants'

export type PlaygroundErrorKind =
  | 'quota'
  | 'model-unavailable'
  | 'model-price'
  | 'group-forbidden'
  | 'invalid-request'
  | 'busy'
  | 'auth'
  | 'network'
  | 'generic'

export type PlaygroundErrorInfo = {
  kind: PlaygroundErrorKind
  /** i18n key of the short headline */
  titleKey: string
  /** i18n key of the "what to do next" sentence */
  descriptionKey: string
  /** warning = the user can fix it by changing something; destructive = the request failed */
  tone: 'warning' | 'destructive'
  /** original error text without the generic "Request error occurred: " prefix */
  detail: string
}

type ErrorRule = {
  kind: Exclude<PlaygroundErrorKind, 'generic'>
  tone: PlaygroundErrorInfo['tone']
  codes?: readonly string[]
  patterns?: readonly RegExp[]
  /** exact texts (English i18n keys; their translation also matches) */
  texts?: readonly string[]
}

const ERROR_RULES: readonly ErrorRule[] = [
  {
    kind: 'quota',
    tone: 'warning',
    codes: ['insufficient_user_quota'],
    patterns: [/预扣费额度失败/],
  },
  {
    kind: 'model-price',
    tone: 'warning',
    codes: ['model_price_error'],
  },
  {
    kind: 'model-unavailable',
    tone: 'warning',
    codes: ['model_not_found'],
    patterns: [/no available channel/i],
  },
  {
    kind: 'group-forbidden',
    tone: 'warning',
    patterns: [/no permission to access this group/i],
  },
  {
    kind: 'invalid-request',
    tone: 'destructive',
    codes: ['invalid_request'],
  },
  {
    kind: 'busy',
    tone: 'warning',
    patterns: [/\bHTTP 429\b/, /load is saturated/i, /too many requests/i],
  },
  {
    kind: 'auth',
    tone: 'destructive',
    patterns: [/AUTH_UNAUTHORIZED/, /\bHTTP 401\b/],
    texts: ['Session expired!'],
  },
]

const NETWORK_ERROR_TEXTS: readonly string[] = [
  ERROR_MESSAGES.NETWORK_ERROR,
  ERROR_MESSAGES.STREAM_START_ERROR,
  ERROR_MESSAGES.CONNECTION_CLOSED,
  'Network Error',
]

const KIND_TEXT_KEYS: Record<
  PlaygroundErrorKind,
  Pick<PlaygroundErrorInfo, 'titleKey' | 'descriptionKey'>
> = {
  quota: {
    titleKey: 'playground.error.quota.title',
    descriptionKey: 'playground.error.quota.description',
  },
  'model-unavailable': {
    titleKey: 'playground.error.modelUnavailable.title',
    descriptionKey: 'playground.error.modelUnavailable.description',
  },
  'model-price': {
    titleKey: 'playground.error.modelPrice.title',
    descriptionKey: 'playground.error.modelPrice.description',
  },
  'group-forbidden': {
    titleKey: 'playground.error.groupForbidden.title',
    descriptionKey: 'playground.error.groupForbidden.description',
  },
  'invalid-request': {
    titleKey: 'playground.error.invalidRequest.title',
    descriptionKey: 'playground.error.invalidRequest.description',
  },
  busy: {
    titleKey: 'playground.error.busy.title',
    descriptionKey: 'playground.error.busy.description',
  },
  auth: {
    titleKey: 'playground.error.auth.title',
    descriptionKey: 'playground.error.auth.description',
  },
  network: {
    titleKey: 'playground.error.network.title',
    descriptionKey: 'playground.error.network.description',
  },
  generic: {
    titleKey: 'playground.error.generic.title',
    descriptionKey: 'playground.error.generic.description',
  },
}

function translated(text: string): string[] {
  const value = i18next.t(text)
  return value && value !== text ? [text, value] : [text]
}

/** Remove the generic "Request error occurred: " prefix the chat handler adds. */
export function stripRequestErrorPrefix(content: string): string {
  for (const title of translated(ERROR_MESSAGES.API_REQUEST_ERROR)) {
    const prefix = `${title}: `
    if (content.startsWith(prefix)) return content.slice(prefix.length)
  }
  return content
}

function isNetworkError(detail: string): boolean {
  const trimmed = detail.trim()
  if (/^HTTP \d{3}: /.test(trimmed)) return true
  return NETWORK_ERROR_TEXTS.some((text) =>
    translated(text).some(
      (candidate) => trimmed === candidate || trimmed.endsWith(candidate)
    )
  )
}

function matchRule(
  detail: string,
  errorCode?: string | null
): ErrorRule | null {
  const code = errorCode?.trim().toLowerCase() || ''
  if (code) {
    const byCode = ERROR_RULES.find((rule) => rule.codes?.includes(code))
    if (byCode) return byCode
  }
  return (
    ERROR_RULES.find(
      (rule) =>
        rule.patterns?.some((pattern) => pattern.test(detail)) ||
        rule.texts?.some((text) => translated(text).includes(detail))
    ) ?? null
  )
}

function buildInfo(
  kind: PlaygroundErrorKind,
  tone: PlaygroundErrorInfo['tone'],
  detail: string
): PlaygroundErrorInfo {
  return { kind, tone, ...KIND_TEXT_KEYS[kind], detail }
}

/**
 * Classify a playground request error.
 * @param content error text stored on the assistant message
 * @param errorCode `error.code` from the response body, when there was one
 */
export function getPlaygroundErrorInfo(
  content: string,
  errorCode?: string | null
): PlaygroundErrorInfo {
  const detail = stripRequestErrorPrefix(content).trim()
  const rule = matchRule(detail, errorCode)
  if (rule) return buildInfo(rule.kind, rule.tone, detail)
  if (isNetworkError(detail)) return buildInfo('network', 'destructive', detail)
  return buildInfo('generic', 'destructive', detail)
}
