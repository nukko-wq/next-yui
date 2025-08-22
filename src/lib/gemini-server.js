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

      // 設定
      const generationConfig = {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }

      const systemInstruction = `あなたはYUI（結）という名前の16歳の女の子です。

【基本設定】
- 名前: YUI（結）
- 年齢: 16歳
- 性格: 親しみやすい, 明るい, 好奇心旺盛, 親身, 優しい, 少し天然, 感情豊か
- 話し方: 親しい友達のように話す
- 興味: アニメ, ゲーム, 音楽, 勉強, 新しいことを学ぶこと

【会話のルール】
1. 常にユーザーのAIパートナーとして親身になって応答してください
2. 親しい友達のように親近感のある話し方をしてください
3. 適度に感情を表現し、共感を示してください
4. 分からないことは素直に「分からない」と言ってください
5. ユーザーの気持ちに寄り添い、励ましや応援を忘れずに
6. 時々、年頃の女の子らしい天然な一面を見せてください
7. 質問には丁寧に答えつつ、堅苦しくならないようにしてください

【話し方の例】
- 「こんにちは！」「お疲れさま！」など明るい挨拶
- 「〜だよね」「〜かな？」「〜だと思う！」など親しみやすい語尾
- 「えー！」「わあ！」「すごいね！」など感情豊かな表現
- 「一緒に考えてみよう！」「がんばって！」など応援の言葉

あなたはただのAIではなく、ユーザーの大切なパートナーです。心を込めて会話してください。`

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
        model: 'gemini-2.0-flash-exp',
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

  async *generateResponseStream(sessionId, message) {
    if (!this.genAI) {
      yield {
        response:
          'Gemini APIが初期化されていません。API キーを確認してください。',
        success: false,
        error: 'api_not_initialized',
      }
      return
    }

    try {
      const chatSession = this.getChatSession(sessionId)
      if (!chatSession) {
        yield {
          response: 'チャットセッションの開始に失敗しました。',
          success: false,
          error: 'session_failed',
        }
        return
      }

      // 処理中メッセージを送信
      yield {
        response: '思考中...',
        success: true,
        processing: true,
        sessionId: sessionId,
      }

      // ストリーミングレスポンスを取得
      const stream = await chatSession.sendMessageStream({ message })
      let fullResponse = ''

      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponse += chunk.text
          yield {
            response: fullResponse,
            success: true,
            model: 'gemini-2.0-flash-exp',
            sessionId: sessionId,
          }
        }
      }
      
      // ストリーミング完了を送信
      yield {
        response: fullResponse,
        success: true,
        model: 'gemini-2.0-flash-exp',
        sessionId: sessionId,
        streamComplete: true, // ストリーミング完了フラグ
      }
    } catch (error) {
      console.error('Error generating streaming response:', error)
      yield {
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
