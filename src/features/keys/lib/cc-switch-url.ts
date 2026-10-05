// Adapted from QuantumNous/new-api web/src/features/keys/components/dialogs/cc-switch-dialog.tsx @ v1.0.0-rc.37 (AGPL-3.0)
/*
 * [user-ui] CC Switch 导入深链（本仓库新增文件，非官方代码；逻辑来自官方 buildCCSwitchURL）。
 *
 * 与官方的差异：接口地址由调用方传入（useApiBaseUrl()），Codex 用 toOpenAiBaseUrl()
 * 拼 /v1，避免末尾斜杠造成 "//v1"。参数名与取值保持官方原样（ccswitch://v1/import）。
 */
import { toOpenAiBaseUrl } from '@/lib/api-endpoint'

export function buildCCSwitchURL(
  serverAddress: string,
  app: string,
  name: string,
  models: Record<string, string>,
  apiKey: string
): string {
  const endpoint =
    app === 'codex' ? toOpenAiBaseUrl(serverAddress) : serverAddress
  const params = new URLSearchParams()
  params.set('resource', 'provider')
  params.set('app', app)
  params.set('name', name)
  params.set('endpoint', endpoint)
  params.set('apiKey', apiKey)
  for (const [k, v] of Object.entries(models)) {
    if (v) params.set(k, v)
  }
  params.set('homepage', serverAddress)
  params.set('enabled', 'true')
  return `ccswitch://v1/import?${params.toString()}`
}
