/*
 * [user-ui] 首页代码示例面板：curl / Python / Node.js 切换 + 复制（本仓库新增文件，非官方代码）。
 *
 * 面板内部套一层 `dark` 类，在浅色主题下也呈现近黑底的"终端"外观；颜色仍全部来自主题 token
 * （.dark 作用域下的 --card / --primary-ink 等），外框在浅色主题下是品牌近黑粗边。
 */
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

import {
  buildCodeSamples,
  tokenizeCodeLine,
  type CodeSampleId,
  type CodeToken,
} from '../lib/code-samples'

const TOKEN_CLASS: Record<CodeToken['kind'], string> = {
  plain: '',
  string: 'text-primary-ink',
  comment: 'text-muted-foreground',
}

function CodeLines(props: { code: string }) {
  // 代码是静态文本，行号即稳定标识（行内容可能重复，例如空行）
  const lines = props.code
    .split('\n')
    .map((text, lineNumber) => ({ lineNumber, tokens: tokenizeCodeLine(text) }))
  return (
    <pre className='min-h-[20rem] overflow-x-auto p-4 font-mono text-[13px] leading-6 sm:p-5'>
      <code>
        {lines.map((line) => (
          <span key={line.lineNumber} className='block min-h-6'>
            {line.tokens.map((token) => (
              <span key={token.offset} className={TOKEN_CLASS[token.kind]}>
                {token.text}
              </span>
            ))}
          </span>
        ))}
      </code>
    </pre>
  )
}

interface CodeSamplesPanelProps {
  apiBaseUrl: string
  className?: string
}

export function CodeSamplesPanel(props: CodeSamplesPanelProps) {
  const { t } = useTranslation()
  const [active, setActive] = useState<CodeSampleId>('curl')
  const samples = useMemo(
    () =>
      buildCodeSamples(props.apiBaseUrl, {
        setKey: t('home.steps.comment.setKey'),
        listModels: t('home.steps.comment.listModels'),
        chat: t('home.steps.comment.chat'),
      }),
    [props.apiBaseUrl, t]
  )
  const current = samples.find((sample) => sample.id === active) ?? samples[0]

  return (
    <div
      className={cn(
        'border-edge overflow-hidden rounded-lg border-2',
        props.className
      )}
    >
      <div className='dark bg-card text-card-foreground'>
        <Tabs
          value={active}
          onValueChange={(value) => setActive(value as CodeSampleId)}
          className='gap-0'
        >
          <div className='border-edge-soft flex items-center justify-between gap-2 border-b-2 py-1.5 pr-2 pl-3'>
            <TabsList variant='line' aria-label={t('home.steps.codeLanguage')}>
              {samples.map((sample) => (
                <TabsTrigger
                  key={sample.id}
                  value={sample.id}
                  className='px-2.5 font-mono text-xs'
                >
                  {sample.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <CopyButton
              value={current.code}
              className='size-8'
              iconClassName='size-4'
              tooltip={t('home.steps.copyCode')}
              aria-label={t('home.steps.copyCode')}
            />
          </div>
          {samples.map((sample) => (
            <TabsContent key={sample.id} value={sample.id}>
              <CodeLines code={sample.code} />
            </TabsContent>
          ))}
        </Tabs>
        <p className='border-edge-soft text-muted-foreground border-t-2 px-4 py-3 text-xs leading-relaxed sm:px-5'>
          {t('home.steps.caption')}
        </p>
      </div>
    </div>
  )
}
