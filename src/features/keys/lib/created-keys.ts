/*
 * [user-ui] 找回刚创建的密钥（本仓库新增文件，非官方代码）。
 *
 * 创建接口 POST /api/token/ 只返回 { success, message }，不带新密钥的 id
 * （官方文档 api/management/token-management/token-post.md 没有响应结构，
 * 2026-10-05 在本地 v1.0.0-rc.37 实例上实测确认）。官方流程是"保存后去列表复制"
 * （guide/feature-guide/user/token.md 第 4 步）。
 *
 * 为了在创建成功后直接展示密钥（审计 2.5 K1），这里按名称在列表里找回它们：
 * 名称由前端在提交时确定；同名密钥取 id 最大的一个（自增 id，最新创建）。
 * 先查第一页列表，找不到的再按名称精确搜索。只调用 ../api 里已有的接口函数。
 */
import { getApiKeys, searchApiKeys } from '../api'
import type { ApiKey } from '../types'

/** 列表兜底时最多逐个搜索的名称数量，避免批量创建时请求过多。 */
const MAX_NAME_SEARCHES = 10

/**
 * 从若干候选中，为每个名称挑出 id 最大的密钥。
 * 返回顺序与 names 一致，找不到的名称跳过。
 */
export function pickCreatedKeys(
  names: readonly string[],
  candidates: readonly ApiKey[]
): ApiKey[] {
  const wanted = new Set(names)
  const newest = new Map<string, ApiKey>()
  for (const item of candidates) {
    if (!wanted.has(item.name)) continue
    const previous = newest.get(item.name)
    if (!previous || item.id > previous.id) newest.set(item.name, item)
  }
  return names.flatMap((name) => {
    const found = newest.get(name)
    return found ? [found] : []
  })
}

/** 按名称找回刚创建的密钥（只含掩码 key；完整密钥另行获取）。 */
export async function locateCreatedApiKeys(
  names: readonly string[]
): Promise<ApiKey[]> {
  if (names.length === 0) return []

  const candidates: ApiKey[] = []
  const recent = await getApiKeys({
    p: 1,
    size: Math.min(100, names.length + 20),
  })
  if (recent.success) candidates.push(...(recent.data?.items ?? []))

  let found = pickCreatedKeys(names, candidates)
  if (found.length === names.length) return found

  const foundNames = new Set(found.map((item) => item.name))
  const missing = names
    .filter((name) => !foundNames.has(name))
    .slice(0, MAX_NAME_SEARCHES)
  for (const name of missing) {
    const result = await searchApiKeys({ keyword: name, p: 1, size: 20 })
    if (result.success) candidates.push(...(result.data?.items ?? []))
  }

  found = pickCreatedKeys(names, candidates)
  return found
}
