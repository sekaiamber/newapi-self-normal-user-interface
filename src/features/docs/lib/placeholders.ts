/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 文档 Markdown 中的站点占位符替换。
 */

import { resolveApiBaseUrl } from '@/lib/api-endpoint'

export const SITE_NAME_PLACEHOLDER = '{{SITE_NAME}}'
export const BASE_URL_PLACEHOLDER = '{{BASE_URL}}'

export interface DocPlaceholderValues {
  /** Brand configured by the administrator (`system_name`). */
  siteName: string
  /** Address users put into API clients, without a trailing slash. */
  baseUrl: string
}

export interface DocPlaceholderSource {
  /** `system_name` from `/api/status`. */
  systemName?: unknown
  /** `server_address` from `/api/status` (admin "服务器地址" setting). */
  serverAddress?: unknown
  /** `window.location.origin` */
  origin: string
  /** `window.location.hostname` */
  hostname: string
}

/**
 * Resolve placeholder values from the status response and the current page.
 * - `{{SITE_NAME}}`: `system_name`, or the page host name when it is empty.
 * - `{{BASE_URL}}`: `server_address` when it is an http(s) URL, otherwise the
 *   page origin (the UI and the API share one origin in production).
 */
export function resolveDocPlaceholderValues(
  source: DocPlaceholderSource
): DocPlaceholderValues {
  const systemName =
    typeof source.systemName === 'string' ? source.systemName.trim() : ''

  return {
    siteName: systemName || source.hostname,
    baseUrl:
      // [user-ui] 与全站共用同一取法（src/lib/api-endpoint.ts）
      resolveApiBaseUrl(source.serverAddress, source.origin),
  }
}

/**
 * Replace every `{{SITE_NAME}}` and `{{BASE_URL}}` occurrence. Replacer
 * functions keep `$&`-style patterns in an admin-set name literal.
 */
export function applyDocPlaceholders(
  markdown: string,
  values: DocPlaceholderValues
): string {
  return markdown
    .replaceAll(SITE_NAME_PLACEHOLDER, () => values.siteName)
    .replaceAll(BASE_URL_PLACEHOLDER, () => values.baseUrl)
}
