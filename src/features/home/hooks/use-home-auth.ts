/*
 * [user-ui] 首页按登录状态与注册开关决定主操作（本仓库新增文件，非官方代码）。
 * 注册开关的判断与登录页"没有账号？注册"链接一致（features/auth/sign-in/index.tsx）。
 */
import { useStatus } from '@/hooks/use-status'
import { useAuthStore } from '@/stores/auth-store'

export interface HomeAuthState {
  isAuthenticated: boolean
  /** 本站允许自助注册（未开启自用模式且未关闭注册） */
  canRegister: boolean
}

export function useHomeAuth(): HomeAuthState {
  const isAuthenticated = useAuthStore((state) => !!state.auth.user)
  const { status } = useStatus()
  const canRegister =
    !status?.self_use_mode_enabled && status?.register_enabled !== false
  return { isAuthenticated, canRegister }
}
