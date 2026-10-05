/*
 * [user-ui] "密钥已创建"对话框（本仓库新增文件，非官方代码；审计 2.5 K1）。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { overridesEn } from '@/i18n/overrides'
import { api } from '@/lib/api'

import { apiKeySchema, type ApiKey } from '../../types'
import { ApiKeyCreatedDialog } from '../api-key-created-dialog'
import { ApiKeysProvider, useApiKeys } from '../api-keys-provider'

const i18n = createInstance()
await i18n.init({
  lng: 'en',
  resources: { en: { translation: { ...overridesEn } } },
  initAsync: false,
})

function apiKey(id: number, name: string, extra: Partial<ApiKey> = {}): ApiKey {
  return apiKeySchema.parse({
    id,
    name,
    key: 'abcd****wxyz',
    status: 1,
    remain_quota: 0,
    used_quota: 0,
    unlimited_quota: true,
    expired_time: -1,
    created_time: 1_700_000_000,
    accessed_time: 0,
    model_limits_enabled: false,
    ...extra,
  })
}

function Opener(props: { names: string[] }) {
  const { showCreatedKeys } = useApiKeys()
  return (
    <button type='button' onClick={() => showCreatedKeys(props.names)}>
      open-created
    </button>
  )
}

const clients: QueryClient[] = []

async function renderDialog(options: {
  names: string[]
  items: ApiKey[]
  chats?: Array<Record<string, string>>
}) {
  vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
    if (url.startsWith('/api/token/')) {
      return {
        data: {
          success: true,
          data: { items: options.items, total: options.items.length },
        },
      }
    }
    if (url === '/api/user/models') {
      return { data: { success: true, data: ['model-a', 'model-b'] } }
    }
    return { data: { success: true, data: {} } }
  })
  const post = vi.spyOn(api, 'post').mockImplementation(async (url: string) => {
    if (url === '/api/token/batch/keys') {
      return {
        data: {
          success: true,
          data: {
            keys: Object.fromEntries(
              options.items.map((item) => [item.id, `full-${item.id}`])
            ),
          },
        },
      }
    }
    const id = /\/api\/token\/(\d+)\/key/.exec(url)?.[1]
    return { data: { success: true, data: { key: `full-${id}` } } }
  })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(
    ['status'],
    { chats: options.chats ?? [] },
    { updatedAt: Date.now() + 60_000 }
  )
  clients.push(client)

  const root = createRootRoute()
  const page = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => (
      <ApiKeysProvider>
        <Opener names={options.names} />
        <ApiKeyCreatedDialog />
      </ApiKeysProvider>
    ),
  })
  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  await router.load()
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>
  )
  await userEvent.click(await screen.findByText('open-created'))
  return { post, dialog: await screen.findByRole('dialog') }
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  clients.splice(0).forEach((client) => client.clear())
})

test('shows the full key, Base URL and a ready-to-run curl after creating one key', async () => {
  const { dialog, post } = await renderDialog({
    names: ['my-app'],
    items: [apiKey(9, 'my-app'), apiKey(3, 'my-app')],
  })
  expect(within(dialog).getByText('Key created')).toBeInTheDocument()
  expect(await within(dialog).findByText('sk-full-9')).toBeInTheDocument()
  expect(post).toHaveBeenCalledWith('/api/token/9/key')
  const origin = window.location.origin
  expect(within(dialog).getByText(`${origin}/v1`)).toBeInTheDocument()
  const curl = await within(dialog).findByText(/curl /)
  expect(curl.textContent).toContain(`${origin}/v1/chat/completions`)
  expect(curl.textContent).toContain('Authorization: Bearer sk-full-9')
  expect(curl.textContent).toContain('"model":"model-a"')
  expect(
    within(dialog).getByRole('button', {
      name: /Claude Code \/ Codex \/ Gemini CLI/,
    })
  ).toBeInTheDocument()
  expect(
    within(dialog).getByRole('link', { name: 'Read the setup guide' })
  ).toHaveAttribute('href', '/docs')
})

test('uses the first allowed model of a restricted key in the curl example', async () => {
  const { dialog } = await renderDialog({
    names: ['limited'],
    items: [
      apiKey(5, 'limited', {
        model_limits_enabled: true,
        model_limits: 'model-z,model-y',
      }),
    ],
  })
  const curl = await within(dialog).findByText(/curl /)
  expect(curl.textContent).toContain('"model":"model-z"')
})

test('lists chat apps but leaves the CC Switch shortcut to its own button', async () => {
  const { dialog } = await renderDialog({
    names: ['my-app'],
    items: [apiKey(9, 'my-app')],
    chats: [
      {
        'Cherry Studio':
          'cherrystudio://providers/api-keys?v=1&data={cherryConfig}',
      },
      { 'CC Switch': 'ccswitch' },
    ],
  })
  await within(dialog).findByText('sk-full-9')
  await userEvent.click(
    within(dialog).getByRole('button', { name: /Chat apps/ })
  )
  const menu = await screen.findByRole('menu')
  expect(
    within(menu).getByRole('menuitem', { name: 'Cherry Studio' })
  ).toBeInTheDocument()
  expect(
    within(menu).queryByRole('menuitem', { name: 'CC Switch' })
  ).not.toBeInTheDocument()
})

test('lists every key with a copy-all action after a bulk creation', async () => {
  const { dialog, post } = await renderDialog({
    names: ['bulk', 'bulk-a1b2c3'],
    items: [apiKey(21, 'bulk-a1b2c3'), apiKey(20, 'bulk')],
  })
  expect(within(dialog).getByText('2 keys created')).toBeInTheDocument()
  expect(await within(dialog).findByText('sk-full-20')).toBeInTheDocument()
  expect(within(dialog).getByText('sk-full-21')).toBeInTheDocument()
  expect(post).toHaveBeenCalledWith('/api/token/batch/keys', { ids: [20, 21] })
  expect(
    within(dialog).getByRole('button', { name: 'Copy all' })
  ).toBeInTheDocument()
})

test('still explains where to get the key when it cannot be found', async () => {
  const { dialog } = await renderDialog({ names: ['ghost'], items: [] })
  expect(
    await within(dialog).findByText(overridesEn['keys.created.keyUnavailable'])
  ).toBeInTheDocument()
  expect(
    within(dialog).getByText(`${window.location.origin}/v1`)
  ).toBeInTheDocument()
})
