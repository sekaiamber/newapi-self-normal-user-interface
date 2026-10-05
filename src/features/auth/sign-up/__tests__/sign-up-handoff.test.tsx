/*
 * [user-ui] 注册成功后回到登录页并预填用户名、邀请码透传的测试（本仓库新增文件，非官方代码）。
 * 审计 2.13 U2；邀请码（?aff=）的保存与提交是官方逻辑，界面虽隐藏推荐计划，这里保证改版没有把它弄丢。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useLocation,
} from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { register } from '@/features/auth/api'

import { readSignUpUsername } from '../../components/sign-up-handoff'
import { SignUpForm } from '../components/sign-up-form'

const statusState = vi.hoisted(() => ({
  status: {} as Record<string, unknown>,
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({ status: statusState.status, loading: false }),
}))

vi.mock(import('@/features/auth/api'), async (importOriginal) => ({
  ...(await importOriginal()),
  register: vi.fn(),
}))

function SignInProbe() {
  const username = useLocation({
    select: (location) => readSignUpUsername(location.state),
  })
  return <p>signed-up:{username ?? 'none'}</p>
}

function renderSignUp() {
  const root = createRootRoute({ component: Outlet })
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: '/sign-up',
        component: SignUpForm,
      }),
      createRoute({
        getParentRoute: () => root,
        path: '/sign-in',
        component: SignInProbe,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ['/sign-up'] }),
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
  return router
}

async function fillAndSubmit() {
  await userEvent.type(
    await screen.findByPlaceholderText('Enter your username'),
    'new-user'
  )
  await userEvent.type(
    screen.getByPlaceholderText('Enter password (8–128 characters)'),
    'password-123'
  )
  await userEvent.type(
    screen.getByPlaceholderText('Confirm password'),
    'password-123'
  )
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
}

beforeEach(() => {
  statusState.status = {}
  localStorage.clear()
  vi.mocked(register).mockResolvedValue({ success: true, message: '' })
})

afterEach(() => {
  window.history.replaceState({}, '', '/')
})

describe('sign-up → sign-in handoff', () => {
  it('returns to sign-in with the new username in history state, not in the URL', async () => {
    const router = renderSignUp()

    await fillAndSubmit()

    expect(await screen.findByText('signed-up:new-user')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/sign-in')
    expect(router.state.location.href).not.toContain('new-user')
  })

  it('stays on sign-up when registration fails', async () => {
    vi.mocked(register).mockResolvedValue({ success: false, message: 'taken' })
    const router = renderSignUp()

    await fillAndSubmit()

    await waitFor(() => expect(register).toHaveBeenCalled())
    expect(router.state.location.pathname).toBe('/sign-up')
  })

  it('submits the invite code from an ?aff= link with the registration', async () => {
    window.history.replaceState({}, '', '/sign-up?aff=INVITE42')
    renderSignUp()

    await fillAndSubmit()

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'new-user', aff_code: 'INVITE42' })
      )
    )
  })

  it('does not register before the agreement is ticked', async () => {
    statusState.status = { privacy_policy_enabled: true }
    renderSignUp()

    await fillAndSubmit()

    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true')
    expect(register).not.toHaveBeenCalled()
  })
})
