import type { SlashCommand, ChatContext } from '../types'

export const settingCommand: SlashCommand = {
  name: 'setting',
  description: '設定画面を開きます（サウンドのオン/オフなど）',
  async execute(args: string[], context: ChatContext) {
    const settingsMessage = {
      id: `settings-${Date.now()}`,
      type: 'system' as const,
      content: '',
      timestamp: new Date(),
      isSettings: true
    }

    context.addMessage(settingsMessage)
    context.setInputMessage('')
  }
}