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
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: message,
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

      if (response.text) {
        return {
          response: response.text.trim(),
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
