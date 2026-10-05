/*
 * [user-ui] 品牌按钮变体的测试（本仓库新增文件，非官方代码）。
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button, buttonVariants } from '../button'

const HARD_SHADOW = /shadow-\[3px_3px_0_0_/

describe('button variants', () => {
  it('renders the primary button as brand gold with near-black text', () => {
    render(<Button>Save</Button>)

    expect(screen.getByRole('button', { name: 'Save' })).toHaveClass(
      'bg-primary',
      'text-primary-foreground'
    )
  })

  it('gives solid variants a hard offset shadow and keeps ghost and link flat', () => {
    for (const variant of [
      'default',
      'outline',
      'secondary',
      'destructive',
    ] as const) {
      expect(buttonVariants({ variant })).toMatch(HARD_SHADOW)
    }
    for (const variant of ['ghost', 'link'] as const) {
      expect(buttonVariants({ variant })).not.toMatch(/shadow-\[/)
    }
  })

  it('lets a caller remove the hard shadow through className', () => {
    render(
      <Button variant='outline' className='shadow-none'>
        Flat
      </Button>
    )

    const classes = screen.getByRole('button', { name: 'Flat' }).className
    expect(classes).toContain('shadow-none')
    expect(classes).not.toMatch(/(^| )shadow-\[3px_3px_0_0_/)
  })

  it('stays clickable and keyboard focusable', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button variant='outline' onClick={onClick}>
        Open
      </Button>
    )

    await user.tab()
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
