/*
 * [user-ui] 第三方登录区（统一分隔线、两列按钮、点击前检查）的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SystemStatus } from '../../types'
import { OAuthProviders } from '../oauth-providers'

const oauth = vi.hoisted(() => ({
  githubButtonText: 'Continue with GitHub',
  handleGitHubLogin: vi.fn(),
  handleDiscordLogin: vi.fn(),
  handleOIDCLogin: vi.fn(),
  handleLinuxDOLogin: vi.fn(),
  handleTelegramLogin: vi.fn(),
  handleCustomOAuthLogin: vi.fn(),
}))

// 跳转第三方授权页的逻辑在 hook 里（发请求、改 window.location），这里只验证按钮如何调用它
vi.mock('@/features/auth/hooks/use-oauth-login', () => ({
  useOAuthLogin: () => ({
    isLoading: false,
    githubButtonText: oauth.githubButtonText,
    githubButtonDisabled: false,
    handleGitHubLogin: oauth.handleGitHubLogin,
    handleDiscordLogin: oauth.handleDiscordLogin,
    handleOIDCLogin: oauth.handleOIDCLogin,
    handleLinuxDOLogin: oauth.handleLinuxDOLogin,
    handleTelegramLogin: oauth.handleTelegramLogin,
    handleCustomOAuthLogin: oauth.handleCustomOAuthLogin,
  }),
}))

const github = { github_oauth: true } as SystemStatus
const threeProviders = {
  github_oauth: true,
  discord_oauth: true,
  oidc_enabled: true,
  oidc_display_name: 'Company SSO',
} as SystemStatus

beforeEach(() => {
  oauth.githubButtonText = 'Continue with GitHub'
})

describe('OAuthProviders', () => {
  it('renders nothing when no provider or leading method is available', () => {
    const { container } = render(<OAuthProviders status={{} as SystemStatus} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('labels buttons with the provider name and keeps the full phrase for screen readers', () => {
    render(<OAuthProviders status={threeProviders} />)

    for (const name of ['GitHub', 'Discord', 'Company SSO']) {
      const button = screen.getByRole('button', {
        name: `Continue with ${name}`,
      })
      expect(
        within(button).getByText(name, { selector: 'span' })
      ).toBeInTheDocument()
    }
  })

  it('lets the last of an odd number of buttons span both columns', () => {
    render(<OAuthProviders status={threeProviders} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons[2]).toHaveClass('col-span-2')
    expect(buttons[0]).not.toHaveClass('col-span-2')
  })

  it('shows the page-specific divider label', () => {
    render(<OAuthProviders status={github} divider='auth.divider.signIn' />)

    expect(screen.getByText('auth.divider.signIn')).toBeInTheDocument()
  })

  it('omits the divider when the page has no password form', () => {
    render(<OAuthProviders status={github} divider={false} />)

    expect(screen.queryByText('auth.divider.continueWith')).toBeNull()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shares the divider with a leading method when no provider is enabled', () => {
    render(
      <OAuthProviders
        status={{} as SystemStatus}
        leading={<button type='button'>Passkey</button>}
      />
    )

    expect(screen.getByText('auth.divider.continueWith')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Passkey' })).toBeInTheDocument()
  })

  it('starts the provider login when the pre-check passes', async () => {
    render(<OAuthProviders status={github} onBeforeLogin={() => true} />)

    await userEvent.click(screen.getByRole('button'))

    expect(oauth.handleGitHubLogin).toHaveBeenCalledTimes(1)
  })

  it('does not start the provider login when the pre-check fails', async () => {
    const onBeforeLogin = vi.fn(() => false)
    render(<OAuthProviders status={github} onBeforeLogin={onBeforeLogin} />)

    await userEvent.click(screen.getByRole('button'))

    expect(onBeforeLogin).toHaveBeenCalledTimes(1)
    expect(oauth.handleGitHubLogin).not.toHaveBeenCalled()
  })

  it('shows the GitHub status text while redirecting', () => {
    oauth.githubButtonText = 'Redirecting to GitHub...'
    render(<OAuthProviders status={threeProviders} />)

    const button = screen.getByRole('button', {
      name: 'Redirecting to GitHub...',
    })
    expect(button).toHaveClass('col-span-2')
  })
})
