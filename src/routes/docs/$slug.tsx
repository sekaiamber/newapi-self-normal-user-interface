/*
 * [user-ui] 私有文档页路由（本仓库新增文件，非官方代码）。
 * 未注册的 slug 抛出 notFound()，交给根路由的 404 处理。
 */
import { createFileRoute, notFound } from '@tanstack/react-router'

import { DocsPage } from '@/features/docs'
import { getDocPage } from '@/features/docs/lib/registry'

export const Route = createFileRoute('/docs/$slug')({
  beforeLoad: ({ params }) => {
    if (!getDocPage(params.slug)) throw notFound()
  },
  component: DocsSlugRoute,
})

function DocsSlugRoute() {
  const params = Route.useParams()
  return <DocsPage slug={params.slug} />
}
