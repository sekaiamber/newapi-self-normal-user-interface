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
import { useTranslation } from 'react-i18next'

import { QuotaDetailsPopover } from '@/components/quota-details-popover'
import { Progress } from '@/components/ui/progress'
import { toIntlLocale } from '@/i18n/languages'
import { formatQuotaWithCurrency, getCurrencyDisplay } from '@/lib/currency'
import { cn } from '@/lib/utils'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { API_KEY_STATUS } from '../constants'
import type { ApiKey } from '../types'

type ApiKeyQuotaCellProps = {
  apiKey: ApiKey
  now: number
  variant?: 'table' | 'card'
}

// [user-ui] 额度单元格重排（审计 2.5 K4）：表格里两行——主行"剩余 $x"或"不限额"，
// 副行"已用 $y"——不再有不带标签的数字；金额直接带货币符号（按 token 显示时加单位），
// 列头不再写 "额度 ($)"。进度条颜色改用语义 token（success / warning / destructive）。
// 不限额说明改为"仍从账户余额扣费"（审计 2.5 K11、4.1 #5；钱包已开启，措辞保持准确）。
export function ApiKeyQuotaCell(props: ApiKeyQuotaCellProps) {
  const { t, i18n } = useTranslation()
  useSystemConfigStore((state) => state.config.currency)
  const { meta: currency } = getCurrencyDisplay()
  const formatAmount = (quota: number) => {
    const formatted = formatQuotaWithCurrency(quota)
    return currency.kind === 'tokens'
      ? `${formatted} ${t('Tokens')}`
      : formatted
  }
  const used = props.apiKey.used_quota
  const remaining = props.apiKey.remain_quota
  const unlimited = props.apiKey.unlimited_quota
  const total = used + remaining
  const hasProgress = !unlimited && total > 0
  const percentage = hasProgress
    ? Math.min(100, Math.max(0, (remaining / total) * 100))
    : 0
  const formattedUsed = formatAmount(used)
  const formattedRemaining = formatAmount(remaining)
  const formattedTotal = formatAmount(total)
  const formattedPercentage = new Intl.NumberFormat(
    toIntlLocale(i18n.resolvedLanguage || i18n.language),
    { maximumFractionDigits: 1 }
  ).format(percentage)
  const isInactive =
    props.apiKey.status !== API_KEY_STATUS.ENABLED ||
    remaining <= 0 ||
    (props.apiKey.expired_time !== -1 &&
      props.apiKey.expired_time * 1000 <= props.now)
  let progressColor = 'text-success'
  if (isInactive) progressColor = 'text-muted-foreground/60'
  else if (percentage <= 10) progressColor = 'text-destructive'
  else if (percentage <= 30) progressColor = 'text-warning'
  const usageDescription = `${t('Used amount')} ${formattedUsed}`
  const remainingDescription = hasProgress
    ? `${t('Remaining')} ${formattedRemaining}; ${t('Remaining percentage')} ${formattedPercentage}%`
    : `${t('Remaining')} ${formattedRemaining}`
  const triggerLabel = unlimited
    ? `${t('keys.quota.unlimited')}; ${usageDescription}`
    : `${remainingDescription}; ${usageDescription}`

  const details = []
  if (!unlimited) {
    details.push({ label: t('Remaining'), value: formattedRemaining })
  }
  details.push({ label: t('Used amount'), value: formattedUsed })
  if (!unlimited) {
    details.push({ label: t('Current total quota'), value: formattedTotal })
  }
  if (hasProgress) {
    details.push({
      label: t('Remaining percentage'),
      value: `${formattedPercentage}%`,
    })
  }

  const remainingClassName = cn(
    'min-w-0 truncate font-mono tabular-nums',
    !unlimited && remaining < 0 && 'text-destructive',
    !unlimited && remaining === 0 && 'text-muted-foreground'
  )

  return (
    <QuotaDetailsPopover
      title={t('Quota')}
      triggerLabel={
        props.variant === 'card'
          ? `${t('Quota')}; ${triggerLabel}`
          : triggerLabel
      }
      details={details}
      description={
        unlimited
          ? t('keys.quota.unlimitedHint')
          : t(
              'Total = used + remaining. It is not an initial allocation or a periodic budget; changing the remaining quota changes the total and percentage.'
            )
      }
      className={
        props.variant === 'card' ? 'space-y-2.5' : 'max-w-48 space-y-1.5'
      }
      triggerClassName={props.variant === 'card' ? 'py-0' : undefined}
      afterTrigger={
        !unlimited && (
          <Progress
            value={percentage}
            aria-label={t('Remaining percentage')}
            className={cn(
              'w-full [&_[data-slot=progress-indicator]]:bg-current',
              progressColor
            )}
          />
        )
      }
    >
      {props.variant === 'card' ? (
        <span
          data-slot='api-key-quota-values'
          className='grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-2 gap-y-1 text-sm'
        >
          <span className='text-muted-foreground'>{t('Remaining')}</span>
          <span className={cn(remainingClassName, 'text-right')}>
            {unlimited ? t('keys.quota.unlimited') : formattedRemaining}
          </span>
          <span className='text-muted-foreground'>{t('Used amount')}</span>
          <span className='text-muted-foreground min-w-0 truncate text-right font-mono tabular-nums'>
            {formattedUsed}
          </span>
        </span>
      ) : (
        <span
          data-slot='api-key-quota-values'
          className='flex w-full min-w-0 flex-col items-start gap-0.5'
        >
          <span className='flex w-full min-w-0 items-baseline gap-1.5 text-sm'>
            {unlimited ? (
              <span className='font-medium'>{t('keys.quota.unlimited')}</span>
            ) : (
              <>
                <span className='text-muted-foreground shrink-0 text-xs'>
                  {t('Remaining')}
                </span>
                <span className={cn(remainingClassName, 'font-medium')}>
                  {formattedRemaining}
                </span>
              </>
            )}
          </span>
          <span className='text-muted-foreground flex w-full min-w-0 items-baseline gap-1.5 text-xs'>
            <span className='shrink-0'>{t('Used amount')}</span>
            <span className='min-w-0 truncate font-mono tabular-nums'>
              {formattedUsed}
            </span>
          </span>
        </span>
      )}
    </QuotaDetailsPopover>
  )
}
