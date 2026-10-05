/*
 * [user-ui] 主题个性化收窄的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import {
  ThemeCustomizationProvider,
  useThemeCustomization,
} from '@/context/theme-customization-provider'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'
import { THEME_COOKIE_KEYS, THEME_PRESETS } from '@/lib/theme-customization'

function CustomizationProbe() {
  const { customization } = useThemeCustomization()
  return (
    <output data-testid='customization'>{JSON.stringify(customization)}</output>
  )
}

function readCustomization() {
  return JSON.parse(screen.getByTestId('customization').textContent ?? '{}')
}

afterEach(() => {
  for (const name of Object.values(THEME_COOKIE_KEYS)) removeCookie(name)
  for (const attr of [
    'data-theme-preset',
    'data-theme-font',
    'data-theme-radius',
    'data-theme-scale',
    'data-theme-content-layout',
  ]) {
    document.body.removeAttribute(attr)
  }
})

describe('ThemeCustomizationProvider with customization locked', () => {
  it('ignores stale preset, font, radius and scale cookies and renders the brand defaults', () => {
    setCookie(THEME_COOKIE_KEYS.preset, 'ocean-breeze')
    setCookie(THEME_COOKIE_KEYS.font, 'serif')
    setCookie(THEME_COOKIE_KEYS.radius, 'xl')
    setCookie(THEME_COOKIE_KEYS.scale, 'sm')

    render(
      <ThemeCustomizationProvider>
        <CustomizationProbe />
      </ThemeCustomizationProvider>
    )

    expect(readCustomization()).toEqual({
      preset: 'default',
      font: 'default',
      radius: 'default',
      scale: 'default',
      contentLayout: 'full',
    })
    expect(document.body).not.toHaveAttribute('data-theme-preset')
    expect(document.body).not.toHaveAttribute('data-theme-radius')
    expect(document.body).not.toHaveAttribute('data-theme-scale')
    expect(document.body).toHaveAttribute('data-theme-font', 'sans')
  })

  it('removes stale customization cookies after mounting', () => {
    setCookie(THEME_COOKIE_KEYS.preset, 'rose-garden')
    setCookie(THEME_COOKIE_KEYS.contentLayout, 'centered')

    render(
      <ThemeCustomizationProvider>
        <CustomizationProbe />
      </ThemeCustomizationProvider>
    )

    expect(getCookie(THEME_COOKIE_KEYS.preset)).toBeUndefined()
    expect(getCookie(THEME_COOKIE_KEYS.contentLayout)).toBeUndefined()
  })
})

describe('theme preset registry', () => {
  it('does not offer the third-party "Anthropic" preset', () => {
    const values: string[] = THEME_PRESETS.map((preset) => preset.value)

    expect(values).not.toContain('anthropic')
    expect(values).toContain('default')
  })
})
