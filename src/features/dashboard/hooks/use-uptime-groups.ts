/*
 * [user-ui] 服务状态（Uptime Kuma 分组）数据（本仓库新增文件，非官方代码）。
 *
 * 官方 UptimePanel 在组件内部用 useEffect 请求 /api/uptime/status，概览页因此无法在渲染前
 * 知道有没有内容，只能先画一个空卡片。这里把同一个请求提到 React Query 里，概览页与面板共用
 * 一份数据（同一 queryKey 去重）。请求与失败处理保持官方行为：失败时当作没有数据，不弹提示。
 */
import { useQuery } from '@tanstack/react-query'

import { getUptimeStatus } from '../api'
import type { UptimeGroupResult } from '../types'

export const UPTIME_GROUPS_QUERY_KEY = ['dashboard', 'overview', 'uptime']

export function useUptimeGroups(enabled = true) {
  return useQuery({
    queryKey: UPTIME_GROUPS_QUERY_KEY,
    queryFn: async (): Promise<UptimeGroupResult[]> => {
      try {
        const res = await getUptimeStatus()
        return res?.data || []
      } catch {
        return []
      }
    },
    enabled,
    staleTime: 60 * 1000,
  })
}
