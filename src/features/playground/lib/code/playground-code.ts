/*
 * [user-ui] "查看代码"：把在线试用当前的请求转成可以用 API 密钥直接调用的示例（本仓库新增文件，非官方代码）。
 *
 * - 接口地址统一取自 src/lib/api-endpoint.ts（与密钥页、文档一致）。
 * - 请求体复用在线试用自己的 buildChatCompletionPayload（同一套"只发送已开启的参数"规则），
 *   去掉只属于 /pg 接口的 group（API 调用时分组由密钥决定，见官方文档
 *   guide/feature-guide/user/token.md "Group"）和 stream（示例用普通响应，最易上手）。
 * - curl 与 Python(OpenAI SDK) 两种写法与官方文档 guide/feature-guide/user/api.md 的示例一致。
 * - 不带真实密钥：用 YOUR_API_KEY 占位，避免在页面上展示密钥。
 *
 * 说明：src/lib/api-endpoint.ts 的 buildChatCurl 只支持 model + prompt，无法带上参数，
 * 所以这里用同样的格式和单引号转义自行拼装。
 */
import { toChatCompletionsEndpoint, toOpenAiBaseUrl } from '@/lib/api-endpoint'

import { MESSAGE_ROLES } from '../../constants'
import type {
  ChatCompletionRequest,
  Message,
  ParameterEnabled,
  PlaygroundConfig,
} from '../../types'
import { getMessageContent } from '../message/message-utils'
import { buildChatCompletionPayload } from '../streaming/payload-builder'

export const CODE_SAMPLE_API_KEY_PLACEHOLDER = 'YOUR_API_KEY'
export const CODE_SAMPLE_DEFAULT_PROMPT = 'Hello!'

export type PlaygroundCodeRequest = Omit<
  ChatCompletionRequest,
  'group' | 'stream'
>

/**
 * The message used in the example: the unsent draft if there is one,
 * otherwise the latest user message, otherwise a short greeting.
 */
export function getCodeSamplePrompt(
  draft: string,
  messages: readonly Message[]
): string {
  if (draft.trim()) return draft

  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index]
    if (message.from !== MESSAGE_ROLES.USER) continue
    const content = getMessageContent(message)
    if (content.trim()) return content
  }

  return CODE_SAMPLE_DEFAULT_PROMPT
}

/** Request body for /v1/chat/completions that mirrors the playground request. */
export function buildPlaygroundCodeRequest(
  config: PlaygroundConfig,
  parameterEnabled: ParameterEnabled,
  prompt: string
): PlaygroundCodeRequest {
  const message: Message = {
    key: 'code-sample',
    from: MESSAGE_ROLES.USER,
    versions: [{ id: 'code-sample', content: prompt }],
  }
  const payload = buildChatCompletionPayload(
    [message],
    config,
    parameterEnabled
  )
  const request: Partial<ChatCompletionRequest> = { ...payload }
  delete request.group
  delete request.stream
  return request as PlaygroundCodeRequest
}

function shellSingleQuote(value: string): string {
  return value.replaceAll("'", "'\\''")
}

export function buildPlaygroundCurl(
  apiBaseUrl: string,
  request: PlaygroundCodeRequest,
  apiKey: string = CODE_SAMPLE_API_KEY_PLACEHOLDER
): string {
  const body = JSON.stringify(request, null, 2)
  return [
    `curl ${toChatCompletionsEndpoint(apiBaseUrl)} \\`,
    '  -H "Content-Type: application/json" \\',
    `  -H "Authorization: Bearer ${apiKey}" \\`,
    `  -d '${shellSingleQuote(body)}'`,
  ].join('\n')
}

function toPythonLiteral(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (value === null || value === undefined) return 'None'
  return JSON.stringify(value)
}

export function buildPlaygroundPython(
  apiBaseUrl: string,
  request: PlaygroundCodeRequest,
  apiKey: string = CODE_SAMPLE_API_KEY_PLACEHOLDER
): string {
  const messageLines = request.messages.map(
    (message) =>
      `        {"role": ${toPythonLiteral(message.role)}, "content": ${toPythonLiteral(message.content)}},`
  )
  const parameterLines = Object.entries(request)
    .filter(([key]) => key !== 'model' && key !== 'messages')
    .map(([key, value]) => `    ${key}=${toPythonLiteral(value)},`)

  return [
    'from openai import OpenAI',
    '',
    'client = OpenAI(',
    `    base_url=${toPythonLiteral(toOpenAiBaseUrl(apiBaseUrl))},`,
    `    api_key=${toPythonLiteral(apiKey)},`,
    ')',
    '',
    'completion = client.chat.completions.create(',
    `    model=${toPythonLiteral(request.model)},`,
    '    messages=[',
    ...messageLines,
    '    ],',
    ...parameterLines,
    ')',
    '',
    'print(completion.choices[0].message.content)',
  ].join('\n')
}
