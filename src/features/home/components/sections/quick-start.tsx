/*
 * [user-ui] 首页"三步接入"区块（本仓库新增文件，非官方代码）。
 * 步骤内容依据本站文档 /docs/quick-start（其事实来源见该文档头注释）；
 * 第 1 步随登录状态与注册开关变化；右侧代码示例使用本站真实地址。
 */
import { Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'
import type { ReactElement, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { toOpenAiBaseUrl, useApiBaseUrl } from '@/lib/api-endpoint'

import { useHomeAuth } from '../../hooks/use-home-auth'
import { CodeSamplesPanel } from '../code-samples-panel'
import { HexBadge } from '../honeycomb'
import { InlineCodeText } from '../inline-code-text'
import { SectionHeading } from '../section-heading'

interface StepProps {
  marker: ReactNode
  title: string
  description: string
  action?: ReactNode
}

function Step(props: StepProps) {
  return (
    <li className='flex gap-4'>
      <HexBadge className='mt-0.5 h-9 w-10'>{props.marker}</HexBadge>
      <div className='min-w-0 flex-1'>
        <h3 className='text-lg font-semibold'>{props.title}</h3>
        <p className='text-muted-foreground mt-1.5 text-sm leading-relaxed'>
          <InlineCodeText text={props.description} />
        </p>
        {props.action && <div className='mt-2'>{props.action}</div>}
      </div>
    </li>
  )
}

function StepLink(props: { children: ReactNode; link: ReactElement }) {
  return (
    <Button variant='link' className='h-auto px-0' render={props.link}>
      {props.children}
      <ArrowRight data-icon='inline-end' />
    </Button>
  )
}

export function QuickStart() {
  const { t } = useTranslation()
  const apiBaseUrl = useApiBaseUrl()
  const { isAuthenticated, canRegister } = useHomeAuth()

  let firstStep: StepProps = {
    marker: 1,
    title: t('home.steps.signUp.title'),
    description: t('home.steps.signUp.closed'),
  }
  if (isAuthenticated) {
    firstStep = {
      marker: <Check className='size-4' strokeWidth={3} aria-hidden='true' />,
      title: t('home.steps.signUp.title'),
      description: t('home.steps.signUp.done'),
    }
  } else if (canRegister) {
    firstStep = {
      marker: 1,
      title: t('home.steps.signUp.title'),
      description: t('home.steps.signUp.description'),
    }
  }

  return (
    <section aria-labelledby='home-steps-title'>
      <div className='mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-12 lg:gap-10 lg:px-8'>
        <div className='lg:col-span-5'>
          <SectionHeading
            id='home-steps-title'
            eyebrow={t('home.steps.eyebrow')}
            title={t('home.steps.title')}
          />
          <ol className='mt-10 space-y-8'>
            <Step {...firstStep} />
            <Step
              marker={2}
              title={t('home.steps.createKey.title')}
              description={t('home.steps.createKey.description')}
              action={
                isAuthenticated && (
                  <StepLink link={<Link to='/keys' />}>
                    {t('home.steps.createKey.action')}
                  </StepLink>
                )
              }
            />
            <Step
              marker={3}
              title={t('home.steps.call.title')}
              description={t('home.steps.call.description', {
                baseUrl: toOpenAiBaseUrl(apiBaseUrl),
              })}
              action={
                <StepLink
                  link={
                    <Link to='/docs/$slug' params={{ slug: 'quick-start' }} />
                  }
                >
                  {t('home.steps.call.action')}
                </StepLink>
              }
            />
          </ol>
        </div>
        <div className='min-w-0 lg:col-span-7'>
          <CodeSamplesPanel apiBaseUrl={apiBaseUrl} />
        </div>
      </div>
    </section>
  )
}
