/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 */
import { describe, expect, it } from 'vitest'

import { DOC_CONTENT, getDocContent } from '../content'
import { DOCS_TRANSLATIONS } from '../lib/i18n'
import { extractDocHeadings, stripLeadingComment } from '../lib/markdown'
import {
  DOC_PAGES,
  DOC_SECTIONS,
  getAdjacentDocPages,
  getDocPage,
  getDocSection,
  getDocSectionGroups,
} from '../lib/registry'

const slugs = DOC_PAGES.map((page) => page.slug)

function renderedContent(slug: string): string {
  return stripLeadingComment(getDocContent(slug) ?? '')
}

describe('doc page registry', () => {
  it('has unique, URL-safe slugs', () => {
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })

  it('has content for every registered slug and no unregistered content', () => {
    for (const slug of slugs) {
      expect(renderedContent(slug).trim().length).toBeGreaterThan(200)
    }
    expect(Object.keys(DOC_CONTENT).sort()).toEqual([...slugs].sort())
  })

  it('assigns every page to a known section', () => {
    for (const page of DOC_PAGES) {
      expect(getDocSection(page.section)).toBeDefined()
    }
  })

  it('keeps reading order consistent with the section order', () => {
    const grouped = getDocSectionGroups().flatMap((group) =>
      group.pages.map((page) => page.slug)
    )
    expect(grouped).toEqual(slugs)
    expect(getDocSectionGroups().map((group) => group.section.id)).toEqual(
      DOC_SECTIONS.filter((section) =>
        DOC_PAGES.some((page) => page.section === section.id)
      ).map((section) => section.id)
    )
  })

  it('links previous and next pages in reading order', () => {
    expect(getAdjacentDocPages(slugs[0]).previous).toBeUndefined()
    expect(getAdjacentDocPages(slugs.at(-1) ?? '').next).toBeUndefined()
    for (let index = 1; index < slugs.length; index += 1) {
      expect(getAdjacentDocPages(slugs[index]).previous?.slug).toBe(
        slugs[index - 1]
      )
      expect(getAdjacentDocPages(slugs[index - 1]).next?.slug).toBe(
        slugs[index]
      )
    }
  })

  it('translates every title, description and section into Chinese', () => {
    const keys = [
      ...DOC_SECTIONS.map((section) => section.titleKey),
      ...DOC_PAGES.flatMap((page) => [page.titleKey, page.descriptionKey]),
    ]
    for (const language of ['zhCN', 'zhTW']) {
      for (const key of keys) {
        expect(
          DOCS_TRANSLATIONS[language][key],
          `${language}: ${key}`
        ).toBeTruthy()
      }
    }
  })
})

describe('slug lookup', () => {
  it('finds registered pages', () => {
    expect(getDocPage('quick-start')?.titleKey).toBe('Quick start')
  })

  it.each(['unknown', '', 'Quick-Start', 'toString', '__proto__'])(
    'returns nothing for unknown slug %j',
    (slug) => {
      expect(getDocPage(slug)).toBeUndefined()
      expect(getDocContent(slug)).toBeUndefined()
      expect(getAdjacentDocPages(slug)).toEqual({})
    }
  )
})

describe('doc content', () => {
  it('lists the official doc sources in a leading maintainer comment', () => {
    for (const slug of slugs) {
      const raw = getDocContent(slug) ?? ''
      expect(raw.startsWith('<!--'), slug).toBe(true)
      expect(raw.slice(0, raw.indexOf('-->')), slug).toContain(
        'docs/official/en/'
      )
      expect(renderedContent(slug), slug).not.toContain('<!--')
    }
  })

  it('leaves the page title (h1) to the page header', () => {
    for (const slug of slugs) {
      expect(renderedContent(slug), slug).not.toMatch(/^# /m)
    }
  })

  it('does not mention features disabled in this UI or the upstream brand', () => {
    const forbidden = [
      '/pricing',
      '/rankings',
      '/about',
      '模型广场',
      '排行榜',
      '邀请',
      '推荐计划',
      '返利',
      'New API',
      'NewAPI',
      'newapi',
    ]
    for (const slug of slugs) {
      const text = renderedContent(slug)
      for (const term of forbidden) {
        expect(text.includes(term), `${slug} mentions ${term}`).toBe(false)
      }
    }
  })

  it('only links to registered doc pages and existing headings', () => {
    const linkPattern = /\]\((\/docs\/[^)#\s]*)?(#[^)\s]+)?\)/g
    for (const slug of slugs) {
      for (const match of renderedContent(slug).matchAll(linkPattern)) {
        const [, path, hash] = match
        if (!path && !hash) continue
        const targetSlug = path ? path.replace(/^\/docs\/?/, '') : slug
        if (path) {
          expect(getDocPage(targetSlug), `${slug} -> ${path}`).toBeDefined()
        }
        if (hash) {
          const ids = extractDocHeadings(renderedContent(targetSlug)).map(
            (heading) => heading.id
          )
          expect(ids, `${slug} -> ${match[0]}`).toContain(hash.slice(1))
        }
      }
    }
  })

  it('uses the placeholders instead of hard-coded addresses', () => {
    for (const slug of slugs) {
      const text = renderedContent(slug)
      expect(text, slug).not.toMatch(
        /https?:\/\/(?:your-host|your-platform|api\.example\.com)/
      )
    }
    expect(renderedContent('quick-start')).toContain('{{BASE_URL}}')
    expect(renderedContent('clients')).toContain('{{BASE_URL}}')
  })
})
