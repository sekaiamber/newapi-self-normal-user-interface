/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 文档正文中链接的分类：页内锚点、站内路由、外部链接。
 */

export type DocLinkTarget =
  | { kind: 'hash'; id: string }
  | { kind: 'internal'; href: string }
  | { kind: 'external' }

function decodeFragment(fragment: string): string {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}

/** Element id from a URL hash such as `#%E6%B5%81` (leading `#` optional). */
export function hashToId(hash: string): string {
  return decodeFragment(hash.replace(/^#/, ''))
}

/**
 * Classify a link found in rendered Markdown. Same-origin links are handled by
 * the router instead of opening a new tab.
 */
export function resolveDocLink(href: string, origin: string): DocLinkTarget {
  if (href.startsWith('#')) {
    return { kind: 'hash', id: hashToId(href) }
  }

  let url: URL
  try {
    url = new URL(href, origin)
  } catch {
    return { kind: 'external' }
  }

  if (url.origin !== origin) {
    return { kind: 'external' }
  }

  return { kind: 'internal', href: `${url.pathname}${url.search}${url.hash}` }
}
