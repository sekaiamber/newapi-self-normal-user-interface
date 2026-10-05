/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
// [user-ui] 分组单元格的新约定（审计 2.5 K5）：不再给每行挂 "1x" 胶囊；
// 只有非标准价显示方角"Price ×N"，分组说明与价格系数放在提示里；去掉流光动画。
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, test } from 'vitest'

const { createInstance } = await import('i18next')
const { I18nextProvider, initReactI18next } = await import('react-i18next')
const { TooltipProvider } = await import('@/components/ui/tooltip')
const { overridesEn } = await import('@/i18n/overrides')
const { ApiKeyGroupCell } = await import('../api-key-group-cell')

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: { en: { translation: { ...overridesEn } } },
})

function CellHarness(props: {
  group: string
  ratio?: number | string
  description?: string
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <TooltipProvider>
        <ApiKeyGroupCell
          group={props.group}
          ratio={props.ratio}
          description={props.description}
          crossGroupRetry={false}
          shouldReduceMotion={false}
        />
      </TooltipProvider>
    </I18nextProvider>
  )
}

describe('API key group table cell', () => {
  test('labels the automatic group without a multiplier or animated border', async () => {
    const { container } = render(<CellHarness group='auto' ratio='自动' />)
    expect(screen.getByText('Auto')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('自动')
    expect(container.querySelector('[data-auto-group-flow-border]')).toBeNull()
    await userEvent.tab()
    expect(
      await screen.findByText(
        'Automatically selects the best available group with circuit breaker mechanism',
        { selector: '[data-slot="tooltip-content"] *' }
      )
    ).toBeVisible()
  })

  test('hides the standard-price multiplier and explains the price in the tooltip', async () => {
    const { container } = render(
      <CellHarness group='default' ratio={1} description='Default group' />
    )
    expect(screen.getByText('default')).toBeInTheDocument()
    expect(container).not.toHaveTextContent('1x')
    expect(container.querySelector('[data-slot="badge"]')).toBeNull()
    await userEvent.tab()
    expect(
      await screen.findByText('Standard price', {
        selector: '[data-slot="tooltip-content"] *',
      })
    ).toBeVisible()
    expect(
      screen.getByText('default · Default group', {
        selector: '[data-slot="tooltip-content"] *',
      })
    ).toBeVisible()
  })

  test.each([
    [0.8, 'Price ×0.8', 'text-info'],
    [3, 'Price ×3', 'text-warning'],
  ])(
    'shows a square price badge for the %s multiplier',
    (ratio, label, color) => {
      render(<CellHarness group='vip' ratio={ratio} />)
      const badge = screen.getByText(label).closest('[data-slot="badge"]')
      expect(badge).toHaveClass('rounded-sm', 'tabular-nums', color)
      expect(badge).not.toHaveClass('rounded-full')
    }
  )

  test('labels an empty group as following the user group without inventing a value', async () => {
    render(<CellHarness group='' />)
    expect(screen.getByText('Follow user group')).toBeInTheDocument()
    expect(screen.queryByText(/×|1x/)).not.toBeInTheDocument()
    await userEvent.tab()
    expect(
      await screen.findByText('Uses the group your account belongs to', {
        selector: '[data-slot="tooltip-content"] *',
      })
    ).toBeVisible()
  })

  test('keeps a long group name truncated with the full name in the tooltip', async () => {
    const groupName = 'production-with-a-very-long-custom-group-name'
    render(<CellHarness group={groupName} ratio={12.345678} />)
    expect(
      screen.getByText(groupName).closest('[data-slot="tooltip-trigger"]')
    ).toHaveClass('max-w-50')
    expect(screen.getByText('Price ×12.345678')).toBeInTheDocument()
    await userEvent.tab()
    expect(
      await screen.findByText(groupName, {
        selector: '[data-slot="tooltip-content"] *',
      })
    ).toBeVisible()
  })

  test('never turns a string-valued normal group ratio into a badge', () => {
    render(<CellHarness group='vip' ratio='自动' />)
    expect(screen.getByText('vip')).toBeInTheDocument()
    expect(screen.queryByText('Auto')).not.toBeInTheDocument()
    expect(screen.queryByText('自动')).not.toBeInTheDocument()
  })
})
