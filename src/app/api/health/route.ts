import { NextResponse } from 'next/server'
import { getGeminiBot } from '@/lib/gemini'

export async function GET() {
  try {
    const geminiBot = getGeminiBot()

    return NextResponse.json({
      status: 'healthy',
      gemini_initialized: geminiBot.isInitialized(),
      active_sessions: geminiBot.getActiveSessionsCount(),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
