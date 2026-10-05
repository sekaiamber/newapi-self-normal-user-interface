/*
 * [user-ui] SwarmRouter 品牌标识（本仓库新增文件，非官方代码）。
 *
 * 浅色主题用原版 SVG，暗色主题用 *-dark.svg（近黑换成纸白）。两张图同时输出，
 * 按 `.dark` 类切换显示，不依赖 JS 判断主题。后台配置了自定义 Logo 时，
 * 调用方应改用那张图（见 brand.ts 的 isDefaultLogo）。
 */
import { cn } from '@/lib/utils'

import { BRAND_ASSETS, BRAND_NAME } from './brand'

type BrandImageProps = {
  className?: string
  alt?: string
}

function ThemedImage(props: BrandImageProps & { light: string; dark: string }) {
  const alt = props.alt ?? BRAND_NAME
  return (
    <>
      <img
        src={props.light}
        alt={alt}
        className={cn(props.className, 'dark:hidden')}
        draggable={false}
      />
      <img
        src={props.dark}
        alt={alt}
        className={cn(props.className, 'hidden dark:block')}
        draggable={false}
      />
    </>
  )
}

/** 蜂巢图标（约 1:1）。 */
export function BrandIcon(props: BrandImageProps) {
  return (
    <ThemedImage
      light={BRAND_ASSETS.icon}
      dark={BRAND_ASSETS.iconDark}
      className={props.className}
      alt={props.alt}
    />
  )
}

/** 图标 + 文字横排标识（约 6.9:1），给定高度、宽度自适应。 */
export function BrandLogo(props: BrandImageProps) {
  return (
    <ThemedImage
      light={BRAND_ASSETS.logo}
      dark={BRAND_ASSETS.logoDark}
      className={props.className}
      alt={props.alt}
    />
  )
}
