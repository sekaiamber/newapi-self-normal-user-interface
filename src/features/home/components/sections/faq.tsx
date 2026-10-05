/*
 * [user-ui] 首页"常见问题"区块（本仓库新增文件，非官方代码）。
 * 每条回答摘自本站文档（/docs/*，其事实来源见各文档头注释），并链接到对应章节。
 * "怎么增加余额"只在钱包功能开启时出现。
 */
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { isUserUiFeatureEnabled } from '@/config/user-ui-features'
import {
  toChatCompletionsEndpoint,
  toOpenAiBaseUrl,
  useApiBaseUrl,
} from '@/lib/api-endpoint'

import { InlineCodeText } from '../inline-code-text'
import { SectionHeading } from '../section-heading'

interface FaqEntry {
  id: string
  question: string
  answer: string
  /** 站内文档：页面 slug 与可选的章节锚点 */
  doc: { slug: string; hash?: string }
}

export function Faq() {
  const { t } = useTranslation()
  const apiBaseUrl = useApiBaseUrl()

  const entries: FaqEntry[] = [
    {
      id: 'models',
      question: t('home.faq.models.question'),
      answer: t('home.faq.models.answer'),
      doc: { slug: 'api-basics', hash: '列出可用模型' },
    },
    {
      id: 'address',
      question: t('home.faq.address.question'),
      answer: t('home.faq.address.answer', {
        v1: toOpenAiBaseUrl(apiBaseUrl),
        root: apiBaseUrl,
        endpoint: toChatCompletionsEndpoint(apiBaseUrl),
      }),
      doc: { slug: 'api-basics', hash: '地址规则' },
    },
    {
      id: 'quota',
      question: t('home.faq.quota.question'),
      answer: t('home.faq.quota.answer'),
      doc: { slug: 'tokens-and-quota', hash: '账户余额与密钥额度' },
    },
  ]
  if (isUserUiFeatureEnabled('wallet')) {
    entries.push({
      id: 'top-up',
      question: t('home.faq.topUp.question'),
      answer: t('home.faq.topUp.answer'),
      doc: { slug: 'tokens-and-quota', hash: '充值与余额' },
    })
  }
  entries.push(
    {
      id: 'errors',
      question: t('home.faq.errors.question'),
      answer: t('home.faq.errors.answer'),
      doc: { slug: 'faq' },
    },
    {
      id: 'key-leak',
      question: t('home.faq.keyLeak.question'),
      answer: t('home.faq.keyLeak.answer'),
      doc: { slug: 'tokens-and-quota', hash: '保护好你的密钥' },
    }
  )

  return (
    <section aria-labelledby='home-faq-title'>
      <div className='mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-12 lg:px-8'>
        <div className='lg:col-span-5 xl:col-span-4'>
          <SectionHeading
            id='home-faq-title'
            eyebrow={t('home.faq.eyebrow')}
            title={t('home.faq.title')}
            description={t('home.faq.description')}
          />
          <Button
            variant='outline'
            className='mt-8'
            render={<Link to='/docs' />}
          >
            <BookOpen data-icon='inline-start' />
            {t('home.faq.allDocs')}
          </Button>
        </div>
        <div className='lg:col-span-7 xl:col-span-8'>
          <Accordion className='border-edge-soft bg-card rounded-lg border-2'>
            {entries.map((entry) => (
              <AccordionItem
                key={entry.id}
                value={entry.id}
                className='border-border px-4 sm:px-5'
              >
                <AccordionTrigger className='py-4 text-base font-semibold hover:no-underline'>
                  {entry.question}
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground space-y-2 pb-4 text-sm leading-relaxed'>
                  <p>
                    <InlineCodeText text={entry.answer} />
                  </p>
                  <Button
                    variant='link'
                    className='h-auto px-0'
                    render={
                      <Link
                        to='/docs/$slug'
                        params={{ slug: entry.doc.slug }}
                        hash={entry.doc.hash}
                      />
                    }
                  >
                    {t('home.faq.details')}
                    <ArrowRight data-icon='inline-end' />
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
