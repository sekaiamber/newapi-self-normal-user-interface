/*
 * [user-ui] 充值方式未开放时的说明卡片（本仓库新增文件，非官方代码）。
 *
 * 官方在这种情况下只显示两条英文直译的提示框（"尚未启用在线充值……"、"管理员确认合规条款之前……"），
 * 页面看起来像坏了。这里改成一张说明卡片，告诉用户怎么办（联系管理员），
 * 若管理员配置了"充值链接"则一并给出。
 */
import { ExternalLink, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { TitledCard } from '@/components/ui/titled-card'

interface FundingNoticeCardProps {
  /** 'topup-off'：只是没有在线充值（兑换码可用）；'all-off'：在线充值和兑换码都不可用 */
  variant: 'topup-off' | 'all-off'
  topupLink?: string
}

export function FundingNoticeCard(props: FundingNoticeCardProps) {
  const { t } = useTranslation()
  const allOff = props.variant === 'all-off'

  return (
    <TitledCard
      title={allOff ? t('wallet.funding.title') : t('wallet.topup.title')}
      icon={<Info />}
      iconTone='neutral'
      disableHoverEffect
      contentClassName='space-y-2'
    >
      <p className='text-muted-foreground text-sm'>
        {allOff ? t('wallet.funding.allOff') : t('wallet.funding.topupOff')}
      </p>
      {allOff && props.topupLink && (
        <a
          href={props.topupLink}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary-ink inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline'
        >
          {t('wallet.funding.link')}
          <ExternalLink className='size-3.5' aria-hidden />
        </a>
      )}
    </TitledCard>
  )
}
