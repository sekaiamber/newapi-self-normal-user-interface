/*
 * [user-ui] 推荐计划区块（本仓库新增文件，非官方代码）。
 * Adapted from QuantumNous/new-api web/src/features/wallet/index.tsx @ v1.0.0-rc.37 (AGPL-3.0)
 *
 * 官方在钱包页顶层调用 useAffiliate()，即使不显示推荐卡片也会请求 /api/user/aff。
 * 把推荐卡片、划转弹窗和 useAffiliate 收进这个组件后，推荐计划开关关闭（不挂载本组件）时
 * 就不再请求推荐接口。组件内容与官方一致。
 */
import { useState } from 'react'

import { useAffiliate } from '../hooks'
import type { UserWalletData } from '../types'
import { AffiliateRewardsCard } from './affiliate-rewards-card'
import { TransferDialog } from './dialogs/transfer-dialog'

interface ReferralSectionProps {
  user: UserWalletData | null
  complianceConfirmed: boolean
  /** 划转成功后刷新余额 */
  onTransferred: () => Promise<void> | void
}

export function ReferralSection(props: ReferralSectionProps) {
  const [transferOpen, setTransferOpen] = useState(false)
  const { affiliateLink, loading, transferQuota, transferring } = useAffiliate()

  const handleTransfer = async (amount: number) => {
    const success = await transferQuota(amount)
    if (success) {
      await props.onTransferred()
    }
    return success
  }

  return (
    <>
      <AffiliateRewardsCard
        user={props.user}
        affiliateLink={affiliateLink}
        onTransfer={() => setTransferOpen(true)}
        complianceConfirmed={props.complianceConfirmed}
        loading={loading}
      />
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onConfirm={handleTransfer}
        availableQuota={props.user?.aff_quota ?? 0}
        transferring={transferring}
      />
    </>
  )
}
