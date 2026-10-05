/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 * 文档页面注册表：只含元数据（不含正文），路由守卫可以直接引用而不把正文打进主包。
 * titleKey / descriptionKey 是 i18n 键，组件中用 t() 渲染。
 */

export type DocSectionId = 'getting-started' | 'guides' | 'help'

export interface DocSection {
  id: DocSectionId
  titleKey: string
}

export interface DocPageMeta {
  slug: string
  section: DocSectionId
  titleKey: string
  descriptionKey: string
}

export interface DocSectionGroup {
  section: DocSection
  pages: DocPageMeta[]
}

export const DOC_SECTIONS: readonly DocSection[] = [
  { id: 'getting-started', titleKey: 'Getting started' },
  { id: 'guides', titleKey: 'Guides' },
  { id: 'help', titleKey: 'Help' },
]

/** Reading order; previous/next links follow this list. */
export const DOC_PAGES: readonly DocPageMeta[] = [
  {
    slug: 'quick-start',
    section: 'getting-started',
    titleKey: 'Quick start',
    descriptionKey:
      'Sign in, create an API key and send your first request in a few minutes.',
  },
  {
    slug: 'api-basics',
    section: 'guides',
    titleKey: 'API basics',
    descriptionKey:
      'Base URLs, authentication, OpenAI, Claude and Gemini formats, model list and streaming.',
  },
  {
    slug: 'tokens-and-quota',
    section: 'guides',
    titleKey: 'API keys and quota',
    descriptionKey:
      'What each API key option does, and how account balance differs from key quota.',
  },
  {
    slug: 'clients',
    section: 'guides',
    titleKey: 'Client setup',
    descriptionKey:
      'Connect Claude Code, Codex CLI, Cherry Studio, CC Switch and other clients.',
  },
  {
    slug: 'faq',
    section: 'help',
    titleKey: 'Common issues',
    descriptionKey:
      'Invalid keys, insufficient quota, unavailable models, rate limits and streaming problems.',
  },
]

export function getDocPage(slug: string): DocPageMeta | undefined {
  return DOC_PAGES.find((page) => page.slug === slug)
}

export function getDocSection(id: DocSectionId): DocSection | undefined {
  return DOC_SECTIONS.find((section) => section.id === id)
}

export function getAdjacentDocPages(slug: string): {
  previous?: DocPageMeta
  next?: DocPageMeta
} {
  const index = DOC_PAGES.findIndex((page) => page.slug === slug)
  if (index === -1) return {}
  return {
    previous: index > 0 ? DOC_PAGES[index - 1] : undefined,
    next: index < DOC_PAGES.length - 1 ? DOC_PAGES[index + 1] : undefined,
  }
}

export function getDocSectionGroups(): DocSectionGroup[] {
  return DOC_SECTIONS.map((section) => ({
    section,
    pages: DOC_PAGES.filter((page) => page.section === section.id),
  })).filter((group) => group.pages.length > 0)
}
