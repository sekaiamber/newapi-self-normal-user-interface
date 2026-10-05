/*
 * [user-ui] 账户活动"客户端"列的简短显示（本仓库新增文件，非官方代码）。
 *
 * 审计 2.8 A2：浏览器 UA 显示为"Chrome · macOS"（复用登录会话的解析规则），
 * 无法识别的客户端（如 curl/8.4.0、脚本）原样显示；完整 UA 仍在悬浮提示与详情弹窗里。
 */
import { sessionDevice } from '@/features/security/components/login-session-utils'

export function auditClientLabel(userAgent: string | undefined): string {
  if (!userAgent) return ''
  // Empty labels: an unrecognised browser yields '' or ' · <system>'.
  const device = sessionDevice(userAgent, '', '')
  if (device && !device.startsWith(' · ')) return device
  return userAgent
}
