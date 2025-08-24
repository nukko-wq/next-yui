/**
 * Google Gemini API Client
 * Google Gemini API との通信を管理するクライアント
 */

import { type Chat, type Content, GoogleGenAI } from '@google/genai'
import { type ChatResponse, GeminiConfig } from './config'

export class GeminiChatBot {
  private apiKey: string | undefined
  private genAI: GoogleGenAI | null = null
  private sessionChats: Map<string, Chat> = new Map()

  constructor() {
    this.apiKey = GeminiConfig.API_KEY
    this.initializeGemini()
  }

  private initializeGemini(): boolean {
    if (!this.apiKey) {
      console.error('GEMINI_API_KEY environment variable not set')
      return false
    }

    try {
      this.genAI = new GoogleGenAI({ apiKey: this.apiKey })
      console.log('Gemini API initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error)
      return false
    }
  }

  /**
   * セッション用のチャットインスタンスを取得または作成
   */
  private getOrCreateChat(sessionId: string): Chat {
    if (!this.genAI) {
      throw new Error('Gemini API not initialized')
    }

    // 既存のチャットがあれば返す
    const existingChat = this.sessionChats.get(sessionId)
    if (existingChat) {
      return existingChat
    }

    // 新しいチャットセッションを作成
    const chat = this.genAI.chats.create({
      model: GeminiConfig.MODEL_NAME,
      config: {
        ...GeminiConfig.GENERATION_CONFIG,
        systemInstruction: GeminiConfig.SYSTEM_INSTRUCTION,
      },
    })

    this.sessionChats.set(sessionId, chat)
    console.log(`Created new chat session for ${sessionId}`)
    return chat
  }

  async generateResponse(
    sessionId: string,
    message: string,
  ): Promise<ChatResponse> {
    if (!this.genAI) {
      return {
        response:
          'Gemini APIが初期化されていません。API キーを確認してください。',
        success: false,
        error: 'api_not_initialized',
      }
    }

    try {
      // セッション固有のチャットインスタンスを取得
      const chat = this.getOrCreateChat(sessionId)

      // チャット履歴を保持してメッセージ送信
      const response = await chat.sendMessage({
        message: message,
      })

      if (response.text) {
        return {
          response: response.text.trim(),
          success: true,
          model: GeminiConfig.MODEL_NAME,
          sessionId: sessionId,
        }
      } else {
        return {
          response: '応答の生成に失敗しました。',
          success: false,
          error: 'empty_response',
        }
      }
    } catch (error) {
      console.error('Error generating response:', error)
      return {
        response: `エラーが発生しました: ${String(error)}`,
        success: false,
        error: String(error),
      }
    }
  }

  /**
   * セッションの履歴を取得
   */
  getSessionHistory(sessionId: string): Content[] {
    const chat = this.sessionChats.get(sessionId)
    if (!chat) {
      return []
    }

    try {
      return chat.getHistory()
    } catch (error) {
      console.error('Error getting session history:', error)
      return []
    }
  }

  clearSession(sessionId: string): void {
    if (this.sessionChats.has(sessionId)) {
      this.sessionChats.delete(sessionId)
      console.log(`Cleared chat session for ${sessionId}`)
    }
  }

  isInitialized(): boolean {
    return this.genAI !== null
  }

  getActiveSessionsCount(): number {
    return this.sessionChats.size
  }

  // 設定の検証
  static validateConfig(): string[] {
    return GeminiConfig.validateConfig()
  }
}

// シングルトンインスタンス
let geminiBot: GeminiChatBot | null = null

export function getGeminiBot(): GeminiChatBot {
  if (!geminiBot) {
    geminiBot = new GeminiChatBot()
  }
  return geminiBot
}
