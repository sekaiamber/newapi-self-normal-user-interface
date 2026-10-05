/*
 * [user-ui] 兑换码卡片（本仓库新增文件，非官方代码）。
 * Adapted from QuantumNous/new-api web/src/features/wallet/components/recharge-form-card.tsx @ v1.0.0-rc.37 (AGPL-3.0)
 *
 * 官方把兑换码放在充值卡片底部；这里拆成独立卡片，与在线充值并列，方便只有兑换码的用户找到。
 * 改动：回车即可兑换（表单提交）；输入为空时按钮禁用；在线充值不可用时兑换按钮成为页面主操作（金色）。
 * 兑换请求仍由 index.tsx 里官方的 useRedemption 处理。
 */
import { ExternalLink, Gift, Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TitledCard } from '@/components/ui/titled-card'

interface RedemptionCardProps {
  /** 后台 enable_redemption（未完成支付合规确认时为 false） */
  enabled: boolean
  code: string
  onCodeChange: (code: string) => void
  onRedeem: () => void
  redeeming: boolean
  /** 后台配置的"充值链接"（获取兑换码的外部地址） */
  topupLink?: string
  /** 页面上没有在线充值时，兑换是主操作 */
  primary?: boolean
}

export function RedemptionCard(props: RedemptionCardProps) {
  const { t } = useTranslation()
  const trimmed = props.code.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!trimmed || props.redeeming) return
    props.onRedeem()
  }

  return (
    <TitledCard
      title={t('wallet.redeem.title')}
      description={t('wallet.redeem.description')}
      icon={<Gift />}
      iconTone='warning'
      disableHoverEffect
      contentClassName='space-y-3'
    >
      {props.enabled ? (
        <form className='space-y-2' onSubmit={handleSubmit}>
          <Label htmlFor='redemption-code' className='sr-only'>
            {t('wallet.redeem.title')}
          </Label>
          <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
            <Input
              id='redemption-code'
              value={props.code}
              onChange={(e) => props.onCodeChange(e.target.value)}
              placeholder={t('wallet.redeem.placeholder')}
              autoComplete='off'
              spellCheck={false}
              className='h-10 min-w-0 font-mono'
            />
            <Button
              type='submit'
              size='lg'
              variant={props.primary ? 'default' : 'outline'}
              disabled={!trimmed || props.redeeming}
            >
              {props.redeeming && (
                <Loader2 className='animate-spin' aria-hidden />
              )}
              {t('wallet.redeem.submit')}
            </Button>
          </div>
        </form>
      ) : (
        <p className='text-muted-foreground text-sm'>
          {t('wallet.redeem.unavailable')}
        </p>
      )}

      {props.topupLink && (
        <p className='text-muted-foreground text-xs'>
          <a
            href={props.topupLink}
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary-ink inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline'
          >
            {t('wallet.redeem.getCode')}
            <ExternalLink className='size-3' aria-hidden />
          </a>
        </p>
      )}
    </TitledCard>
  )
}
