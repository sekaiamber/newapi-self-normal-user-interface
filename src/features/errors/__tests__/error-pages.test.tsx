/*
 * [user-ui] 错误页测试（本仓库新增文件，非官方代码）。
 * 审计 3.3：错误页不再引导用户去上游 GitHub 反馈，改为"返回控制台 / 联系管理员"。
 */
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useAuthStore } from '@/stores/auth-store'

import { ForbiddenError } from '../forbidden'
import { GeneralError } from '../general-error'
import { MaintenanceError } from '../maintenance-error'
import { NotFoundError } from '../not-found-error'
import { UnauthorisedError } from '../unauthorized-error'

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { children: ReactNode; to: string; className?: string }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
  useRouter: () => ({ history: { go: () => undefined } }),
}))

afterEach(() => {
  useAuthStore.getState().auth.reset()
})

function signIn() {
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'alice',
    role: 1,
  })
}

describe('GeneralError', () => {
  it('asks the user to contact the site administrator instead of linking to upstream GitHub issues', () => {
    render(<GeneralError />)

    expect(screen.getByText('shell.error.contactAdmin')).toBeInTheDocument()
    for (const link of screen.queryAllByRole('link')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(/github\.com/)
    }
  })

  it('sends a signed-in user back to the console', () => {
    signIn()
    render(<GeneralError />)

    expect(
      screen.getByRole('link', { name: 'shell.error.backToConsole' })
    ).toHaveAttribute('href', '/dashboard')
  })

  it('sends a signed-out visitor back to the home page', () => {
    render(<GeneralError />)

    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute(
      'href',
      '/'
    )
  })

  it('shows no actions in minimal mode', () => {
    render(<GeneralError minimal />)

    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('status error pages', () => {
  it.each([
    ['404', NotFoundError],
    ['403', ForbiddenError],
    ['503', MaintenanceError],
  ])('%s page offers Back to Console to a signed-in user', (_code, Page) => {
    signIn()
    render(<Page />)

    expect(
      screen.getByRole('link', { name: 'shell.error.backToConsole' })
    ).toHaveAttribute('href', '/dashboard')
  })

  it('403 page tells the user to ask the site administrator for access', () => {
    render(<ForbiddenError />)

    expect(
      screen.getByText('shell.error.contactAdminForAccess')
    ).toBeInTheDocument()
  })

  it('401 page leads to the sign-in page', () => {
    render(<UnauthorisedError />)

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute(
      'href',
      '/sign-in'
    )
  })

  it('503 page no longer shows the inert Learn more button', () => {
    render(<MaintenanceError />)

    expect(screen.queryByRole('button', { name: 'Learn more' })).toBeNull()
  })
})
