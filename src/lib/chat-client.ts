'use client'

import type { ChatResponse, SessionStatus } from './config'

// 本番環境かどうかを判定
const isProduction = process.env.NODE_ENV === 'production' || typeof window !== 'undefined' && window.location.hostname !== 'localhost'

interface ChatClient {
  connect(): Promise<void>
  disconnect(): void
  sendMessage(message: string): Promise<void>
  clearSession(): Promise<void>
  onStatusChange(callback: (status: SessionStatus) => void): void
  onResponse(callback: (response: ChatResponse) => void): void
  isConnected(): boolean
}

// Socket.IO実装（開発環境用）
class SocketIOClient implements ChatClient {
  private socket: any = null
  private sessionId: string = ''
  private connected: boolean = false
  private statusCallback?: (status: SessionStatus) => void
  private responseCallback?: (response: ChatResponse) => void

  async connect(): Promise<void> {
    if (typeof window === 'undefined') return

    const { io } = await import('socket.io-client')
    
    this.socket = io('/', {
      path: '/socket.io/',
    })

    this.socket.on('connect', () => {
      this.connected = true
      console.log('Connected to server')
    })

    this.socket.on('disconnect', () => {
      this.connected = false
      console.log('Disconnected from server')
    })

    this.socket.on('status', (data: SessionStatus) => {
      this.sessionId = data.sessionId
      this.statusCallback?.(data)
    })

    this.socket.on('response', (data: ChatResponse) => {
      this.responseCallback?.(data)
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close()
      this.connected = false
    }
  }

  async sendMessage(message: string): Promise<void> {
    if (this.socket && this.connected) {
      this.socket.emit('message', { message })
    }
  }

  async clearSession(): Promise<void> {
    if (this.socket && this.connected) {
      this.socket.emit('clear_session')
    }
  }

  onStatusChange(callback: (status: SessionStatus) => void): void {
    this.statusCallback = callback
  }

  onResponse(callback: (response: ChatResponse) => void): void {
    this.responseCallback = callback
  }

  isConnected(): boolean {
    return this.connected
  }
}

// HTTP API実装（本番環境用）
class HTTPClient implements ChatClient {
  private connected: boolean = false
  private sessionId: string = ''
  private statusCallback?: (status: SessionStatus) => void
  private responseCallback?: (response: ChatResponse) => void

  async connect(): Promise<void> {
    try {
      // セッションID生成
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.connected = true
      
      // 接続状態を通知
      this.statusCallback?.({
        connected: true,
        message: 'Gemini チャットボットに接続しました',
        sessionId: this.sessionId,
      })
      
      console.log('Connected via HTTP API')
    } catch (error) {
      console.error('Failed to connect via HTTP API:', error)
      this.connected = false
    }
  }

  disconnect(): void {
    this.connected = false
  }

  async sendMessage(message: string): Promise<void> {
    if (!this.connected) return

    try {
      // 処理中状態を通知
      this.responseCallback?.({
        response: '処理中...',
        success: true,
        processing: true,
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          sessionId: this.sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ChatResponse = await response.json()
      this.responseCallback?.(data)
    } catch (error) {
      console.error('Error sending message:', error)
      this.responseCallback?.({
        response: `メッセージ送信中にエラーが発生しました: ${String(error)}`,
        success: false,
        error: String(error),
      })
    }
  }

  async clearSession(): Promise<void> {
    if (!this.connected) return

    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
        }),
      })

      if (response.ok) {
        this.responseCallback?.({
          response: '会話履歴をクリアしました。',
          success: true,
          action: 'session_cleared',
        })
      }
    } catch (error) {
      console.error('Error clearing session:', error)
      this.responseCallback?.({
        response: `セッションクリア中にエラーが発生しました: ${String(error)}`,
        success: false,
        error: String(error),
      })
    }
  }

  onStatusChange(callback: (status: SessionStatus) => void): void {
    this.statusCallback = callback
  }

  onResponse(callback: (response: ChatResponse) => void): void {
    this.responseCallback = callback
  }

  isConnected(): boolean {
    return this.connected
  }
}

// 環境に応じたクライアントを作成
export function createChatClient(): ChatClient {
  if (isProduction) {
    console.log('Using HTTP API client for production')
    return new HTTPClient()
  } else {
    console.log('Using Socket.IO client for development')
    return new SocketIOClient()
  }
}