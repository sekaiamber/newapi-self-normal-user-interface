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
import { Link, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

export function UnauthorisedError() {
  const { t } = useTranslation()
  const { history } = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2 px-4'>
        {/* [user-ui] 状态码用等宽数字字体 */}
        <h1 className='font-mono text-[7rem] leading-tight font-bold tabular-nums'>
          401
        </h1>
        <span className='font-medium'>{t('Unauthorized Access')}</span>
        <p className='text-muted-foreground text-center'>
          {t('Please log in with the appropriate credentials')} <br />{' '}
          {t('to access this resource.')}
        </p>
        <div className='mt-6 flex flex-wrap justify-center gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            {t('Go Back')}
          </Button>
          {/* [user-ui] 401 的下一步是登录，主按钮直接去登录页（原为"返回主页"） */}
          <Button render={<Link to='/sign-in' />}>{t('Sign in')}</Button>
        </div>
      </div>
    </div>
  )
}
