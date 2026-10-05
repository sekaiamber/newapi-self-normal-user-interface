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
/*
 * [user-ui] 首页 Hero 按 SwarmRouter 品牌重写（审计 5.2 方向 B + 品牌金）：
 * 去掉 New API 的蓝紫渐变标题、呼吸点胶囊徽标、径向光晕、远程加载的 CC Switch 图标与终端演示；
 * 改为一句话定位 + 本站 Base URL 复制条（lib/api-endpoint.ts）+ 主操作 + 路由示意图，背景是很淡的蜂巢底纹。
 * 只写可核实的事实：三种请求格式见官方文档 guide/feature-guide/user/api.md。
 */
import { useTranslation } from 'react-i18next'

import { useSystemConfig } from '@/hooks/use-system-config'
import { toOpenAiBaseUrl, useApiBaseUrl } from '@/lib/api-endpoint'

import { BaseUrlBar } from '../base-url-bar'
import { HomeActions } from '../home-actions'
import { HexBadge, HoneycombBackdrop } from '../honeycomb'
import { RouteDiagram } from '../route-diagram'

export function Hero() {
  const { t } = useTranslation()
  const { systemName } = useSystemConfig()
  const apiBaseUrl = useApiBaseUrl()

  return (
    <section
      aria-labelledby='home-hero-title'
      className='border-edge-soft relative overflow-hidden border-b-2'
    >
      <HoneycombBackdrop className='text-foreground/[0.07] dark:text-foreground/[0.06] [mask-image:radial-gradient(ellipse_65%_75%_at_80%_35%,black_20%,transparent_75%)]' />

      <div className='relative mx-auto grid max-w-7xl items-center gap-12 px-4 pt-28 pb-16 sm:px-6 md:pt-32 md:pb-20 lg:grid-cols-12 lg:gap-10 lg:px-8 lg:pt-36 lg:pb-24'>
        <div className='min-w-0 lg:col-span-6'>
          <p className='text-primary-ink flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.14em] uppercase'>
            <HexBadge className='size-3.5' />
            {t('home.hero.eyebrow')}
          </p>
          <h1
            id='home-hero-title'
            className='mt-5 text-4xl leading-[1.12] font-bold tracking-tight sm:text-5xl lg:text-[3.5rem]'
          >
            <span className='block'>{t('home.hero.titleLead')}</span>
            <span className='decoration-primary block underline decoration-[0.14em] underline-offset-[0.18em] [text-decoration-skip-ink:none]'>
              {t('home.hero.titleEmphasis')}
            </span>
          </h1>
          <p className='text-muted-foreground mt-6 max-w-xl text-base leading-relaxed sm:text-lg'>
            {t('home.hero.subtitle', { siteName: systemName })}
          </p>

          <BaseUrlBar
            className='mt-8 max-w-xl'
            value={toOpenAiBaseUrl(apiBaseUrl)}
          />
          <p className='text-muted-foreground mt-3 max-w-xl text-sm leading-relaxed'>
            {t('home.hero.baseUrlHint', { root: apiBaseUrl })}
          </p>

          <HomeActions className='mt-8' />
        </div>

        <div className='hidden min-w-0 sm:block lg:col-span-6'>
          <div className='border-edge bg-card mx-auto max-w-xl rounded-lg border-2 p-5 lg:max-w-none lg:p-6'>
            <RouteDiagram siteName={systemName} />
          </div>
        </div>
      </div>
    </section>
  )
}
