/*
 * [user-ui] 首页"三步接入"的代码示例（本仓库新增文件，非官方代码）。
 *
 * 地址一律来自 lib/api-endpoint.ts（与密钥页、文档一致）；curl 直接用共享的 buildChatCurl。
 * Python 示例依据官方文档 guide/feature-guide/user/api.md 的 OpenAI SDK 写法（只改 base_url 与 api_key）；
 * Node.js 用同一个 OpenAI 兼容接口（openai npm 包的 baseURL / apiKey 参数）。
 * 模型名与密钥都是占位：密钥从环境变量 API_KEY 读取，模型名请换成 GET /v1/models 返回的 id。
 */
import { buildChatCurl, toOpenAiBaseUrl } from '@/lib/api-endpoint'

export const SAMPLE_MODEL = 'your-model'
export const SAMPLE_PROMPT = 'Hello!'

export type CodeSampleId = 'curl' | 'python' | 'node'

export interface CodeSample {
  id: CodeSampleId
  /** 标签名（工具/语言名，不翻译） */
  label: string
  code: string
}

export interface CurlComments {
  /** 形如 "# 你的 API 密钥" */
  setKey: string
  listModels: string
  chat: string
}

export function buildCodeSamples(
  apiBaseUrl: string,
  comments: CurlComments
): CodeSample[] {
  const baseUrl = toOpenAiBaseUrl(apiBaseUrl)

  const curl = [
    comments.setKey,
    'export API_KEY="sk-..."',
    '',
    comments.listModels,
    `curl ${baseUrl}/models \\`,
    '  -H "Authorization: Bearer $API_KEY"',
    '',
    comments.chat,
    buildChatCurl({
      apiBaseUrl,
      apiKey: '$API_KEY',
      model: SAMPLE_MODEL,
      prompt: SAMPLE_PROMPT,
    }),
  ].join('\n')

  const python = [
    'import os',
    'from openai import OpenAI',
    '',
    'client = OpenAI(',
    `    base_url="${baseUrl}",`,
    '    api_key=os.environ["API_KEY"],',
    ')',
    '',
    'response = client.chat.completions.create(',
    `    model="${SAMPLE_MODEL}",`,
    `    messages=[{"role": "user", "content": "${SAMPLE_PROMPT}"}],`,
    ')',
    'print(response.choices[0].message.content)',
  ].join('\n')

  const node = [
    'import OpenAI from "openai";',
    '',
    'const client = new OpenAI({',
    `  baseURL: "${baseUrl}",`,
    '  apiKey: process.env.API_KEY,',
    '});',
    '',
    'const response = await client.chat.completions.create({',
    `  model: "${SAMPLE_MODEL}",`,
    `  messages: [{ role: "user", content: "${SAMPLE_PROMPT}" }],`,
    '});',
    'console.log(response.choices[0].message.content);',
  ].join('\n')

  return [
    { id: 'curl', label: 'curl', code: curl },
    { id: 'python', label: 'Python', code: python },
    { id: 'node', label: 'Node.js', code: node },
  ]
}

export interface CodeToken {
  /** 在行内的起始位置（同一行内唯一，可作 React key） */
  offset: number
  text: string
  /** string：引号内的字面量（强调色）；comment：以 # 开头的整行注释（弱化） */
  kind: 'plain' | 'string' | 'comment'
}

const STRING_LITERAL = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g

/** 极简高亮：只区分注释行、字符串字面量与其余文本，不引入语法高亮依赖。 */
export function tokenizeCodeLine(line: string): CodeToken[] {
  if (line.trimStart().startsWith('#')) {
    return [{ offset: 0, text: line, kind: 'comment' }]
  }
  const tokens: CodeToken[] = []
  let cursor = 0
  for (const match of line.matchAll(STRING_LITERAL)) {
    const start = match.index ?? 0
    if (start > cursor) {
      tokens.push({
        offset: cursor,
        text: line.slice(cursor, start),
        kind: 'plain',
      })
    }
    tokens.push({ offset: start, text: match[0], kind: 'string' })
    cursor = start + match[0].length
  }
  if (cursor < line.length) {
    tokens.push({ offset: cursor, text: line.slice(cursor), kind: 'plain' })
  }
  return tokens
}
