/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 文档正文：Markdown 以原始字符串导入（`?raw`）。
 * 扩展名用 `.md.txt`：Rsbuild 只对已知资源类型（含 txt）提供 `?raw`，`.md` 需要在
 * rsbuild.config.ts 中加 `source.assetsInclude: /\.md$/` 后才能直接导入。
 * 每个文件顶部的 HTML 注释列出所依据的官方文档路径，渲染前会被去掉。
 */
import apiBasics from './api-basics.md.txt?raw'
import clients from './clients.md.txt?raw'
import faq from './faq.md.txt?raw'
import quickStart from './quick-start.md.txt?raw'
import tokensAndQuota from './tokens-and-quota.md.txt?raw'

/** Keyed by `DocPageMeta.slug` in `../lib/registry.ts`. */
export const DOC_CONTENT: Readonly<Record<string, string>> = {
  'quick-start': quickStart,
  'api-basics': apiBasics,
  'tokens-and-quota': tokensAndQuota,
  clients,
  faq,
}

export function getDocContent(slug: string): string | undefined {
  return Object.hasOwn(DOC_CONTENT, slug) ? DOC_CONTENT[slug] : undefined
}
