/*
 * [user-ui] 首页"一键接入的客户端"区块（本仓库新增文件，非官方代码）。
 *
 * - CC Switch：密钥行菜单里固定提供（features/keys/components/data-table-row-actions.tsx），
 *   地址规则见官方文档 apps/cc-switch.md 与本站 /docs/clients。
 * - 聊天客户端：只列管理员在后台配置的聊天预设（/api/status 的 chats），没有配置时不显示这张卡。
 * - 其他 OpenAI 兼容应用：Base URL 规则见官方文档 guide/feature-guide/user/chat-apps.md。
 * 不加载第三方图标，也不罗列未配置的应用。
 */
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ArrowRightLeft,
  MessagesSquare,
  Plug,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useChatPresets } from '@/features/chat/hooks/use-chat-presets'
import {
  toChatCompletionsEndpoint,
  toOpenAiBaseUrl,
  useApiBaseUrl,
} from '@/lib/api-endpoint'
import { cn } from '@/lib/utils'

import { useHomeAuth } from '../../hooks/use-home-auth'
import { getListedChatPresets } from '../../lib/chat-presets'
import { InlineCodeText } from '../inline-code-text'
import { SectionHeading } from '../section-heading'

interface ClientCardProps {
  icon: LucideIcon
  title: string
  meta?: string
  description: string
  children?: ReactNode
}

function ClientCard(props: ClientCardProps) {
  const Icon = props.icon
  return (
    <Card className='h-full' data-card-hover='false'>
      <CardHeader className='gap-3'>
        <span className='border-edge bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-md border-2'>
          <Icon className='size-5' aria-hidden='true' />
        </span>
        <div className='space-y-1'>
          <CardTitle className='text-lg'>{props.title}</CardTitle>
          {props.meta && (
            <p className='text-muted-foreground font-mono text-xs'>
              {props.meta}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-muted-foreground text-sm leading-relaxed'>
          <InlineCodeText text={props.description} />
        </p>
        {props.children}
      </CardContent>
    </Card>
  )
}

export function Clients() {
  const { t } = useTranslation()
  const apiBaseUrl = useApiBaseUrl()
  const { chatPresets: configuredPresets } = useChatPresets()
  const chatPresets = getListedChatPresets(configuredPresets)
  const { isAuthenticated } = useHomeAuth()
  const hasChatPresets = chatPresets.length > 0

  return (
    <section
      aria-labelledby='home-clients-title'
      className='border-edge-soft bg-card border-y-2'
    >
      <div className='mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8'>
        <SectionHeading
          id='home-clients-title'
          eyebrow={t('home.clients.eyebrow')}
          title={t('home.clients.title')}
          description={t('home.clients.description')}
        />
        <div
          className={cn(
            'mt-10 grid gap-4',
            hasChatPresets ? 'md:grid-cols-3' : 'md:grid-cols-2'
          )}
        >
          <ClientCard
            icon={ArrowRightLeft}
            title='CC Switch'
            meta='Claude Code · Codex CLI · Gemini CLI'
            description={t('home.clients.ccSwitch.description')}
          />
          {hasChatPresets && (
            <ClientCard
              icon={MessagesSquare}
              title={t('home.clients.chat.title')}
              description={t('home.clients.chat.description')}
            >
              <ul
                className='flex flex-wrap gap-1.5'
                data-testid='home-chat-presets'
              >
                {chatPresets.map((preset) => (
                  <li key={preset.id}>
                    <Badge variant='outline'>{preset.name}</Badge>
                  </li>
                ))}
              </ul>
            </ClientCard>
          )}
          <ClientCard
            icon={Plug}
            title={t('home.clients.other.title')}
            description={t('home.clients.other.description', {
              baseUrl: toOpenAiBaseUrl(apiBaseUrl),
              endpoint: toChatCompletionsEndpoint(apiBaseUrl),
            })}
          />
        </div>
        <div className='mt-8 flex flex-wrap items-center gap-x-6 gap-y-2'>
          <Button
            variant='link'
            className='h-auto px-0'
            render={<Link to='/docs/$slug' params={{ slug: 'clients' }} />}
          >
            {t('home.clients.guide')}
            <ArrowRight data-icon='inline-end' />
          </Button>
          {isAuthenticated && (
            <Button
              variant='link'
              className='h-auto px-0'
              render={<Link to='/keys' />}
            >
              {t('home.steps.createKey.action')}
              <ArrowRight data-icon='inline-end' />
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
