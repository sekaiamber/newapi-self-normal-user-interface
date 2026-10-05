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
// [user-ui] 双栏认证布局（审计 2.13 U1/U8）：宽屏左栏品牌区，右栏表单；窄屏只留顶部品牌条。
// Logo 不再裁成圆形（默认品牌标识见 AuthBrandMark）；右上角放语言与明暗切换（复用共享组件）；
// 底部挂 AGPL 源码/许可声明（compact）。
import { LanguageSwitcher } from '@/components/language-switcher'
import { SourceNotice } from '@/components/legal/source-notice'
import { ThemeSwitch } from '@/components/theme-switch'

import { AuthBrandMark, AuthBrandPanel } from './components/auth-brand'

type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout(props: AuthLayoutProps) {
  return (
    <div className='bg-background text-foreground grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]'>
      <AuthBrandPanel className='hidden lg:flex' />
      <div className='flex min-h-svh min-w-0 flex-col'>
        <header className='flex items-center gap-3 px-4 pt-4 sm:px-8 sm:pt-6'>
          <AuthBrandMark className='lg:hidden' />
          <div className='ms-auto flex items-center gap-1'>
            <LanguageSwitcher />
            <ThemeSwitch />
          </div>
        </header>
        <main className='flex flex-1 items-center justify-center px-4 py-10 sm:px-8'>
          <div className='w-full max-w-[400px]'>{props.children}</div>
        </main>
        <footer className='px-4 pb-6 sm:px-8'>
          <SourceNotice variant='compact' className='text-center' />
        </footer>
      </div>
    </div>
  )
}
