/*
 * [user-ui] 在线试用的起始示例（本仓库新增文件，非官方代码）。
 *
 * 官方版的四个卡片只有两个词（"Analyze data" 等），点击即原样发出，立刻产生一次计费请求（审计 2.10 #2）。
 * 这里改为完整的示例提示词；点击只填入输入框，由用户修改后再发送。
 * 文案在 i18n 覆盖层 playground.{zh,en}.json 的 playground.starter.* 下。
 */
export type StarterPromptId = 'explain' | 'summarize' | 'code' | 'translate'

export type StarterPrompt = {
  id: StarterPromptId
  titleKey: string
  promptKey: string
}

export const STARTER_PROMPTS: readonly StarterPrompt[] = [
  {
    id: 'explain',
    titleKey: 'playground.starter.explain.title',
    promptKey: 'playground.starter.explain.prompt',
  },
  {
    id: 'summarize',
    titleKey: 'playground.starter.summarize.title',
    promptKey: 'playground.starter.summarize.prompt',
  },
  {
    id: 'code',
    titleKey: 'playground.starter.code.title',
    promptKey: 'playground.starter.code.prompt',
  },
  {
    id: 'translate',
    titleKey: 'playground.starter.translate.title',
    promptKey: 'playground.starter.translate.prompt',
  },
]
