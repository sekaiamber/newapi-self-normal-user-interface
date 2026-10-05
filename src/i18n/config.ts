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
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { convertDetectedLanguage } from './languages'
import en from './locales/en.json'
import zhCN from './locales/zh.json'
import { overridesEn, overridesZh, withOverrides } from './overrides'

// [user-ui] 只加载简体中文与英文（owner 2026-10-05 决定），并合并 i18n 覆盖层（见 ./overrides/index.ts）
export const resources = {
  en: withOverrides(en, overridesEn),
  zhCN: withOverrides(zhCN, overridesZh),
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zhCN'],
    load: 'currentOnly',
    nsSeparator: false, // Allow literal colons in keys (e.g., URLs, labels)
    debug: import.meta.env.DEV,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      // Browsers report `zh-CN`/`zh-TW`/`zh`; map them onto our `zhCN`/`zhTW`
      // codes (non-Chinese codes pass through for normal supportedLngs matching).
      convertDetectedLanguage,
    },
  })

// [user-ui] 相对时间（dayjs fromNow，如登录会话的"最后活跃"）跟随界面语言；官方未设置 dayjs 语言，中文界面显示英文"a few seconds ago"
export function toDayjsLocale(language: string | undefined): 'zh-cn' | 'en' {
  return language?.startsWith('zh') ? 'zh-cn' : 'en'
}
dayjs.locale(toDayjsLocale(i18n.resolvedLanguage ?? i18n.language))
i18n.on('languageChanged', (lng) => {
  dayjs.locale(toDayjsLocale(lng))
})

export default i18n
