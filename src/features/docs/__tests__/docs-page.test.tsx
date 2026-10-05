/*
 * [user-ui] 私有文档（本仓库新增文件，非官方代码）。
 */
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  notFound,
  RouterProvider,
} from '@tanstack/react-router'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Docs, DocsPage } from '..'
import { DocsArticle } from '../components/docs-article'
import { getDocContent } from '../content'
import {
  extractDocHeadings,
  splitDocSegments,
  stripLeadingComment,
} from '../lib/markdown'
import { DOC_PAGES, getDocPage } from '../lib/registry'

vi.mock('@/components/layout', () => ({
  PublicLayout: (props: { children: ReactNode }) => (
    <div data-testid='public-layout'>{props.children}</div>
  ),
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({
    status: {
      system_name: 'SwarmRouter',
      server_address: 'https://api.example.com/',
    },
    loading: false,
    error: null,
  }),
}))

beforeEach(() => {
  // jsdom has no scrolling; the router resets scroll after each navigation.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
})

async function renderDocs(path: string) {
  const root = createRootRoute({
    notFoundComponent: () => <p>route not found</p>,
  })
  const landing = createRoute({
    getParentRoute: () => root,
    path: '/docs/',
    component: Docs,
  })
  // Mirrors src/routes/docs/$slug.tsx.
  const page = createRoute({
    getParentRoute: () => root,
    path: '/docs/$slug',
    beforeLoad: ({ params }) => {
      if (!getDocPage(params.slug)) throw notFound()
    },
    component: function DocsSlug() {
      return <DocsPage slug={page.useParams().slug} />
    },
  })
  const router = createRouter({
    routeTree: root.addChildren([landing, page]),
    history: createMemoryHistory({ initialEntries: [path] }),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  return router
}

describe('docs pages', () => {
  it('renders a page with placeholders, heading anchors and copyable code', async () => {
    await renderDocs('/docs/api-basics')

    const title = await screen.findByRole('heading', {
      level: 1,
      name: 'API basics',
    })
    const article = title.closest('article') as HTMLElement
    const text = article.textContent ?? ''

    expect(text).toContain('https://api.example.com/v1/chat/completions')
    expect(text).toContain('SwarmRouter')
    expect(text).not.toMatch(/\{\{(?:SITE_NAME|BASE_URL)\}\}/)
    expect(text).not.toContain('Maintainer note')

    expect(article.querySelector('h2[id="列出可用模型"]')).not.toBeNull()
    expect(article.querySelectorAll('h2:not([id]), h3:not([id])')).toHaveLength(
      0
    )

    const codeBlocks = splitDocSegments(
      stripLeadingComment(getDocContent('api-basics') ?? '')
    ).filter((segment) => segment.kind === 'code')
    expect(
      within(article).getAllByRole('button', { name: 'Copy code' })
    ).toHaveLength(codeBlocks.length)

    const toc = screen.getByRole('navigation', { name: 'On this page' })
    expect(within(toc).getByRole('link', { name: '流式输出' })).toHaveAttribute(
      'href',
      `#${encodeURIComponent('流式输出')}`
    )

    expect(screen.getByRole('link', { name: /Previous page/ })).toHaveAttribute(
      'href',
      '/docs/quick-start'
    )
    expect(screen.getByRole('link', { name: /Next page/ })).toHaveAttribute(
      'href',
      '/docs/tokens-and-quota'
    )
  })

  it('opens in-content links to other doc pages inside the app', async () => {
    const router = await renderDocs('/docs/api-basics')
    const title = await screen.findByRole('heading', { level: 1 })
    const article = title.closest('article') as HTMLElement

    const faqLink = within(article).getAllByRole('link', {
      name: '常见问题',
    })[0]
    fireEvent.click(faqLink)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Common issues' })
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/docs/faq')
  })

  it('uses the not-found handling for unknown slugs', async () => {
    await renderDocs('/docs/does-not-exist')
    expect(await screen.findByText('route not found')).toBeInTheDocument()
  })

  it('lists every page on the landing page with the API base URL', async () => {
    await renderDocs('/docs')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'SwarmRouter Docs' })
    ).toBeInTheDocument()
    expect(screen.getAllByText('https://api.example.com/v1').length).toBe(1)

    const main = screen.getByTestId('public-layout')
    for (const docPage of DOC_PAGES) {
      expect(
        main.querySelectorAll(`a[href="/docs/${docPage.slug}"]`).length
      ).toBeGreaterThan(0)
    }
  })
})

describe('DocsArticle re-renders', () => {
  it('keeps heading ids and the rendered HTML across parent re-renders', async () => {
    const markdown = '## 第一节\n\n正文\n\n```bash\necho 1\n```\n\n## 第二节'
    const headings = extractDocHeadings(markdown)

    function Harness() {
      const [count, setCount] = useState(0)
      return (
        <>
          <button type='button' onClick={() => setCount(count + 1)}>
            rerender {count}
          </button>
          <DocsArticle markdown={markdown} headings={headings} />
        </>
      )
    }

    const root = createRootRoute({ component: Harness })
    const router = createRouter({
      routeTree: root,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })
    await router.load()
    render(<RouterProvider router={router} />)

    const first = await screen.findByRole('heading', { name: '第一节' })
    expect(first).toHaveAttribute('id', '第一节')

    fireEvent.click(screen.getByRole('button', { name: 'rerender 0' }))
    await screen.findByRole('button', { name: 'rerender 1' })

    expect(first.isConnected).toBe(true)
    expect(screen.getByRole('heading', { name: '第一节' })).toBe(first)
    expect(screen.getByRole('heading', { name: '第二节' })).toHaveAttribute(
      'id',
      '第二节'
    )
  })
})
