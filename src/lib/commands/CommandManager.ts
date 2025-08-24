/**
 * Slash Command Manager
 * スラッシュコマンドの管理と実行を行うクラス
 */

import type { SlashCommand, ChatContext, CommandSuggestion } from './types'

export class SlashCommandManager {
  private commands = new Map<string, SlashCommand>()
  private aliases = new Map<string, string>()

  /**
   * コマンドを登録
   */
  register(command: SlashCommand): void {
    this.commands.set(command.name, command)
    
    // エイリアスも登録
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.set(alias, command.name)
      }
    }
  }

  /**
   * 入力がコマンドかどうかをチェック
   */
  isCommand(input: string): boolean {
    return input.startsWith('/')
  }

  /**
   * コマンドを実行
   */
  async execute(input: string, context: ChatContext): Promise<boolean> {
    if (!this.isCommand(input)) {
      return false
    }

    // コマンドと引数をパース
    const parts = input.slice(1).split(' ')
    const commandName = parts[0].toLowerCase()
    const args = parts.slice(1)

    // コマンド名を解決（エイリアス対応）
    const resolvedName = this.aliases.get(commandName) || commandName
    const command = this.commands.get(resolvedName)

    if (!command) {
      // 存在しないコマンドの場合
      context.addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: `❌ コマンド '/${commandName}' が見つかりません。\n\n'/help' で利用可能なコマンドを確認してください。`,
        timestamp: new Date()
      })
      return true
    }

    try {
      await command.execute(args, context)
      return true
    } catch (error) {
      console.error('Command execution error:', error)
      context.addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: `❌ コマンド実行エラー: ${String(error)}`,
        timestamp: new Date()
      })
      return true
    }
  }

  /**
   * 部分入力に基づくコマンド候補を取得
   */
  getSuggestions(partialInput: string): CommandSuggestion[] {
    if (!this.isCommand(partialInput)) {
      return []
    }

    const query = partialInput.slice(1).toLowerCase()
    const suggestions: CommandSuggestion[] = []

    // 登録されたコマンドから候補を検索
    for (const [name, command] of this.commands) {
      if (command.hidden) continue

      if (name.startsWith(query)) {
        suggestions.push({
          command,
          highlight: this.highlightMatch(name, query),
          description: command.description
        })
      }
    }

    // エイリアスからも検索
    for (const [alias, originalName] of this.aliases) {
      if (alias.startsWith(query)) {
        const command = this.commands.get(originalName)
        if (command && !command.hidden) {
          suggestions.push({
            command,
            highlight: this.highlightMatch(alias, query),
            description: command.description
          })
        }
      }
    }

    // 重複を除去してソート
    const uniqueSuggestions = suggestions.filter(
      (suggestion, index, self) => 
        index === self.findIndex(s => s.command.name === suggestion.command.name)
    )

    return uniqueSuggestions.sort((a, b) => 
      a.command.name.localeCompare(b.command.name)
    )
  }

  /**
   * 登録されている全コマンドを取得
   */
  getAllCommands(): SlashCommand[] {
    return Array.from(this.commands.values())
  }

  /**
   * マッチ部分をハイライト
   */
  private highlightMatch(text: string, query: string): string {
    if (!query) return text
    
    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return text
    
    return text.slice(0, index) + 
           `<mark>${text.slice(index, index + query.length)}</mark>` +
           text.slice(index + query.length)
  }
}