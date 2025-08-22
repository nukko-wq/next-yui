/**
 * Gemini Chat Configuration
 * Google Gemini API の設定管理
 */

export class GeminiConfig {
  // API 設定
  static readonly API_KEY = process.env.GEMINI_API_KEY
  static readonly MODEL_NAME = 'gemini-2.0-flash-exp'

  // 生成設定
  static readonly GENERATION_CONFIG = {
    temperature: 0.8, // YUIの感情豊かな表現のため少し高めに設定
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }

  // 安全性設定
  static readonly SAFETY_SETTINGS = [
    {
      category: 'HARM_CATEGORY_HARASSMENT' as const,
      threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const,
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH' as const,
      threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const,
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as const,
      threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const,
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as const,
      threshold: 'BLOCK_MEDIUM_AND_ABOVE' as const,
    },
  ]

  // ペルソナ設定
  static readonly PERSONA_CONFIG = {
    NAME: 'YUI',
    NAME_KANJI: '結',
    AGE: 16,
    PERSONALITY_TRAITS: [
      '親しみやすい',
      '明るい',
      '好奇心旺盛',
      '親身',
      '優しい',
      '少し天然',
      '感情豊か',
    ],
    SPEAKING_STYLE: '親しい友達のように話す',
    INTERESTS: ['アニメ', 'ゲーム', '音楽', '勉強', '新しいことを学ぶこと'],
  }

  // システムプロンプト
  static readonly SYSTEM_INSTRUCTION =
    `あなたは${GeminiConfig.PERSONA_CONFIG.NAME}（${GeminiConfig.PERSONA_CONFIG.NAME_KANJI}）という名前の${GeminiConfig.PERSONA_CONFIG.AGE}歳の女の子です。

【基本設定】
- 名前: ${GeminiConfig.PERSONA_CONFIG.NAME}（${GeminiConfig.PERSONA_CONFIG.NAME_KANJI}）
- 年齢: ${GeminiConfig.PERSONA_CONFIG.AGE}歳
- 性格: ${GeminiConfig.PERSONA_CONFIG.PERSONALITY_TRAITS.join(', ')}
- 話し方: ${GeminiConfig.PERSONA_CONFIG.SPEAKING_STYLE}
- 興味: ${GeminiConfig.PERSONA_CONFIG.INTERESTS.join(', ')}

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

  // サーバー設定
  static readonly SERVER_CONFIG = {
    HOST: '0.0.0.0',
    PORT: 3000,
    DEBUG: process.env.NODE_ENV === 'development',
    SECRET_KEY: 'gemini-chat-secret-key-change-in-production',
    CORS_ORIGINS: '*',
    SOCKETIO_ASYNC_MODE: 'threading',
    SOCKETIO_CORS_ORIGINS: '*',
  }

  // ログ設定
  static readonly LOG_CONFIG = {
    LEVEL: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO',
    FORMAT: '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
  }

  // 設定の検証
  static validateConfig(): string[] {
    const errors: string[] = []

    if (!GeminiConfig.API_KEY) {
      errors.push('GEMINI_API_KEY environment variable is not set')
    }

    return errors
  }
}

// チャット関連の型定義
export interface ChatMessage {
  id: string
  message: string
  response: string
  timestamp: Date
  sessionId: string
}

export interface ChatResponse {
  response: string
  success: boolean
  error?: string
  processing?: boolean
  model?: string
  sessionId?: string
  action?: string
  streamComplete?: boolean
}

export interface SessionStatus {
  connected: boolean
  message: string
  sessionId: string
}
