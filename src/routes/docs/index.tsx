/*
 * [user-ui] 私有文档路由（本仓库新增文件，非官方代码）。
 */
import { createFileRoute } from '@tanstack/react-router'

import { Docs } from '@/features/docs'

export const Route = createFileRoute('/docs/')({
  component: Docs,
})
