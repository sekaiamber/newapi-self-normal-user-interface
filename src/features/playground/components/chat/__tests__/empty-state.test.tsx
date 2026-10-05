/*
 * [user-ui] 在线试用空状态（起始示例）的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18next from 'i18next'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import playgroundEn from '@/i18n/overrides/playground.en.json'

import { PlaygroundEmptyState } from '../playground-empty-state'

beforeAll(() => {
  i18next.addResourceBundle('en', 'translation', playgroundEn, true, true)
})

describe('PlaygroundEmptyState', () => {
  it('offers one example card per starter prompt', () => {
    render(<PlaygroundEmptyState onSelectPrompt={() => undefined} />)

    expect(screen.getAllByRole('button')).toHaveLength(4)
  })

  it('hands the full example prompt to the caller when a card is clicked', async () => {
    const user = userEvent.setup()
    const onSelectPrompt = vi.fn()
    render(<PlaygroundEmptyState onSelectPrompt={onSelectPrompt} />)

    await user.click(screen.getByRole('button', { name: /Write code/ }))

    expect(onSelectPrompt).toHaveBeenCalledTimes(1)
    expect(onSelectPrompt).toHaveBeenCalledWith(
      playgroundEn['playground.starter.code.prompt']
    )
  })
})
