/*
 * [user-ui] 状态徽章配色走主题 token 的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  dotColorMap,
  StatusBadge,
  textColorMap,
} from '@/components/status-badge'

// Tailwind 自带调色板类，如 bg-emerald-400、text-blue-500
const RAW_PALETTE_CLASS =
  /\b(?:bg|text)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/

describe('StatusBadge colors', () => {
  it('maps every dot and text color to a theme token instead of a raw palette class', () => {
    for (const value of [
      ...Object.values(dotColorMap),
      ...Object.values(textColorMap),
    ]) {
      expect(value).not.toMatch(RAW_PALETTE_CLASS)
    }
  })

  it('renders an amber badge with the darker gold text token so it stays readable on light backgrounds', () => {
    render(<StatusBadge label='beta' variant='amber' copyable={false} />)

    expect(screen.getByText('beta').parentElement).toHaveClass(
      'text-primary-ink'
    )
  })
})
