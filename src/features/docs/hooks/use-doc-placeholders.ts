/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 */
import { useMemo } from 'react'

import { useStatus } from '@/hooks/use-status'

import {
  resolveDocPlaceholderValues,
  type DocPlaceholderValues,
} from '../lib/placeholders'

/**
 * `{{SITE_NAME}}` comes from the admin-configured `system_name`; `{{BASE_URL}}`
 * from `server_address`, falling back to the current origin.
 */
export function useDocPlaceholderValues(): DocPlaceholderValues {
  const { status } = useStatus()
  const systemName = status?.system_name
  const serverAddress = status?.server_address

  return useMemo(
    () =>
      resolveDocPlaceholderValues({
        systemName,
        serverAddress,
        origin: window.location.origin,
        hostname: window.location.hostname,
      }),
    [systemName, serverAddress]
  )
}
