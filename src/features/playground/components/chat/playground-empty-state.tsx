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
import {
  CodeSquareIcon,
  LanguagesIcon,
  LightbulbIcon,
  MessageSquarePlusIcon,
  NotepadTextIcon,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { STARTER_PROMPTS, type StarterPromptId } from '../../lib'

type PlaygroundEmptyStateProps = {
  // [user-ui] 只把示例填入输入框，由用户修改后再发送（原为直接发送，审计 2.10 #2）
  onSelectPrompt: (prompt: string) => void
}

const STARTER_ICONS: Record<StarterPromptId, LucideIcon> = {
  explain: LightbulbIcon,
  summarize: NotepadTextIcon,
  code: CodeSquareIcon,
  translate: LanguagesIcon,
}

export function PlaygroundEmptyState({
  onSelectPrompt,
}: PlaygroundEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className='flex min-h-[min(520px,calc(100svh-20rem))] items-center justify-center px-1 py-4 md:py-10'>
      <div className='grid w-full max-w-2xl gap-5 text-center'>
        {/* [user-ui] 品牌硬边图标框（原 rounded-xl 1px 边）；手机上隐藏图标和示例预览，让示例卡片一屏放得下 */}
        <div className='bg-muted text-muted-foreground border-edge-soft mx-auto hidden size-11 items-center justify-center rounded-lg border-2 sm:flex'>
          <MessageSquarePlusIcon className='size-5' aria-hidden='true' />
        </div>

        {/* [user-ui] 文案改为"在线试用"语气，并说明示例只会填入输入框 */}
        <div className='grid gap-2'>
          <h3 className='text-xl font-semibold tracking-tight text-balance md:text-2xl'>
            {t('playground.empty.title')}
          </h3>
          <p className='text-muted-foreground mx-auto max-w-lg text-sm leading-6 text-balance'>
            {t('playground.empty.description')}
          </p>
        </div>

        <div className='grid gap-3 sm:grid-cols-2'>
          {STARTER_PROMPTS.map((starter) => {
            const Icon = STARTER_ICONS[starter.id]
            const prompt = t(starter.promptKey)

            return (
              <Button
                className='h-auto min-h-11 flex-col items-start justify-start gap-1 px-3 py-2.5 text-left whitespace-normal'
                data-testid='playground-starter'
                key={starter.id}
                onClick={() => onSelectPrompt(prompt)}
                variant='outline'
              >
                <span className='flex items-center gap-2 font-semibold'>
                  <Icon
                    aria-hidden='true'
                    className='text-muted-foreground size-4'
                  />
                  {t(starter.titleKey)}
                </span>
                <span className='text-muted-foreground hidden text-xs leading-5 font-normal sm:line-clamp-2'>
                  {prompt.trim()}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
