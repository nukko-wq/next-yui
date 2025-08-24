/**
 * /clear コマンド
 * 会話履歴をクリアする（Ctrl+K と同じ機能）
 */

import type { SlashCommand } from '../types'

export const clearCommand: SlashCommand = {
  name: 'clear',
  description: '会話履歴をクリアします（Ctrl+K と同じ）',
  aliases: ['c'],
  async execute(args: string[], context) {
    try {
      // セッションをクリア
      await context.clearSession()
      
      // メッセージリストもクリア
      context.setMessages([])
      
      // システムメッセージで完了を通知
      setTimeout(() => {
        context.addMessage({
          id: Date.now().toString(),
          type: 'system',
          content: '💫 会話履歴をクリアしました',
          timestamp: new Date()
        })
      }, 100)
      
    } catch (error) {
      console.error('Clear command error:', error)
      context.addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: `❌ 会話履歴のクリアに失敗しました: ${String(error)}`,
        timestamp: new Date()
      })
    }
  }
}