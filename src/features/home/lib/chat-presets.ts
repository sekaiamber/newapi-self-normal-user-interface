/*
 * [user-ui] 首页"聊天客户端"卡片要列出的预设（本仓库新增文件，非官方代码）。
 */
import type { ChatPreset } from '@/features/chat/lib/chat-links'

/**
 * 官方默认预设里有一条 "CC Switch": "ccswitch"；CC Switch 在密钥菜单里有专门的导入对话框，
 * 首页也单独用一张卡片介绍，这里去掉以免重复。
 */
export function getListedChatPresets(
  presets: readonly ChatPreset[]
): ChatPreset[] {
  return presets.filter(
    (preset) => preset.url.trim().toLowerCase() !== 'ccswitch'
  )
}
