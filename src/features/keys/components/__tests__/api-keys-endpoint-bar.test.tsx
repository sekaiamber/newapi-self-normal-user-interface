/*
 * [user-ui] 密钥页接口地址条（本仓库新增文件，非官方代码；审计 2.5 K1）。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, expect, test } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'
import { overridesEn } from '@/i18n/overrides'

import { ApiKeysEndpointBar } from '../api-keys-endpoint-bar'

const i18n = createInstance()
await i18n.init({
  lng: 'en',
  resources: { en: { translation: { ...overridesEn } } },
  initAsync: false,
})

afterEach(() => cleanup())

async function renderBar(status: Record<string, unknown>) {
  const client = new QueryClient()
  client.setQueryData(['status'], status, { updatedAt: Date.now() + 60_000 })
  const root = createRootRoute()
  const page = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: ApiKeysEndpointBar,
  })
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </QueryClientProvider>
    </I18nextProvider>
  )
}

test('shows the admin-configured server address as an OpenAI-compatible Base URL', async () => {
  await renderBar({ server_address: 'https://api.example.com/' })
  expect(
    await screen.findByText('https://api.example.com/v1')
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Copy Base URL' })
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Setup guide/ })).toHaveAttribute(
    'href',
    '/docs/clients'
  )
})

test('falls back to the current origin without a server address', async () => {
  await renderBar({})
  expect(
    await screen.findByText(`${window.location.origin}/v1`)
  ).toBeInTheDocument()
})
