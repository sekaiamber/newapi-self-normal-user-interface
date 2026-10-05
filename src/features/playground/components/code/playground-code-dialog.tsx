/*
 * [user-ui] 在线试用的"查看代码"对话框（本仓库新增文件，非官方代码）。
 *
 * 把当前模型、已开启的参数和最近一条消息转成 curl / Python(OpenAI SDK) 示例，
 * 接口地址来自 src/lib/api-endpoint.ts 的 useApiBaseUrl()（审计 2.10 #6）。
 */
import { Link } from '@tanstack/react-router'
import { CodeIcon, KeyRoundIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { Dialog } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApiBaseUrl } from '@/lib/api-endpoint'

import {
  buildPlaygroundCodeRequest,
  buildPlaygroundCurl,
  buildPlaygroundPython,
  getCodeSamplePrompt,
} from '../../lib'
import type { Message, ParameterEnabled, PlaygroundConfig } from '../../types'

type PlaygroundCodeDialogProps = {
  config: PlaygroundConfig
  parameterEnabled: ParameterEnabled
  messages: Message[]
  draft: string
  disabled?: boolean
}

type CodeLanguage = 'curl' | 'python'

export function PlaygroundCodeDialog(props: PlaygroundCodeDialogProps) {
  const { t } = useTranslation()
  const apiBaseUrl = useApiBaseUrl()
  const [open, setOpen] = useState(false)
  const [language, setLanguage] = useState<CodeLanguage>('curl')

  const samples = useMemo(() => {
    if (!open) return null
    const prompt = getCodeSamplePrompt(props.draft, props.messages)
    const request = buildPlaygroundCodeRequest(
      props.config,
      props.parameterEnabled,
      prompt
    )
    return {
      curl: buildPlaygroundCurl(apiBaseUrl, request),
      python: buildPlaygroundPython(apiBaseUrl, request),
    }
  }, [
    open,
    apiBaseUrl,
    props.config,
    props.parameterEnabled,
    props.draft,
    props.messages,
  ])

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={t('playground.code.title')}
      description={t('playground.code.description')}
      contentClassName='sm:max-w-3xl'
      trigger={
        <Button
          data-testid='playground-view-code'
          disabled={props.disabled}
          size='sm'
          variant='outline'
        >
          <CodeIcon aria-hidden='true' />
          {t('playground.viewCode')}
        </Button>
      }
    >
      {samples && (
        // minmax(0,1fr)：让代码块在窄屏内部横向滚动，而不是把对话框撑宽
        <div className='grid grid-cols-[minmax(0,1fr)] gap-3'>
          <Tabs
            className='min-w-0'
            value={language}
            onValueChange={(value) => setLanguage(value as CodeLanguage)}
          >
            <TabsList>
              <TabsTrigger value='curl'>cURL</TabsTrigger>
              <TabsTrigger value='python'>Python</TabsTrigger>
            </TabsList>
            <TabsContent className='mt-2 min-w-0' value='curl'>
              <CodeBlock
                code={samples.curl}
                enableCollapse={false}
                language='bash'
                showToolbar
                title='cURL'
              >
                <CodeBlockCopyButton />
              </CodeBlock>
            </TabsContent>
            <TabsContent className='mt-2 min-w-0' value='python'>
              <CodeBlock
                code={samples.python}
                enableCollapse={false}
                language='python'
                showToolbar
                title='Python (OpenAI SDK)'
              >
                <CodeBlockCopyButton />
              </CodeBlock>
            </TabsContent>
          </Tabs>

          <ul className='text-muted-foreground grid list-disc gap-1 pl-5 text-sm'>
            <li>{t('playground.code.keyHint')}</li>
            <li>
              {t('playground.code.groupHint', { group: props.config.group })}
            </li>
          </ul>

          <div>
            <Button render={<Link to='/keys' />} size='sm' variant='outline'>
              <KeyRoundIcon aria-hidden='true' />
              {t('playground.code.manageKeys')}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}
