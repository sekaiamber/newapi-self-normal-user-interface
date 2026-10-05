/*
 * [user-ui] 账户活动表格的默认列与客户端显示（审计 2.8 A2）测试（本仓库新增文件，非官方代码）。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import { AuditLogViewer } from '../components/audit-log-viewer'
import { auditClientLabel } from '../lib/audit-client'

const CHROME_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'

// The first data-table render is slow on a loaded machine; wait for the row explicitly.
const FIRST_ROW = { timeout: 10000 }

const entry = {
  event_id: 'login-1',
  created_at: 1788600600,
  username: 'alice',
  category: 'login',
  action: 'user.login',
  content: '',
  other: {},
  user_agent: CHROME_MAC,
  method: 'POST',
  route: '/api/user/login',
  ip: '203.0.113.7',
  status: 200,
  success: true,
}

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  })
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { success: true, data: { total: 1, items: [entry] } },
  })
})

afterEach(() => {
  useAuthStore.getState().auth.reset()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function renderViewer(props: { scope: 'all' | 'self'; accessOnly?: boolean }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <AuditLogViewer {...props} currentTokenRef='' />
    </QueryClientProvider>
  )
}

async function headers() {
  await screen.findByRole('cell', { name: '203.0.113.7' }, FIRST_ROW)
  return screen
    .getAllByRole('columnheader')
    .map((header) => header.textContent?.trim())
}

describe('account activity table', () => {
  it('own records hide the username and request columns by default', async () => {
    renderViewer({ scope: 'self' })
    const names = await headers()
    expect(names).toEqual(
      expect.arrayContaining(['Time', 'Event', 'IP', 'Client', 'Result'])
    )
    expect(names).not.toContain('Username')
    expect(names).not.toContain('Method')
    expect(names).not.toContain('Route')
    expect(names).not.toContain('HTTP')
  })

  it('shows a browser client as browser and system', async () => {
    renderViewer({ scope: 'self' })
    const row = (
      await screen.findByRole('cell', { name: '203.0.113.7' }, FIRST_ROW)
    ).parentElement as HTMLElement
    expect(
      within(row).getByRole('cell', { name: 'Chrome · macOS' })
    ).toBeVisible()
  })

  it('the administrator "all" scope keeps the username column', async () => {
    renderViewer({ scope: 'all' })
    expect(await headers()).toContain('Username')
  })

  it('the access-token history keeps method and route visible', async () => {
    renderViewer({ scope: 'self', accessOnly: true })
    const names = await headers()
    expect(names).toEqual(expect.arrayContaining(['Method', 'Route', 'HTTP']))
  })
})

describe('client label', () => {
  it('summarises known browsers', () => {
    expect(auditClientLabel(CHROME_MAC)).toBe('Chrome · macOS')
  })

  it('keeps unknown clients unchanged and empty values empty', () => {
    expect(auditClientLabel('curl/8.4.0')).toBe('curl/8.4.0')
    expect(auditClientLabel('node')).toBe('node')
    expect(auditClientLabel('')).toBe('')
    expect(auditClientLabel(undefined)).toBe('')
  })
})
