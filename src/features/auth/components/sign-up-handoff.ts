/*
 * [user-ui] 注册成功 → 登录页的交接（本仓库新增文件，非官方代码）。
 *
 * 审计 2.13 U2：注册接口不建立会话（官方前端注册成功后跳回登录页），这里把刚注册的用户名放进
 * 路由的 history state 交给登录页预填，不写进 URL、也不落浏览器存储；刷新页面后浏览器仍保留该 state。
 */

declare module '@tanstack/history' {
  interface HistoryState {
    /** 刚注册成功的用户名，登录页用来预填并提示"请输入密码登录" */
    signUpUsername?: string
  }
}

export function readSignUpUsername(state: unknown): string | undefined {
  if (!state || typeof state !== 'object') return undefined
  const value = (state as { signUpUsername?: unknown }).signUpUsername
  return typeof value === 'string' && value.trim() ? value : undefined
}
