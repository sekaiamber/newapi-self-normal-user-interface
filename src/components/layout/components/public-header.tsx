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
 * [user-ui] 公共顶栏按 SwarmRouter 品牌重写（审计 5.1、5.2 方向 B）：
 * - 去掉滚动后收缩成居中悬浮圆角胶囊的效果（New API 标志性交互），改为贴顶通栏，滚动后显示 2px 底边；
 * - 默认 Logo + 默认站名时显示"图标 + 文字"横排标识（与控制台顶栏 system-brand 一致），否则显示后台配置的 Logo 与站名；
 * - 导航只显示已开启的入口（useTopNavLinks 已应用功能开关），首页 / 控制台 / 文档用本包的文案键；
 * - 移动端菜单只在打开时渲染（关闭时不再留下可聚焦的隐藏链接），并补上语言切换；
 * - 未登录时右侧是"登录"描边按钮，金色主按钮留给页面内容区。
 * 登录提示对话框（需要登录的模块）保持官方逻辑。
 */
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { isDefaultLogo } from '@/assets/brand'
import { BrandLogo } from '@/assets/brand-logo'
import { Dialog } from '@/components/dialog'
import { LanguageSwitcher } from '@/components/language-switcher'
import { NotificationPopover } from '@/components/notification-popover'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/hooks/use-notifications'
import { useSystemConfig } from '@/hooks/use-system-config'
import { useTopNavLinks } from '@/hooks/use-top-nav-links'
import { DEFAULT_SYSTEM_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

import { defaultTopNavLinks } from '../config/top-nav.config'
import type { TopNavLink } from '../types'
import { HeaderLogo } from './header-logo'
import { PUBLIC_NAV_LABEL_KEYS } from './public-nav-labels'

const AUTH_PROMPT_SECONDS = 5
const MOBILE_MENU_ID = 'public-mobile-menu'

type AuthPromptTarget = {
  title: string
  href: string
}

export interface PublicHeaderProps {
  navLinks?: TopNavLink[]
  mobileLinks?: TopNavLink[]
  navContent?: React.ReactNode
  showThemeSwitch?: boolean
  showLanguageSwitcher?: boolean
  logo?: React.ReactNode
  siteName?: string
  homeUrl?: string
  leftContent?: React.ReactNode
  rightContent?: React.ReactNode
  showNavigation?: boolean
  showAuthButtons?: boolean
  showNotifications?: boolean
  className?: string
}

/** 当前页属于该入口：完全匹配，或是它的子路径（如 /docs/quick-start 属于 /docs）。 */
function isLinkActive(pathname: string, href: string): boolean {
  if (pathname === href) return true
  return href !== '/' && pathname.startsWith(`${href}/`)
}

export function PublicHeader(props: PublicHeaderProps) {
  const {
    navLinks = defaultTopNavLinks,
    showThemeSwitch = true,
    showLanguageSwitcher = true,
    logo: customLogo,
    siteName: customSiteName,
    homeUrl = '/',
    showAuthButtons = true,
    showNotifications = true,
  } = props

  const { t } = useTranslation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [authPromptTarget, setAuthPromptTarget] =
    useState<AuthPromptTarget | null>(null)
  const [authPromptSecondsLeft, setAuthPromptSecondsLeft] =
    useState(AUTH_PROMPT_SECONDS)
  const { auth } = useAuthStore()
  const {
    systemName,
    logo: systemLogo,
    loading,
    logoLoaded,
  } = useSystemConfig()
  const dynamicLinks = useTopNavLinks()
  const notifications = useNotifications()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const user = auth.user
  const isAuthenticated = !!user
  const displaySiteName = customSiteName || systemName
  const links = dynamicLinks.length > 0 ? dynamicLinks : navLinks
  const navLabel = useCallback(
    (link: TopNavLink) => {
      const key = PUBLIC_NAV_LABEL_KEYS[link.href]
      return key ? t(key) : t(link.title)
    },
    [t]
  )

  // [user-ui] 品牌位：默认 Logo + 默认站名 → 横排标识；否则 Logo + 站名
  const showBrandLockup =
    !customLogo &&
    isDefaultLogo(systemLogo) &&
    displaySiteName === DEFAULT_SYSTEM_NAME
  let brandContent: ReactNode = (
    <>
      <span className='flex size-7 shrink-0 items-center justify-center'>
        {customLogo ?? (
          <HeaderLogo
            src={systemLogo}
            loading={loading}
            logoLoaded={logoLoaded}
            className='size-full rounded-md object-contain'
          />
        )}
      </span>
      <span
        className='max-w-48 truncate text-base font-bold tracking-tight'
        title={displaySiteName}
      >
        {displaySiteName}
      </span>
    </>
  )
  if (showBrandLockup) {
    brandContent = (
      <BrandLogo className='h-6 w-auto sm:h-7' alt={displaySiteName} />
    )
  }
  if (loading) {
    brandContent = <Skeleton className='h-7 w-36 rounded-md' />
  }

  let authContent: ReactNode = (
    <Button variant='outline' size='sm' render={<Link to='/sign-in' />}>
      {t('home.cta.signIn')}
    </Button>
  )
  if (isAuthenticated) authContent = <ProfileDropdown />
  if (loading) authContent = <Skeleton className='h-8 w-16 rounded-md' />

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  // [user-ui] 移动端菜单：Esc 关闭；切换到桌面宽度时自动关闭
  useEffect(() => {
    if (!mobileOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    const desktop = window.matchMedia('(min-width: 1024px)')
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onDesktop)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onDesktop)
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!authPromptTarget) return

    const intervalId = window.setInterval(() => {
      setAuthPromptSecondsLeft((seconds) => Math.max(seconds - 1, 0))
    }, 1000)

    const timeoutId = window.setTimeout(() => {
      const redirect = authPromptTarget.href
      setAuthPromptTarget(null)
      navigate({ to: '/sign-in', search: { redirect } })
    }, AUTH_PROMPT_SECONDS * 1000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [authPromptTarget, navigate])

  const closeAuthPrompt = useCallback(() => {
    setAuthPromptTarget(null)
    setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
  }, [])

  const navigateToSignIn = useCallback(() => {
    const redirect = authPromptTarget?.href || '/'
    setAuthPromptTarget(null)
    navigate({ to: '/sign-in', search: { redirect } })
  }, [authPromptTarget?.href, navigate])

  const handleNavLinkClick = useCallback(
    (
      event: React.MouseEvent<HTMLAnchorElement>,
      link: TopNavLink,
      closeMobile = false
    ) => {
      if (link.disabled) {
        event.preventDefault()
        return
      }

      if (link.requiresAuth) {
        event.preventDefault()
        if (closeMobile) {
          setMobileOpen(false)
        }
        setAuthPromptSecondsLeft(AUTH_PROMPT_SECONDS)
        setAuthPromptTarget({
          title: navLabel(link),
          href: link.href,
        })
        return
      }

      if (closeMobile) {
        setMobileOpen(false)
      }
    },
    [navLabel]
  )

  const renderNavLink = (link: TopNavLink, variant: 'desktop' | 'mobile') => {
    const isActive = !link.external && isLinkActive(pathname, link.href)
    const closeMobile = variant === 'mobile'
    const className = cn(
      variant === 'desktop'
        ? 'inline-flex h-9 min-w-0 items-center truncate rounded-md px-3 text-sm font-semibold transition-colors'
        : 'border-border flex h-14 items-center justify-between border-b text-lg font-semibold',
      isActive && variant === 'desktop' && 'bg-accent text-accent-foreground',
      isActive && variant === 'mobile' && 'text-foreground',
      !isActive &&
        'text-muted-foreground hover:text-foreground hover:bg-muted/60',
      variant === 'mobile' && 'hover:bg-transparent',
      link.disabled && 'pointer-events-none opacity-50'
    )
    const label = navLabel(link)
    const marker =
      variant === 'mobile' && isActive ? (
        <span aria-hidden='true' className='bg-primary h-3 w-3 rounded-sm' />
      ) : null

    if (link.external) {
      return (
        <a
          key={`${link.title}:${link.href}`}
          href={link.href}
          title={label}
          target='_blank'
          rel='noopener noreferrer'
          aria-disabled={link.disabled}
          tabIndex={link.disabled ? -1 : undefined}
          onClick={(event) => handleNavLinkClick(event, link, closeMobile)}
          className={className}
        >
          {label}
        </a>
      )
    }
    return (
      <Link
        key={`${link.title}:${link.href}`}
        to={link.href}
        title={label}
        disabled={link.disabled}
        aria-current={isActive ? 'page' : undefined}
        onClick={(event) => handleNavLinkClick(event, link, closeMobile)}
        className={className}
      >
        {label}
        {marker}
      </Link>
    )
  }

  return (
    <>
      <header
        className={cn(
          'bg-background fixed inset-x-0 top-0 z-50 border-b-2 transition-colors duration-200 motion-reduce:transition-none',
          scrolled || mobileOpen ? 'border-edge-soft' : 'border-transparent'
        )}
      >
        <nav
          aria-label={t('home.nav.main')}
          className='mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8'
        >
          {/* Brand */}
          <Link
            to={homeUrl}
            aria-label={displaySiteName}
            className='focus-visible:ring-ring flex min-w-0 shrink-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2'
          >
            {brandContent}
          </Link>
          {/* [user-ui] 版本更新按钮（管理员功能）已移除 */}

          {/* Desktop nav */}
          <div className='ml-6 hidden min-w-0 items-center gap-1 lg:flex'>
            {links.map((link) => renderNavLink(link, 'desktop'))}
          </div>

          <div className='ml-auto hidden items-center gap-1 lg:flex'>
            {showLanguageSwitcher && <LanguageSwitcher />}
            {showThemeSwitch && <ThemeSwitch />}
            {showNotifications && (
              <NotificationPopover
                open={notifications.popoverOpen}
                onOpenChange={notifications.setPopoverOpen}
                unreadCount={notifications.unreadCount}
                activeTab={notifications.activeTab}
                onTabChange={notifications.setActiveTab}
                notice={notifications.notice}
                announcements={notifications.announcements}
                loading={notifications.loading}
              />
            )}
            {showAuthButtons && (
              <>
                <span aria-hidden='true' className='bg-border mx-2 h-6 w-0.5' />
                {authContent}
              </>
            )}
          </div>

          {/* Mobile: avatar + menu toggle */}
          <div className='ml-auto flex shrink-0 items-center gap-1 lg:hidden'>
            {showAuthButtons && !loading && isAuthenticated && (
              <ProfileDropdown />
            )}
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-10'
              onClick={() => setMobileOpen((open) => !open)}
              aria-expanded={mobileOpen}
              aria-controls={MOBILE_MENU_ID}
              aria-label={
                mobileOpen ? t('home.nav.closeMenu') : t('home.nav.openMenu')
              }
            >
              {mobileOpen ? (
                <X className='size-5' aria-hidden='true' />
              ) : (
                <Menu className='size-5' aria-hidden='true' />
              )}
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile menu: rendered only while open */}
      {mobileOpen && (
        <div
          id={MOBILE_MENU_ID}
          className='bg-background fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto lg:hidden'
        >
          <div className='flex min-h-full flex-col gap-8 px-4 pt-2 pb-8 sm:px-6'>
            <nav aria-label={t('home.nav.main')} className='flex flex-col'>
              {links.map((link) => renderNavLink(link, 'mobile'))}
            </nav>

            {(showThemeSwitch || showLanguageSwitcher) && (
              <div className='flex flex-col gap-3'>
                {showThemeSwitch && (
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm font-semibold'>
                      {t('home.nav.appearance')}
                    </span>
                    <ThemeSwitch />
                  </div>
                )}
                {showLanguageSwitcher && (
                  <div className='flex items-center justify-between'>
                    <span className='text-muted-foreground text-sm font-semibold'>
                      {t('home.nav.language')}
                    </span>
                    <LanguageSwitcher />
                  </div>
                )}
              </div>
            )}

            {showAuthButtons && !isAuthenticated && (
              <Button
                size='lg'
                className='mt-auto w-full'
                render={<Link to='/sign-in' />}
                onClick={() => setMobileOpen(false)}
              >
                {t('home.cta.signIn')}
              </Button>
            )}
            {showAuthButtons && isAuthenticated && (
              <Button
                size='lg'
                className='mt-auto w-full'
                render={<Link to='/dashboard' />}
                onClick={() => setMobileOpen(false)}
              >
                {t('home.cta.console')}
              </Button>
            )}
          </div>
        </div>
      )}

      <Dialog
        open={!!authPromptTarget}
        onOpenChange={(open) => {
          if (!open) {
            closeAuthPrompt()
          }
        }}
        title={t('Sign in required')}
        description={t('Please sign in to view {{module}}.', {
          module: authPromptTarget?.title || '',
        })}
        contentClassName='sm:max-w-md'
        contentHeight='auto'
        footer={
          <>
            <Button variant='outline' onClick={closeAuthPrompt}>
              {t('Cancel')}
            </Button>
            <Button onClick={navigateToSignIn}>{t('Sign in now')}</Button>
          </>
        }
      >
        <div className='bg-muted/40 text-muted-foreground rounded-lg px-3 py-2 text-sm'>
          {t('Redirecting to sign in in {{seconds}} seconds.', {
            seconds: authPromptSecondsLeft,
          })}
        </div>
      </Dialog>
    </>
  )
}
