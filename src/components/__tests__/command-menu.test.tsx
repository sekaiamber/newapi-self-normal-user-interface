/*
 * [user-ui] 命令面板（⌘K）导航条目的测试（本仓库新增文件，非官方代码）。
 * 保护审计 4.1 #1 的修复：命令面板与侧边栏使用同一份经过过滤的导航数据。
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import { CommandMenu } from '@/components/command-menu'
import { useAuthStore } from '@/stores/auth-store'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useLocation: (options?: {
    select?: (location: { pathname: string; href: string }) => unknown
  }) => {
    const location = { pathname: '/keys', href: '/keys' }
    return options?.select ? options.select(location) : location
  },
}))

vi.mock('@/context/search-provider', () => ({
  useSearch: () => ({ open: true, setOpen: () => undefined }),
}))

// jsdom 没有 Web Animations API；Base UI 的 ScrollArea 会调用 getAnimations()
const hadGetAnimations = 'getAnimations' in Element.prototype
beforeAll(() => {
  if (!hadGetAnimations) {
    Object.defineProperty(Element.prototype, 'getAnimations', {
      configurable: true,
      value: () => [],
    })
  }
})
afterAll(() => {
  if (!hadGetAnimations) {
    delete (Element.prototype as { getAnimations?: unknown }).getAnimations
  }
})

afterEach(() => {
  navigate.mockReset()
  useAuthStore.getState().auth.reset()
})

function renderMenu(sidebarModulesAdmin: object | null) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(['status'], {
    SidebarModulesAdmin: sidebarModulesAdmin
      ? JSON.stringify(sidebarModulesAdmin)
      : '',
  })
  useAuthStore.getState().auth.setUser({
    id: 1,
    username: 'alice',
    role: 1,
    permissions: { sidebar_settings: true },
    sidebar_modules: '',
  })
  function Wrapper(props: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        {props.children}
      </QueryClientProvider>
    )
  }
  return render(<CommandMenu />, { wrapper: Wrapper })
}

describe('CommandMenu navigation', () => {
  it('lists the same entries as the sidebar when the backend hides the wallet', async () => {
    renderMenu({ personal: { enabled: true, topup: false } })

    expect(
      await screen.findByRole('option', { name: 'nav.apiKeys' })
    ).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'nav.docs' })).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'nav.wallet' })
    ).not.toBeInTheDocument()
  })

  it('navigates to the chosen entry when an option is selected', async () => {
    const user = userEvent.setup()
    renderMenu(null)

    await user.click(
      await screen.findByRole('option', { name: 'nav.usageStats' })
    )

    expect(navigate).toHaveBeenCalledWith({ to: '/dashboard/models' })
  })
})
