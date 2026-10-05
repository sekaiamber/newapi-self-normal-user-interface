/*
 * [user-ui] 首页"兼容格式"数据（本仓库新增文件，非官方代码）。
 *
 * 只列官方文档写明的接口与认证方式，来源（docs/official/en/）：
 * - guide/feature-guide/user/api.md：Supported API Endpoints 表（/v1/chat/completions、/v1/responses、
 *   /v1/messages、/v1beta/models/{model}:{action}），Claude 原生 x-api-key 示例，Gemini 原生 ?key= 示例
 * - api/ai-model/chat/createmessage.schema.json：anthropic-version 必填，x-api-key 可选，也可用 Bearer
 * - api/ai-model/chat/gemini/geminirelayv1beta.schema.json：Bearer 认证
 * 客户端填写的地址（OpenAI 兼容用 /v1，Claude / Gemini 原生用站点根地址）与本站文档
 * features/docs/content/api-basics.md.txt 的"地址规则"一致。
 */

export type ApiFormatFamily = 'openai' | 'claude' | 'gemini'

export interface ApiFormat {
  id: string
  family: ApiFormatFamily
  /** 接口名，不翻译 */
  name: string
  method: 'POST'
  path: string
  /** 可用的认证写法，按推荐顺序 */
  auth: readonly string[]
  /** 需要额外携带的请求头 */
  requiredHeader?: string
  /** 客户端填写的地址：v1 = 根地址 + /v1，root = 站点根地址 */
  clientBase: 'v1' | 'root'
}

export const API_FORMAT_FAMILY_KEYS: Readonly<Record<ApiFormatFamily, string>> =
  {
    openai: 'home.format.openai',
    claude: 'home.format.claude',
    gemini: 'home.format.gemini',
  }

export const API_FORMATS: readonly ApiFormat[] = [
  {
    id: 'chat-completions',
    family: 'openai',
    name: 'Chat Completions',
    method: 'POST',
    path: '/v1/chat/completions',
    auth: ['Authorization: Bearer'],
    clientBase: 'v1',
  },
  {
    id: 'responses',
    family: 'openai',
    name: 'Responses',
    method: 'POST',
    path: '/v1/responses',
    auth: ['Authorization: Bearer'],
    clientBase: 'v1',
  },
  {
    id: 'messages',
    family: 'claude',
    name: 'Messages',
    method: 'POST',
    path: '/v1/messages',
    auth: ['x-api-key', 'Authorization: Bearer'],
    requiredHeader: 'anthropic-version',
    clientBase: 'root',
  },
  {
    id: 'generate-content',
    family: 'gemini',
    name: 'generateContent',
    method: 'POST',
    path: '/v1beta/models/{model}:generateContent',
    auth: ['?key=', 'Authorization: Bearer'],
    clientBase: 'root',
  },
]

/** 把路径切成可换行的片段（在 / 与 : 之后断开），offset 可作 React key。 */
export function splitPathForWrapping(
  path: string
): Array<{ offset: number; text: string }> {
  const segments: Array<{ offset: number; text: string }> = []
  let start = 0
  for (let index = 0; index < path.length; index += 1) {
    const char = path[index]
    if ((char === '/' || char === ':') && index + 1 < path.length) {
      segments.push({ offset: start, text: path.slice(start, index + 1) })
      start = index + 1
    }
  }
  segments.push({ offset: start, text: path.slice(start) })
  return segments
}
