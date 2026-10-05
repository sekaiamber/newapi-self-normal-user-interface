/*
 * [user-ui] AGPL 声明组件测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { USER_UI_LICENSE_URL, USER_UI_SOURCE_URL } from '@/config/user-ui-meta'
import { overridesEn } from '@/i18n/overrides'

import { SourceNotice } from '../source-notice'

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({ systemName: 'TestSite' }),
}))

beforeAll(() => {
  i18next.addResourceBundle('en', 'translation', overridesEn, true, true)
})

describe('SourceNotice', () => {
  it('links to the public source repository and the license in the full variant', () => {
    render(<SourceNotice />)

    expect(screen.getByRole('link', { name: 'Source code' })).toHaveAttribute(
      'href',
      USER_UI_SOURCE_URL
    )
    expect(screen.getByRole('link', { name: 'GNU AGPLv3' })).toHaveAttribute(
      'href',
      USER_UI_LICENSE_URL
    )
  })

  it('states the site name, upstream copyright and no-warranty notice in the full variant', () => {
    render(<SourceNotice />)
    const notice = screen.getByTestId('source-notice')

    expect(notice).toHaveTextContent('TestSite')
    expect(notice).toHaveTextContent('QuantumNous')
    expect(notice).toHaveTextContent('without any warranty')
  })

  it('shows only the two links in the compact variant', () => {
    render(<SourceNotice variant='compact' />)
    const notice = screen.getByTestId('source-notice')

    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(notice).not.toHaveTextContent('warranty')
  })
})
