/*
 * [user-ui] 顶栏品牌位（SystemBrand / HeaderLogo）的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BRAND_ASSETS } from '@/assets/brand'
import { DEFAULT_LOGO } from '@/lib/constants'

import { HeaderLogo } from '../header-logo'
import { SystemBrand } from '../system-brand'

const brandState = vi.hoisted(() => ({
  logo: '/favicon.svg',
  systemName: 'SwarmRouter' as string | undefined,
}))

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { children: ReactNode; to: string; className?: string }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({ status: { system_name: brandState.systemName } }),
}))

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({ logo: brandState.logo }),
}))

beforeEach(() => {
  brandState.logo = DEFAULT_LOGO
  brandState.systemName = 'SwarmRouter'
})

describe('SystemBrand (inline)', () => {
  it('shows the SwarmRouter logo lockup when no custom logo or name is configured', () => {
    render(<SystemBrand variant='inline' />)

    const sources = screen
      .getAllByRole('img', { name: 'SwarmRouter' })
      .map((img) => img.getAttribute('src'))
    expect(sources).toEqual([BRAND_ASSETS.logo, BRAND_ASSETS.logoDark])
  })

  it('shows the brand icon next to the configured site name when only the name is customized', () => {
    brandState.systemName = 'Acme AI'
    render(<SystemBrand variant='inline' />)

    expect(screen.getByText('Acme AI')).toBeInTheDocument()
    expect(
      screen.getAllByRole('img').map((img) => img.getAttribute('src'))
    ).toEqual([BRAND_ASSETS.icon, BRAND_ASSETS.iconDark])
  })

  it('shows the admin-configured logo instead of the brand mark', () => {
    brandState.logo = 'https://cdn.example.com/acme.png'
    brandState.systemName = 'Acme AI'
    render(<SystemBrand variant='inline' />)

    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/acme.png'
    )
    expect(screen.getByText('Acme AI')).toBeInTheDocument()
  })
})

describe('HeaderLogo', () => {
  it('renders the uncropped brand icon for the default logo', () => {
    render(<HeaderLogo src={DEFAULT_LOGO} loading={false} logoLoaded />)

    const images = screen.getAllByRole('img', { name: 'logo' })
    expect(images.map((img) => img.getAttribute('src'))).toEqual([
      BRAND_ASSETS.icon,
      BRAND_ASSETS.iconDark,
    ])
    expect(images[0]).not.toHaveClass('rounded-full')
  })

  it('renders a custom logo as a single image', () => {
    render(
      <HeaderLogo
        src='https://cdn.example.com/acme.png'
        loading={false}
        logoLoaded
      />
    )

    expect(screen.getByRole('img', { name: 'logo' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/acme.png'
    )
  })
})
