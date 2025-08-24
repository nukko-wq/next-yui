import { type NextRequest, NextResponse } from 'next/server'
import { getGeminiBot } from '@/lib/gemini'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        {
          response: 'セッションIDが必要です。',
          success: false,
          error: 'missing_session_id',
        },
        { status: 400 },
      )
    }

    const geminiBot = getGeminiBot()
    const history = geminiBot.getSessionHistory(sessionId)

    return NextResponse.json({
      history,
      success: true,
      sessionId,
    })
  } catch (error) {
    console.error('Error getting chat history:', error)
    return NextResponse.json(
      {
        response: `履歴取得中にエラーが発生しました: ${String(error)}`,
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, sessionId } = body

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        {
          response: 'メッセージが空です。',
          success: false,
          error: 'empty_message',
        },
        { status: 400 },
      )
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        {
          response: 'セッションIDが必要です。',
          success: false,
          error: 'missing_session_id',
        },
        { status: 400 },
      )
    }

    const geminiBot = getGeminiBot()
    const response = await geminiBot.generateResponse(sessionId, message.trim())

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      {
        response: `メッセージ処理中にエラーが発生しました: ${String(error)}`,
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        {
          response: 'セッションIDが必要です。',
          success: false,
          error: 'missing_session_id',
        },
        { status: 400 },
      )
    }

    const geminiBot = getGeminiBot()
    geminiBot.clearSession(sessionId)

    return NextResponse.json({
      response: '会話履歴をクリアしました。',
      success: true,
      action: 'session_cleared',
    })
  } catch (error) {
    console.error('Error clearing session:', error)
    return NextResponse.json(
      {
        response: `セッションクリア中にエラーが発生しました: ${String(error)}`,
        success: false,
        error: String(error),
      },
      { status: 500 },
    )
  }
}
