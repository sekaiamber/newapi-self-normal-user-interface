/*
 * [user-ui] 登录表单版式与协议勾选行为的测试（本仓库新增文件，非官方代码）。
 * 审计 2.13 U5/U6：密码表单在前、协议勾选在主按钮上方、"或使用以下方式登录"分隔线后是其他方式；
 * 未勾选协议时按钮可点，但不会发起登录，并高亮勾选框。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createOAuthFlow, login, logout } from '@/features/auth/api'
import type { SystemStatus } from '@/features/auth/types'
import { useAuthStore } from '@/stores/auth-store'

import { UserAuthForm } from '../components/user-auth-form'

const statusState = vi.hoisted(() => ({
  status: {} as Record<string, unknown>,
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({ status: statusState.status, loading: false }),
}))

// 网络边界：只替换登录请求，其余导出保持原样
vi.mock(import('@/features/auth/api'), async (importOriginal) => ({
  ...(await importOriginal()),
  login: vi.fn(),
  logout: vi.fn(),
  createOAuthFlow: vi.fn(),
}))

function renderForm(defaultUsername?: string) {
  const root = createRootRoute({ component: Outlet })
  const signIn = createRoute({
    getParentRoute: () => root,
    path: '/sign-in',
    component: () => <UserAuthForm defaultUsername={defaultUsername} />,
  })
  const router = createRouter({
    routeTree: root.addChildren([signIn]),
    history: createMemoryHistory({ initialEntries: ['/sign-in'] }),
  })
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}

async function fillCredentials() {
  await userEvent.type(
    await screen.findByPlaceholderText('Enter your username or email'),
    'alice'
  )
  await userEvent.type(screen.getByPlaceholderText('Enter password'), 'secret')
}

function follows(a: Node, b: Node): boolean {
  return Boolean(
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
  )
}

beforeEach(() => {
  useAuthStore.getState().auth.reset('complete')
  statusState.status = {}
  vi.mocked(login).mockResolvedValue({ success: false, message: 'nope' })
})

describe('UserAuthForm layout', () => {
  it('places the password form first and other methods after the divider', async () => {
    statusState.status = { github_oauth: true, user_agreement_enabled: true }
    renderForm()

    const password = await screen.findByPlaceholderText('Enter password')
    const consent = screen.getByRole('checkbox')
    const submit = screen.getByRole('button', { name: 'Sign in' })
    const divider = screen.getByText('auth.divider.signIn')
    const github = screen.getByRole('button', { name: 'Continue with GitHub' })

    expect(follows(password, consent)).toBe(true)
    expect(follows(consent, submit)).toBe(true)
    expect(follows(submit, divider)).toBe(true)
    expect(follows(divider, github)).toBe(true)
  })

  it('shows other methods without an "or" divider when password login is disabled', async () => {
    statusState.status = {
      github_oauth: true,
      password_login_enabled: false,
    } satisfies Partial<SystemStatus>
    renderForm()

    expect(
      await screen.findByRole('button', { name: 'Continue with GitHub' })
    ).toBeInTheDocument()
    expect(screen.queryByText('auth.divider.signIn')).toBeNull()
    expect(screen.queryByPlaceholderText('Enter password')).toBeNull()
  })

  it('prefills the username handed over from sign-up', async () => {
    renderForm('new-user')

    expect(
      await screen.findByPlaceholderText('Enter your username or email')
    ).toHaveValue('new-user')
    expect(screen.getByPlaceholderText('Enter password')).toHaveFocus()
  })
})

describe('UserAuthForm legal consent', () => {
  it('keeps the sign-in button clickable before the agreement is ticked', async () => {
    statusState.status = { user_agreement_enabled: true }
    renderForm()

    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeEnabled()
  })

  it('does not sign in and highlights the agreement when it is not ticked', async () => {
    statusState.status = { user_agreement_enabled: true }
    renderForm()
    await fillCredentials()

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    const checkbox = screen.getByRole('checkbox')
    await waitFor(() =>
      expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    )
    expect(checkbox).toHaveFocus()
    expect(login).not.toHaveBeenCalled()
  })

  it('signs in once the agreement is ticked', async () => {
    statusState.status = { user_agreement_enabled: true }
    renderForm()
    await fillCredentials()

    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'alice', password: 'secret' })
      )
    )
    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-invalid')
  })

  it('does not start a provider login before the agreement is ticked', async () => {
    statusState.status = {
      user_agreement_enabled: true,
      github_oauth: true,
      github_client_id: 'client',
    }
    renderForm()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Continue with GitHub' })
    )

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
    expect(logout).not.toHaveBeenCalled()
    expect(createOAuthFlow).not.toHaveBeenCalled()
  })

  it('starts the provider login once the agreement is ticked', async () => {
    statusState.status = {
      user_agreement_enabled: true,
      github_oauth: true,
      github_client_id: 'client',
    }
    vi.mocked(logout).mockResolvedValue({ success: true, message: '' })
    vi.mocked(createOAuthFlow).mockRejectedValue(new Error('stop here'))
    renderForm()

    await userEvent.click(await screen.findByRole('checkbox'))
    await userEvent.click(
      screen.getByRole('button', { name: 'Continue with GitHub' })
    )

    await waitFor(() =>
      expect(createOAuthFlow).toHaveBeenCalledWith('github', 'login')
    )
  })
})
