/*
 * [user-ui] 在线试用输入工具条的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import i18next from 'i18next'
import { beforeAll, describe, expect, it } from 'vitest'

import { TooltipProvider } from '@/components/ui/tooltip'

import { DEFAULT_CONFIG, DEFAULT_PARAMETER_ENABLED } from '../../../constants'
import { PlaygroundInputTools } from '../playground-input-tools'

beforeAll(() => {
  i18next.addResourceBundle('en', 'translation', {
    Attach: 'Attach',
    Search: 'Search',
    Parameters: 'Parameters',
    'Clear chat history': 'Clear chat history',
  })
})

function renderTools() {
  return render(
    <TooltipProvider>
      <PlaygroundInputTools
        config={DEFAULT_CONFIG}
        hasMessages
        onClearMessages={() => undefined}
        onConfigChange={() => undefined}
        onParameterEnabledChange={() => undefined}
        parameterEnabled={DEFAULT_PARAMETER_ENABLED}
      />
    </TooltipProvider>
  )
}

describe('PlaygroundInputTools', () => {
  it('does not offer the unimplemented attach and search buttons', () => {
    renderTools()

    expect(
      screen.queryByRole('button', { name: 'Attach' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Search' })
    ).not.toBeInTheDocument()
  })

  it('keeps the parameter and clear-history controls', () => {
    renderTools()

    expect(
      screen.getByRole('button', { name: 'Parameters' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Clear chat history' })
    ).toBeEnabled()
  })
})
