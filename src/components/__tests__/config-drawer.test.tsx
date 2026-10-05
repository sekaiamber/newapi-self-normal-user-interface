/*
 * [user-ui] 主题抽屉收窄为"外观"的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { ConfigDrawer } from '@/components/config-drawer'
import { SidebarProvider } from '@/components/ui/sidebar'
import { DirectionProvider } from '@/context/direction-provider'
import { LayoutProvider } from '@/context/layout-provider'
import { ThemeCustomizationProvider } from '@/context/theme-customization-provider'
import { ThemeProvider } from '@/context/theme-provider'

function renderDrawer() {
  return render(
    <ThemeProvider>
      <DirectionProvider>
        <LayoutProvider>
          <ThemeCustomizationProvider>
            <SidebarProvider>
              <ConfigDrawer />
            </SidebarProvider>
          </ThemeCustomizationProvider>
        </LayoutProvider>
      </DirectionProvider>
    </ThemeProvider>
  )
}

describe('ConfigDrawer', () => {
  it('offers only the light / dark / system appearance choice when opened', async () => {
    const user = userEvent.setup()
    renderDrawer()

    await user.click(
      screen.getByRole('button', { name: 'Open theme settings' })
    )

    const dialog = await screen.findByRole('dialog')
    const themeGroup = within(dialog).getByRole('radiogroup', {
      name: 'Select theme preference',
    })
    expect(within(themeGroup).getAllByRole('radio')).toHaveLength(3)
    expect(within(dialog).getAllByRole('radiogroup')).toHaveLength(1)
    expect(
      within(dialog).queryByRole('radiogroup', { name: 'Select color preset' })
    ).not.toBeInTheDocument()
    expect(within(dialog).getByText('design.appearance.title')).toBeVisible()
  })
})
