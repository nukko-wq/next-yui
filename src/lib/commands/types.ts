/**
 * Slash Commands Type Definitions
 * スラッシュコマンドシステムの型定義
 */

import type { Dispatch, SetStateAction } from 'react'

export interface Message {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  processing?: boolean
  isTyping?: boolean
  isSettings?: boolean
}

export interface ChatContext {
  // セッション管理
  clearSession: () => Promise<void>
  
  // メッセージ操作
  addMessage: (message: Message) => void
  setMessages: Dispatch<SetStateAction<Message[]>>
  
  // UI操作
  setInputMessage: Dispatch<SetStateAction<string>>
  
  // システム情報
  sessionId: string
  isConnected: boolean
}

export interface SlashCommand {
  name: string
  description: string
  execute: (args: string[], context: ChatContext) => Promise<void>
  aliases?: string[]
  hidden?: boolean
}

export interface CommandSuggestion {
  command: SlashCommand
  highlight: string
  description: string
}