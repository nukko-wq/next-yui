/**
 * Slash Commands System
 * スラッシュコマンドシステムのメインエクスポート
 */

import { SlashCommandManager } from './CommandManager'
import { clearCommand } from './commands/clear'
import { helpCommand } from './commands/help'
import { settingCommand } from './commands/setting'

/**
 * デフォルトのコマンドマネージャーを作成
 */
export function createCommandManager(): SlashCommandManager {
  const manager = new SlashCommandManager()
  
  // 基本コマンドを登録
  manager.register(clearCommand)
  manager.register(helpCommand)
  manager.register(settingCommand)
  
  return manager
}

// 型とクラスをエクスポート
export { SlashCommandManager } from './CommandManager'
export type { SlashCommand, ChatContext, CommandSuggestion, Message } from './types'