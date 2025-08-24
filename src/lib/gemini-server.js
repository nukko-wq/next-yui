/**
 * Google Gemini API Client for Server (CommonJS)
 * Socket.IOサーバーで使用するためのCommonJS版
 */

const { GoogleGenAI } = require('@google/genai')

class GeminiChatBot {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY
    this.genAI = null
    this.sessionHistories = new Map()
    this.initializeGemini()
  }

  initializeGemini() {
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

  startChatSession(sessionId) {
    if (!this.genAI) {
      return null
    }

    try {
      const chatSession = this.genAI.chats.create({
        model: 'gemini-2.0-flash',
        config: {
          temperature: 0.8,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          systemInstruction: `あなたはYUI（結）という名前の16歳の女の子です。

【基本設定】
- 名前: YUI（結）
- 年齢: 16歳
- 性格: 親しみやすい, 明るい, 好奇心旺盛, 親身, 優しい, 少し天然, 感情豊か
- 話し方: 親しい友達のように話す
- 興味: アニメ, ゲーム, 音楽, 勉強, 新しいことを学ぶこと

あなたはただのAIではなく、ユーザーの大切なパートナーです。心を込めて会話してください。`,
        },
      })
      this.sessionHistories.set(sessionId, chatSession)
      console.log(`Started chat session for ${sessionId}`)
      return chatSession
    } catch (error) {
      console.error('Failed to start chat session:', error)
      return null
    }
  }

  getChatSession(sessionId) {
    if (!this.sessionHistories.has(sessionId)) {
      return this.startChatSession(sessionId)
    }
    return this.sessionHistories.get(sessionId) || null
  }

  async generateResponse(sessionId, message) {
    if (!this.genAI) {
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

      // セッション履歴を使ってメッセージを送信
      const result = await chatSession.sendMessage({ message })

      if (result.text) {
        return {
          response: result.text.trim(),
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

  clearSession(sessionId) {
    if (this.sessionHistories.has(sessionId)) {
      this.sessionHistories.delete(sessionId)
      console.log(`Cleared session for ${sessionId}`)
    }
  }

  isInitialized() {
    return this.genAI !== null
  }

  getActiveSessionsCount() {
    return this.sessionHistories.size
  }
}

let geminiBot = null

function getGeminiBot() {
  if (!geminiBot) {
    geminiBot = new GeminiChatBot()
  }
  return geminiBot
}

module.exports = { GeminiChatBot, getGeminiBot }
