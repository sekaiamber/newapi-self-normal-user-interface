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
/**
 * Application-wide constants
 */

// System Configuration Defaults
// [user-ui] 后端未返回站点名时的默认值
export const DEFAULT_SYSTEM_NAME = 'SwarmRouter'
// [user-ui] 后端未配置 Logo 时的默认图标：SwarmRouter 蜂巢图标（随系统明暗切换配色）。
// 控制台/首页顶栏的品牌位在默认值时改用 public/brand/ 的明暗两版（见 assets/brand-logo.tsx）。
export const DEFAULT_LOGO = '/favicon.svg'

// LocalStorage Keys
export const STORAGE_KEYS = {
  SYSTEM_NAME: 'system_name',
  LOGO: 'logo',
  FOOTER_HTML: 'footer_html',
} as const
