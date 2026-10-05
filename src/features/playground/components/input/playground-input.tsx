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
import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'

import {
  PromptInput,
  PromptInputFooter,
  PromptInputTextarea,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input'

import { getSubmittableInputText } from '../../lib'
import type {
  ModelOption,
  GroupOption,
  ParameterEnabled,
  PlaygroundConfig,
} from '../../types'
import { PlaygroundInputControls } from './playground-input-controls'
import { PlaygroundInputTools } from './playground-input-tools'

interface PlaygroundInputProps {
  config: PlaygroundConfig
  // [user-ui] 输入框内容由页面持有：起始示例点击后只填入输入框，"查看代码"也要读取未发送的草稿
  text: string
  onTextChange: (text: string) => void
  textareaRef?: Ref<HTMLTextAreaElement>
  onSubmit: (text: string) => void
  onStop?: () => void
  disabled?: boolean
  isGenerating?: boolean
  models: ModelOption[]
  modelValue: string
  onModelChange: (value: string) => void
  isModelLoading?: boolean
  groups: GroupOption[]
  groupValue: string
  onGroupChange: (value: string) => void
  hasMessages?: boolean
  onConfigChange: <K extends keyof PlaygroundConfig>(
    key: K,
    value: PlaygroundConfig[K]
  ) => void
  onClearMessages?: () => void
  onParameterEnabledChange: (
    key: keyof ParameterEnabled,
    value: boolean
  ) => void
  parameterEnabled: ParameterEnabled
}

export function PlaygroundInput({
  config,
  text,
  onTextChange,
  textareaRef,
  onSubmit,
  onStop,
  disabled,
  isGenerating,
  models,
  modelValue,
  onModelChange,
  isModelLoading = false,
  groups,
  groupValue,
  onGroupChange,
  hasMessages = false,
  onConfigChange,
  onClearMessages,
  onParameterEnabledChange,
  parameterEnabled,
}: PlaygroundInputProps) {
  const { t } = useTranslation()

  const handleSubmit = (message: PromptInputMessage) => {
    const submittableText = getSubmittableInputText(message, disabled)

    if (!submittableText) return
    onSubmit(submittableText)
    onTextChange('')
  }

  return (
    <div className='grid shrink-0 gap-1.5 px-1 pb-2 md:pb-3'>
      {/* [user-ui] 品牌硬边输入框：去掉柔和大阴影和圆角，聚焦时近黑边；
          InputGroup 的 has-disabled 样式会因为里面任何一个禁用按钮（如空输入时的发送）把整个框变灰，这里还原 */}
      <PromptInput
        className='relative'
        groupClassName='bg-card has-disabled:bg-card has-disabled:opacity-100 dark:has-disabled:bg-background focus-within:border-edge overflow-hidden'
        onSubmit={handleSubmit}
      >
        <PromptInputTextarea
          autoComplete='off'
          autoCorrect='off'
          autoCapitalize='off'
          spellCheck={false}
          className='min-h-20 px-5 pt-4 pb-3 leading-7 md:min-h-24 md:text-base'
          disabled={disabled}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={t('playground.input.placeholder')}
          ref={textareaRef}
          value={text}
        />

        <PromptInputFooter className='border-border bg-muted/40 border-t px-3 py-2.5'>
          <PlaygroundInputControls
            disabled={disabled}
            groups={groups}
            groupValue={groupValue}
            isGenerating={isGenerating}
            isModelLoading={isModelLoading}
            models={models}
            modelValue={modelValue}
            onGroupChange={onGroupChange}
            onModelChange={onModelChange}
            onStop={onStop}
            text={text}
            tools={
              <PlaygroundInputTools
                config={config}
                disabled={disabled}
                hasMessages={hasMessages}
                onConfigChange={onConfigChange}
                onClearMessages={onClearMessages}
                onParameterEnabledChange={onParameterEnabledChange}
                parameterEnabled={parameterEnabled}
              />
            }
          />
        </PromptInputFooter>
      </PromptInput>
      {/* [user-ui] 计费与保存位置说明（审计 2.10 #8；/pg 接口复用统一计费，见官方文档 guide/feature-guide/user/api.md） */}
      <p className='text-muted-foreground px-1 text-center text-xs'>
        {t('playground.input.footnote')}
      </p>
    </div>
  )
}
