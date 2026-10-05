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
 * [user-ui] 页脚按 SwarmRouter 品牌重写（审计 3.3、3.6、5.2 方向 B）：
 * - 去掉上游署名行 ProjectAttribution（"© New API … 由项目贡献者设计与开发"）与标语"强大的 API 管理平台"，
 *   上游版权与许可改由共享的 <SourceNotice /> 以法律声明的形式给出（AGPLv3 第 5(d)、13 条）。
 * - 去掉演示站模式下指向 docs.newapi.pro / One API 等外部项目的链接列，改为本站导航、/docs 与条款链接。
 * - 新增 PublicFooter（精简页脚），由 PublicLayout 挂到文档、协议等其他公共页。
 * - 管理员在后台设置的页脚 HTML（footer_html）仍然显示（官方行为保留）。
 */
import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'

import { isDefaultLogo } from '@/assets/brand'
import { BrandLogo } from '@/assets/brand-logo'
import { SourceNotice } from '@/components/legal/source-notice'
import { useStatus } from '@/hooks/use-status'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import { DEFAULT_SYSTEM_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'

import { HeaderLogo } from './header-logo'
import { PUBLIC_NAV_LABEL_KEYS } from './public-nav-labels'

interface FooterLinkItem {
  key: string
  label: string
  /** 站内路径 */
  to: string
}

const LINK_CLASS_NAME =
  'text-muted-foreground hover:text-foreground focus-visible:text-foreground text-sm underline-offset-4 transition-colors hover:underline focus-visible:underline'
const INLINE_LINK_CLASS_NAME =
  'hover:text-foreground focus-visible:text-foreground underline-offset-4 hover:underline focus-visible:underline'

// 用户协议 / 隐私政策只在后台开启时出现（官方行为）
function useLegalLinks(): FooterLinkItem[] {
  const { t } = useTranslation()
  const { status } = useStatus()
  const items: FooterLinkItem[] = []
  if (status?.user_agreement_enabled) {
    items.push({
      key: 'user-agreement',
      label: t('User Agreement'),
      to: '/user-agreement',
    })
  }
  if (status?.privacy_policy_enabled) {
    items.push({
      key: 'privacy-policy',
      label: t('Privacy Policy'),
      to: '/privacy-policy',
    })
  }
  return items
}

function FooterLink(props: { item: FooterLinkItem; className: string }) {
  return (
    <Link to={props.item.to} className={props.className}>
      {props.item.label}
    </Link>
  )
}

function Copyright(props: { name: string }) {
  const { t } = useTranslation()
  return (
    <span>
      &copy; {new Date().getFullYear()} {props.name}.{' '}
      {t('footer.defaultCopyright')}
    </span>
  )
}

/** 品牌标识：默认 Logo + 默认站名时用横排标识，否则显示后台配置的 Logo 与站名。 */
function FooterBrand() {
  const { systemName, logo, loading, logoLoaded } = useSystemConfig()
  if (isDefaultLogo(logo) && systemName === DEFAULT_SYSTEM_NAME) {
    return <BrandLogo className='h-8 w-auto' alt={systemName} />
  }
  return (
    <span className='flex items-center gap-2.5'>
      <HeaderLogo
        src={logo}
        alt={systemName}
        loading={loading}
        logoLoaded={logoLoaded}
        className='size-8'
      />
      <span className='text-base font-semibold tracking-tight'>
        {systemName}
      </span>
    </span>
  )
}

function FooterColumn(props: { title: string; items: FooterLinkItem[] }) {
  if (props.items.length === 0) return null
  return (
    <div>
      <p className='font-mono text-xs font-semibold tracking-[0.14em] uppercase'>
        {props.title}
      </p>
      <ul className='mt-4 space-y-2.5'>
        {props.items.map((item) => (
          <li key={item.key}>
            <FooterLink item={item} className={LINK_CLASS_NAME} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function useSiteLinks(): FooterLinkItem[] {
  const { t } = useTranslation()
  // 与顶栏同源：只列出已开启的入口（模型广场、排行榜、关于已由功能开关关闭）
  return useTopNavLinks()
    .filter((link) => !link.external && !link.disabled && !link.requiresAuth)
    .map((link) => {
      const labelKey = PUBLIC_NAV_LABEL_KEYS[link.href]
      return {
        key: link.href,
        label: labelKey ? t(labelKey) : link.title,
        to: link.href,
      }
    })
}

function useDocLinks(): FooterLinkItem[] {
  const { t } = useTranslation()
  const pages: Array<{ slug: string; labelKey: string }> = [
    { slug: 'quick-start', labelKey: 'home.footer.quickStart' },
    { slug: 'api-basics', labelKey: 'home.footer.apiBasics' },
    { slug: 'clients', labelKey: 'home.footer.clients' },
    { slug: 'faq', labelKey: 'home.footer.faq' },
  ]
  return pages.map((page) => ({
    key: page.slug,
    label: t(page.labelKey),
    to: `/docs/${page.slug}`,
  }))
}

/**
 * 完整页脚（首页）。外层套 `dark` 类：无论站点明暗都是品牌近黑底，颜色仍全部取自主题 token。
 */
export function Footer(props: { className?: string }) {
  const { t } = useTranslation()
  const { systemName, footerHtml } = useSystemConfig()
  const siteLinks = useSiteLinks()
  const docLinks = useDocLinks()
  const legalLinks = useLegalLinks()

  return (
    <footer
      className={cn('border-edge relative z-10 border-t-2', props.className)}
    >
      <div className='dark bg-card text-card-foreground'>
        <div className='mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8'>
          {footerHtml ? (
            <div
              className='custom-footer text-muted-foreground text-sm'
              // 管理员在后台配置的页脚 HTML（官方行为）
              dangerouslySetInnerHTML={{ __html: footerHtml }}
            />
          ) : (
            <div className='grid gap-10 md:grid-cols-12'>
              <div className='md:col-span-5'>
                <Link
                  to='/'
                  className='inline-flex'
                  aria-label={t('home.nav.home')}
                >
                  <FooterBrand />
                </Link>
                <p className='text-muted-foreground mt-4 max-w-sm text-sm leading-relaxed'>
                  {t('home.footer.tagline')}
                </p>
              </div>
              <nav
                aria-label={t('home.footer.navigation')}
                className='grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7'
              >
                <FooterColumn title={t('home.footer.site')} items={siteLinks} />
                <FooterColumn title={t('home.footer.docs')} items={docLinks} />
                <FooterColumn
                  title={t('home.footer.legal')}
                  items={legalLinks}
                />
              </nav>
            </div>
          )}

          <div className='border-edge-soft text-muted-foreground mt-10 flex flex-col gap-3 border-t-2 pt-6 text-xs lg:flex-row lg:items-start lg:justify-between lg:gap-10'>
            <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
              <Copyright name={systemName} />
              {footerHtml &&
                legalLinks.map((item) => (
                  <Fragment key={item.key}>
                    <span aria-hidden='true'>·</span>
                    <FooterLink
                      item={item}
                      className={INLINE_LINK_CLASS_NAME}
                    />
                  </Fragment>
                ))}
            </p>
            <SourceNotice
              variant='full'
              className='lg:max-w-xl lg:text-right'
            />
          </div>
        </div>
      </div>
    </footer>
  )
}

/** 精简页脚（文档、协议、自定义首页等公共页）：版权、条款链接与源码声明。 */
export function PublicFooter(props: { className?: string }) {
  const { systemName } = useSystemConfig()
  const legalLinks = useLegalLinks()

  return (
    <footer
      className={cn(
        'border-edge-soft text-muted-foreground relative z-10 border-t-2 text-xs',
        props.className
      )}
    >
      <div className='mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10 lg:px-8'>
        <p className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <Copyright name={systemName} />
          {legalLinks.map((item) => (
            <Fragment key={item.key}>
              <span aria-hidden='true'>·</span>
              <FooterLink item={item} className={INLINE_LINK_CLASS_NAME} />
            </Fragment>
          ))}
        </p>
        <SourceNotice variant='full' className='lg:max-w-xl lg:text-right' />
      </div>
    </footer>
  )
}
