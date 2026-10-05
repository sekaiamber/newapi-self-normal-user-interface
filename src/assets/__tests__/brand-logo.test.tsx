/*
 * [user-ui] 品牌标识组件测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BRAND_ASSETS, isDefaultLogo } from '@/assets/brand'
import { BrandIcon, BrandLogo } from '@/assets/brand-logo'
import { DEFAULT_LOGO } from '@/lib/constants'

describe('isDefaultLogo', () => {
  it('treats a missing or default logo as "use the brand mark"', () => {
    expect(isDefaultLogo(DEFAULT_LOGO)).toBe(true)
    expect(isDefaultLogo('')).toBe(true)
    expect(isDefaultLogo(undefined)).toBe(true)
  })

  it('treats an admin-configured logo URL as custom', () => {
    expect(isDefaultLogo('https://cdn.example.com/acme.png')).toBe(false)
  })
})

describe('brand marks', () => {
  it('renders the logo lockup in a light and a dark variant switched by the dark class', () => {
    render(<BrandLogo className='h-5' />)

    const [light, dark] = screen.getAllByRole('img', { name: 'SwarmRouter' })
    expect(light).toHaveAttribute('src', BRAND_ASSETS.logo)
    expect(light).toHaveClass('dark:hidden')
    expect(dark).toHaveAttribute('src', BRAND_ASSETS.logoDark)
    expect(dark).toHaveClass('hidden', 'dark:block')
  })

  it('renders the hexagon icon with the given accessible name', () => {
    render(<BrandIcon alt='Logo' />)

    const sources = screen
      .getAllByRole('img', { name: 'Logo' })
      .map((img) => img.getAttribute('src'))
    expect(sources).toEqual([BRAND_ASSETS.icon, BRAND_ASSETS.iconDark])
  })
})
