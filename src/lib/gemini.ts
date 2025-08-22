/**
 * Google Gemini API Client
 * Google Gemini API との通信を管理するクライアント
 */

import {
  type ChatSession,
  type GenerativeModel,
  GoogleGenerativeAI,
  type SafetySetting,
} from '@google/generative-ai'
import { type ChatResponse, GeminiConfig } from './config'

export class GeminiChatBot {
  private apiKey: string | undefined
  private genAI: GoogleGenerativeAI | null = null
  private model: GenerativeModel | null = null
  private sessionHistories: Map<string, ChatSession> = new Map()

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
      this.genAI = new GoogleGenerativeAI(this.apiKey)

      // 設定ファイルから設定を読み込み
      this.model = this.genAI.getGenerativeModel({
        model: GeminiConfig.MODEL_NAME,
        generationConfig: GeminiConfig.GENERATION_CONFIG,
        safetySettings: GeminiConfig.SAFETY_SETTINGS as SafetySetting[],
        systemInstruction: GeminiConfig.SYSTEM_INSTRUCTION,
      })

      console.log('Gemini API initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize Gemini API:', error)
      return false
    }
  }

  private startChatSession(sessionId: string): ChatSession | null {
    if (!this.model) {
      return null
    }

    try {
      const chatSession = this.model.startChat({
        history: [],
      })
      this.sessionHistories.set(sessionId, chatSession)
      console.log(`Started chat session for ${sessionId}`)
      return chatSession
    } catch (error) {
      console.error('Failed to start chat session:', error)
      return null
    }
  }

  private getChatSession(sessionId: string): ChatSession | null {
    if (!this.sessionHistories.has(sessionId)) {
      return this.startChatSession(sessionId)
    }
    return this.sessionHistories.get(sessionId) || null
  }

  async generateResponse(
    sessionId: string,
    message: string,
  ): Promise<ChatResponse> {
    if (!this.model) {
      return {
        response:
          'Gemini APIが初期化されていません。API キーを確認してください。',
        success: false,
        error: 'api_not_initialized',
      }
    }

    try {
      const chatSession = this.getChatSession(sessionId)
      if (!chatSession) {
        return {
          response: 'チャットセッションの開始に失敗しました。',
          success: false,
          error: 'session_failed',
        }
      }

      // メッセージを送信してレスポンスを取得
      const result = await chatSession.sendMessage(message)
      const response = result.response

      if (response.text()) {
        return {
          response: response.text().trim(),
          success: true,
          model: 'gemini-2.0-flash',
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

  clearSession(sessionId: string): void {
    if (this.sessionHistories.has(sessionId)) {
      this.sessionHistories.delete(sessionId)
      console.log(`Cleared session for ${sessionId}`)
    }
  }

  isInitialized(): boolean {
    return this.model !== null
  }

  getActiveSessionsCount(): number {
    return this.sessionHistories.size
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
