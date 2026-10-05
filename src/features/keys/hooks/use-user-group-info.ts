/*
 * [user-ui] 当前用户可选的分组信息（本仓库新增文件，非官方代码）。
 *
 * Adapted from QuantumNous/new-api web/src/features/keys/components/api-keys-columns.tsx
 * @ v1.0.0-rc.37 (AGPL-3.0)：原 useGroupRatios 只取倍率，这里同时取管理员写的分组说明
 * （desc），供分组单元格提示使用；查询键与请求不变。
 */
import { useQuery } from '@tanstack/react-query'

import { getUserGroups } from '@/lib/api'
import { requireServerSuccess } from '@/lib/server-error-message'

export type UserGroupInfo = {
  ratios: Record<string, number | string>
  descs: Record<string, string>
}

const EMPTY_GROUP_INFO: UserGroupInfo = { ratios: {}, descs: {} }

export function useUserGroupInfo(): UserGroupInfo {
  const { data } = useQuery({
    queryKey: ['user-groups'],
    queryFn: async () => requireServerSuccess(await getUserGroups()),
    staleTime: 0,
    select: (res) => {
      if (!res.success || !res.data) return EMPTY_GROUP_INFO
      const info: UserGroupInfo = { ratios: {}, descs: {} }
      for (const [group, item] of Object.entries(res.data)) {
        if (typeof item.ratio === 'number' || typeof item.ratio === 'string') {
          info.ratios[group] = item.ratio
        }
        if (typeof item.desc === 'string' && item.desc) {
          info.descs[group] = item.desc
        }
      }
      return info
    },
  })

  return data ?? EMPTY_GROUP_INFO
}
