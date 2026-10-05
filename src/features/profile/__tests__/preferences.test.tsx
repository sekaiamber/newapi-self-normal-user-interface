/*
 * [user-ui] 偏好卡片（记录 IP、接受未定价模型）的交互测试（本仓库新增文件，非官方代码）。
 * 取代原 security/components/__tests__/privacy-card.test.tsx：记录 IP 移到个人资料页并改为即改即存。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toaster, toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { PreferencesCard } from '../components/preferences-card'
import type { UserProfile } from '../types'

const profile: UserProfile = {
  id: 1,
  username: 'alice',
  display_name: 'Alice',
  role: 1,
  group: 'default',
  quota: 1000000,
  used_quota: 0,
  request_count: 0,
  status: 1,
  aff_count: 0,
  aff_quota: 0,
  aff_history_quota: 0,
  created_time: 0,
  setting: JSON.stringify({
    record_ip_log: true,
    accept_unset_model_ratio_model: false,
  }),
}

afterEach(() => {
  toast.dismiss()
  vi.restoreAllMocks()
})

function renderCard() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const onUpdate = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <PreferencesCard profile={profile} onProfileUpdate={onUpdate} />
      <Toaster />
    </QueryClientProvider>
  )
  return { onUpdate }
}

function mockStoredSettings() {
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { success: true, data: profile },
  })
}

describe('profile preferences', () => {
  it('keyboard toggling IP recording off saves false immediately and refreshes the profile', async () => {
    mockStoredSettings()
    const put = vi
      .spyOn(api, 'put')
      .mockResolvedValue({ data: { success: true } })
    const user = userEvent.setup()
    const { onUpdate } = renderCard()
    const toggle = screen.getByRole('switch', { name: 'Record IP Address' })
    expect(toggle).toBeChecked()
    toggle.focus()
    await user.keyboard(' ')
    await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    expect(put).toHaveBeenCalledWith(
      '/api/user/setting',
      expect.objectContaining({ record_ip_log: false })
    )
    expect(toggle).not.toBeChecked()
  })

  it('a failed save restores the stored value and does not refresh', async () => {
    mockStoredSettings()
    vi.spyOn(api, 'put').mockResolvedValue({ data: { success: false } })
    const user = userEvent.setup()
    const { onUpdate } = renderCard()
    const toggle = screen.getByRole('switch', { name: 'Record IP Address' })
    await user.click(toggle)
    expect(await screen.findByText('Failed to update settings')).toBeVisible()
    await waitFor(() => expect(toggle).toBeChecked())
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('a failed settings read does not write and restores the toggle', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('offline'))
    const put = vi.spyOn(api, 'put')
    const user = userEvent.setup()
    renderCard()
    const toggle = screen.getByRole('switch', { name: 'Record IP Address' })
    await user.click(toggle)
    expect(await screen.findByText('offline')).toBeVisible()
    expect(put).not.toHaveBeenCalled()
    await waitFor(() => expect(toggle).toBeChecked())
  })

  it('accepting unpriced models asks for confirmation before saving', async () => {
    mockStoredSettings()
    const put = vi
      .spyOn(api, 'put')
      .mockResolvedValue({ data: { success: true } })
    const user = userEvent.setup()
    renderCard()
    const toggle = screen.getByRole('switch', {
      name: 'Accept Unpriced Models',
    })
    await user.click(toggle)
    const dialog = await screen.findByRole('alertdialog')
    expect(
      within(dialog).getByText('account.preferences.unpriced.confirmDesc')
    ).toBeVisible()
    expect(put).not.toHaveBeenCalled()
    expect(toggle).not.toBeChecked()

    await user.click(
      within(dialog).getByRole('button', {
        name: 'account.preferences.unpriced.confirm',
      })
    )
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith(
        '/api/user/setting',
        expect.objectContaining({ accept_unset_model_ratio_model: true })
      )
    )
  })

  it('cancelling the unpriced-model confirmation keeps it off without saving', async () => {
    mockStoredSettings()
    const put = vi.spyOn(api, 'put')
    const user = userEvent.setup()
    renderCard()
    await user.click(
      screen.getByRole('switch', { name: 'Accept Unpriced Models' })
    )
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() =>
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    )
    expect(
      screen.getByRole('switch', { name: 'Accept Unpriced Models' })
    ).not.toBeChecked()
    expect(put).not.toHaveBeenCalled()
  })
})
