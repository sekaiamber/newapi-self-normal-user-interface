/*
 * [user-ui] 密钥页复制用的接入文本（本仓库新增文件，非官方代码）。
 */
import { toOpenAiBaseUrl } from '@/lib/api-endpoint'

/**
 * "复制接口地址和密钥"的内容：OpenAI 兼容的 Base URL（带 /v1）加完整密钥，
 * 两行纯文本，方便粘贴到客户端或发给同事。标签用英文，与各客户端的字段名一致。
 */
export function formatBaseUrlAndKey(apiBaseUrl: string, key: string): string {
  return [`Base URL: ${toOpenAiBaseUrl(apiBaseUrl)}`, `API Key: ${key}`].join(
    '\n'
  )
}
