/*
 * [user-ui] 侧边栏个人设置卡片的交互测试（本仓库新增文件，非官方代码）。
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

import { SidebarModulesCard } from '../components/sidebar-modules-card'

// Wallet enabled, as in the current SwarmRouter configuration.
vi.mock('@/config/user-ui-features', () => ({
  isUserUiFeatureEnabled: (feature: string) => feature === 'wallet',
}))

const stored = {
  chat: { enabled: true, playground: true, chat: false },
  console: {
    enabled: true,
    detail: true,
    token: true,
    log: true,
    audit: true,
    midjourney: true,
    task: true,
  },
  personal: { enabled: true, topup: true, personal: true, security: true },
}

function mockProfile(sidebarModules: unknown) {
  return vi.spyOn(api, 'get').mockResolvedValue({
    data: {
      success: true,
      data: { id: 1, username: 'alice', sidebar_modules: sidebarModules },
    },
  })
}

afterEach(() => {
  useAuthStore.getState().auth.reset()
  vi.restoreAllMocks()
})

describe('sidebar personal settings card', () => {
  it('lists the IA entries with a wallet toggle and no Chat toggle', async () => {
    mockProfile(JSON.stringify(stored))
    render(<SidebarModulesCard />)
    expect(
      await screen.findByRole('switch', { name: 'account.sidebar.keys' })
    ).toBeChecked()
    expect(
      screen.getByRole('switch', { name: 'account.sidebar.wallet' })
    ).toBeVisible()
    expect(
      screen.getByRole('switch', { name: 'account.sidebar.activity' })
    ).toBeVisible()
    expect(screen.queryByRole('switch', { name: 'Chat' })).toBeNull()
    expect(screen.getAllByRole('switch')).toHaveLength(9)
  })

  it('saving keeps the hidden Chat value and sends only the edited change', async () => {
    mockProfile(JSON.stringify(stored))
    const put = vi
      .spyOn(api, 'put')
      .mockResolvedValue({ data: { success: true } })
    const user = userEvent.setup()
    render(<SidebarModulesCard />)
    const save = screen.getByRole('button', { name: 'Save Changes' })
    await user.click(
      await screen.findByRole('switch', { name: 'account.sidebar.playground' })
    )
    expect(screen.getByText('account.unsavedChanges')).toBeVisible()
    await user.click(save)
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1))
    const body = put.mock.calls[0][1] as { sidebar_modules: string }
    expect(JSON.parse(body.sidebar_modules)).toEqual({
      ...stored,
      chat: { enabled: true, playground: false, chat: false },
    })
  })

  it('save stays disabled until something changes', async () => {
    mockProfile(JSON.stringify(stored))
    render(<SidebarModulesCard />)
    await screen.findByRole('switch', { name: 'account.sidebar.keys' })
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
  })

  it('a failed read offers retry and never saves defaults over the stored value', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({
        data: {
          success: true,
          data: { id: 1, sidebar_modules: JSON.stringify(stored) },
        },
      })
    const put = vi.spyOn(api, 'put')
    const user = userEvent.setup()
    render(<SidebarModulesCard />)
    expect(await screen.findByText('account.sidebar.loadFailed')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled()
    expect(screen.queryByRole('switch')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(
      await screen.findByRole('switch', { name: 'account.sidebar.keys' })
    ).toBeVisible()
    expect(get).toHaveBeenCalledTimes(2)
    expect(put).not.toHaveBeenCalled()
  })
})
