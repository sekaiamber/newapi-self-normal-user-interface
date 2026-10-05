/*
 * [user-ui] 协议勾选框（位置在主按钮上方、未勾选时的提示）的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { SystemStatus } from '../../types'
import { LegalConsent } from '../legal-consent'

const bothEnabled = {
  user_agreement_enabled: true,
  privacy_policy_enabled: true,
} as SystemStatus

describe('LegalConsent', () => {
  it('renders nothing when neither document is enabled', () => {
    const { container } = render(
      <LegalConsent
        status={{} as SystemStatus}
        checked={false}
        onCheckedChange={() => undefined}
      />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('links both enabled documents in a new tab', () => {
    render(
      <LegalConsent
        status={bothEnabled}
        checked={false}
        onCheckedChange={() => undefined}
      />
    )

    expect(
      screen.getByRole('link', { name: 'auth.consent.userAgreement' })
    ).toHaveAttribute('href', '/user-agreement')
    expect(
      screen.getByRole('link', { name: 'auth.consent.privacyPolicy' })
    ).toHaveAttribute('href', '/privacy-policy')
    expect(screen.getByText(/auth\.consent\.and/)).toBeInTheDocument()
  })

  it('links only the privacy policy when the user agreement is disabled', () => {
    render(
      <LegalConsent
        status={{ privacy_policy_enabled: true } as SystemStatus}
        checked={false}
        onCheckedChange={() => undefined}
      />
    )

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.queryByText(/auth\.consent\.and/)).toBeNull()
  })

  it('marks the unticked checkbox invalid and explains why when invalid', () => {
    render(
      <LegalConsent
        status={bothEnabled}
        checked={false}
        onCheckedChange={() => undefined}
        invalid
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toHaveAttribute('aria-invalid', 'true')
    expect(checkbox).toHaveAccessibleDescription('auth.consent.required')
    expect(checkbox).toHaveFocus()
  })

  it('drops the error once the box is ticked', () => {
    render(
      <LegalConsent
        status={bothEnabled}
        checked
        onCheckedChange={() => undefined}
        invalid
      />
    )

    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText('auth.consent.required')).toBeNull()
  })

  it('reports the new value when the box is clicked', async () => {
    const onCheckedChange = vi.fn()
    render(
      <LegalConsent
        status={bothEnabled}
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    )

    await userEvent.click(screen.getByRole('checkbox'))

    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })
})
