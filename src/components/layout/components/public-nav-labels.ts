/*
 * [user-ui] 公共顶栏 / 首页页脚的导航文案（本仓库新增文件，非官方代码）。
 *
 * useTopNavLinks 返回的标题沿用官方文案（"Home" 在中文里是"主页"）；公共页上的固定入口
 * 改用 home 覆盖层里的键（首页 / 控制台 / 文档）。没有登记的入口仍用官方标题。
 */
export const PUBLIC_NAV_LABEL_KEYS: Readonly<Record<string, string>> = {
  '/': 'home.nav.home',
  '/dashboard': 'home.nav.console',
  '/docs': 'home.nav.docs',
}
