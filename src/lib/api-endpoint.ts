/*
 * [user-ui] 接口地址的统一取法（本仓库新增文件，非官方代码）。
 *
 * 优先使用管理员在后台设置的"服务器地址"（/api/status 的 server_address），
 * 否则使用当前页面的 origin。密钥页、首页、在线试用、文档都应通过这里取地址，
 * 避免不同页面显示不同的接口地址。
 */
import { useStatus } from '@/hooks/use-status'

const HTTP_URL = /^https?:\/\/[^\s/]+/i

function currentOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

/** 去掉末尾的斜杠和 /v1，得到站点根地址。 */
function normalizeBase(url: string): string {
  return url.trim().replace(/\/+$/, '').replace(/\/v1$/i, '')
}

/**
 * 解析接口根地址（不含 /v1）。
 * @param serverAddress status.server_address，任意值；不是 http(s) 地址时忽略
 * @param origin 回退值，默认当前页面 origin
 */
export function resolveApiBaseUrl(
  serverAddress: unknown,
  origin?: string
): string {
  if (
    typeof serverAddress === 'string' &&
    HTTP_URL.test(serverAddress.trim())
  ) {
    return normalizeBase(serverAddress)
  }
  return normalizeBase(origin ?? currentOrigin())
}

/** OpenAI 兼容客户端填写的 Base URL，形如 https://example.com/v1 */
export function toOpenAiBaseUrl(apiBaseUrl: string): string {
  return `${normalizeBase(apiBaseUrl)}/v1`
}

export function toChatCompletionsEndpoint(apiBaseUrl: string): string {
  return `${normalizeBase(apiBaseUrl)}/v1/chat/completions`
}

/** 生成可直接复制的 curl 示例。 */
export function buildChatCurl(args: {
  apiBaseUrl: string
  apiKey: string
  model: string
  prompt?: string
}): string {
  const body = JSON.stringify({
    model: args.model,
    messages: [{ role: 'user', content: args.prompt ?? 'Hello!' }],
  })
  return [
    `curl ${toChatCompletionsEndpoint(args.apiBaseUrl)} \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "Authorization: Bearer ${args.apiKey}" \\`,
    `  -d '${body.replaceAll("'", "'\\''")}'`,
  ].join('\n')
}

/** React 中读取接口根地址。 */
export function useApiBaseUrl(): string {
  const { status } = useStatus()
  return resolveApiBaseUrl(
    (status as Record<string, unknown> | null | undefined)?.server_address
  )
}
