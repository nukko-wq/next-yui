/**
 * /help コマンド
 * 利用可能なコマンドの一覧を表示
 */

import type { SlashCommand } from '../types'

export const helpCommand: SlashCommand = {
  name: 'help',
  description: '利用可能なコマンドを表示します',
  aliases: ['h'],
  async execute(args: string[], context) {
    // コマンドマネージャーは直接アクセスできないので、
    // 固定のヘルプテキストを表示（将来的に改善可能）
    const helpText = `🆘 **利用可能なコマンド**

**基本コマンド:**
- **/clear** (または /c) - 会話履歴をクリアします（Ctrl+K と同じ）
- **/help** (または /h) - このヘルプを表示します

**使用方法:**
コマンドは入力欄で \`/\` で始めて入力してください。
例: \`/clear\`, \`/help\`

**ショートカット:**
- **Ctrl+K** - 会話履歴をクリア（/clear と同じ）`

    context.addMessage({
      id: Date.now().toString(),
      type: 'system',
      content: helpText,
      timestamp: new Date()
    })
  }
}