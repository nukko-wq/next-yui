'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { ChatResponse, SessionStatus } from '@/lib/config'
import { createChatClient } from '@/lib/chat-client'
import TypewriterText from './TypewriterText'

interface Message {
  id: string
  type: 'user' | 'bot' | 'system'
  content: string
  timestamp: Date
  processing?: boolean
  isTyping?: boolean
}

export default function YuiChat() {
  const [chatClient] = useState(() => createChatClient())
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId, setSessionId] = useState<string>('')
  const [uptime, setUptime] = useState('00:00:00')
  const [startTime] = useState(Date.now())
  const [avatarState, setAvatarState] = useState<'closed' | 'open'>('closed')

  const chatDisplayRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const lipSyncTimerRef = useRef<NodeJS.Timeout | null>(null)

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message])
  }, [])

  // 口パク演出開始
  const startLipSync = useCallback(() => {
    if (lipSyncTimerRef.current) {
      clearInterval(lipSyncTimerRef.current)
    }
    
    let isOpen = false
    lipSyncTimerRef.current = setInterval(() => {
      setAvatarState(isOpen ? 'closed' : 'open')
      isOpen = !isOpen
    }, 150)
  }, [])

  // 口パク演出停止
  const stopLipSync = useCallback(() => {
    if (lipSyncTimerRef.current) {
      clearInterval(lipSyncTimerRef.current)
      lipSyncTimerRef.current = null
    }
    setAvatarState('closed')
  }, [])

  // Uptime計算
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const hours = Math.floor(elapsed / 3600)
      const minutes = Math.floor((elapsed % 3600) / 60)
      const seconds = elapsed % 60
      setUptime(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime])

  // Chat Client接続
  useEffect(() => {
    const initializeClient = async () => {
      await chatClient.connect()
      setIsConnected(chatClient.isConnected())
    }

    chatClient.onStatusChange((data: SessionStatus) => {
      setSessionId(data.sessionId)
      setIsConnected(true)
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: data.message,
        timestamp: new Date(),
      })
    })

    chatClient.onResponse((data: ChatResponse) => {
      // 通常のレスポンスの場合（ストリーミング無効）
      const messageId = `bot-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      setMessages((prev) => [
        ...prev,
        {
          id: messageId,
          type: 'bot',
          content: data.response,
          timestamp: new Date(),
          isTyping: true, // タイプライター効果を有効に
        },
      ])
    })

    initializeClient()

    return () => {
      chatClient.disconnect()
    }
  }, [addMessage, chatClient])

  // メッセージ追加時に自動スクロール
  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight
    }
  })

  // コンポーネントのクリーンアップ時に口パクタイマーをクリア
  useEffect(() => {
    return () => {
      if (lipSyncTimerRef.current) {
        clearInterval(lipSyncTimerRef.current)
      }
    }
  }, [])

  const sendMessage = async () => {
    if (!isConnected || !inputMessage.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    addMessage(userMessage)
    setInputMessage('')
    
    // メッセージをクリアした後、先にフォーカスを設定
    setTimeout(() => {
      if (messageInputRef.current) {
        messageInputRef.current.focus()
      }
    }, 50)
    
    await chatClient.sendMessage(userMessage.content)
  }

  const clearSession = async () => {
    if (!isConnected) return
    await chatClient.clearSession()
    setMessages([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else if (e.ctrlKey && e.key === 'k') {
      e.preventDefault()
      clearSession()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col pb-8">
      {/* ヘッダー */}
      <header className="border-b border-green-400/30 p-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-green-300">&gt;</span>
            <span className="text-green-300">SYSTEM:</span>
            <span className="text-green-400 font-bold">
              YUI (結) - AI Partner Online
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-300">&gt;</span>
            <span className="text-green-300">YUI Partner</span>
            <span
              className={`font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}
            >
              {isConnected ? 'Ready' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="flex-1 flex gap-4 p-4 max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-200px)]">
        {/* チャットエリア */}
        <main className="flex-1 flex flex-col md:mr-0">
          {/* チャット表示 */}
          <div
            ref={chatDisplayRef}
            className="border border-green-400/30 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-black h-[calc(100vh-300px)] md:h-[calc(100vh-350px)] min-h-[300px] relative"
          >
            {messages.length === 0 ? (
              <div className="text-center space-y-2 text-green-400/70">
                <div className="text-lg font-bold">YUI CHAT TERMINAL</div>
                <div>YUI (結) 起動中...</div>
                <div>あなたのAIパートナーが待ってます♪</div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs text-green-400/60">
                      <span>[{formatTime(message.timestamp)}]</span>
                      <span>
                        {message.type === 'user'
                          ? 'USER'
                          : message.type === 'system'
                            ? 'SYSTEM'
                            : 'YUI'}
                      </span>
                    </div>
                    <div
                      className={`
                      ${
                        message.type === 'user'
                          ? 'text-blue-400'
                          : message.type === 'system'
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }
                      ${message.processing ? 'animate-pulse' : ''}
                      pl-4 border-l-2 
                      ${
                        message.type === 'user'
                          ? 'border-blue-400/30'
                          : message.type === 'system'
                            ? 'border-yellow-400/30'
                            : 'border-green-400/30'
                      }
                    `}
                    >
                      {message.type === 'bot' && message.isTyping ? (
                        // タイプライター効果
                        <TypewriterText
                          key={`typewriter-${message.id}`}
                          text={message.content}
                          delay={50}
                          enableSound={true}
                          onStart={() => {
                            console.log('Typewriter started for message:', message.id)
                            startLipSync()
                          }}
                          onComplete={() => {
                            console.log('Typewriter completed for message:', message.id)
                            stopLipSync()
                            setMessages((prev) =>
                              prev.map((msg) =>
                                msg.id === message.id
                                  ? { ...msg, isTyping: false }
                                  : msg
                              )
                            )
                            
                            setTimeout(() => {
                              if (messageInputRef.current && !messageInputRef.current.disabled) {
                                messageInputRef.current.focus()
                              }
                            }, 200)
                          }}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* モバイル用フローティングアバター */}
            <div className="md:hidden fixed top-20 right-4 z-10">
              <div className="w-20 h-20 border border-green-400/30 bg-black rounded-sm overflow-hidden">
                <Image
                  src={
                    avatarState === 'open'
                      ? '/yui_mouth_open.webp'
                      : '/yui_mouth_closed.webp'
                  }
                  alt="YUI Avatar"
                  className="w-full h-full object-cover"
                  width={80}
                  height={80}
                />
              </div>
            </div>
          </div>

          {/* 入力エリア */}
          <div className="mt-6 mb-6 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-300">&gt;</span>
              <input
                ref={messageInputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="メッセージを入力してください..."
                disabled={!isConnected}
                className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-400/50"
                maxLength={10000}
              />
            </div>

            {/* コントロール */}
            <div className="flex justify-between items-center text-xs text-green-400/60">
              <div className="flex items-center space-x-4">
                <span>
                  <span className="text-green-300">ENTER</span> = Send
                </span>
                <span>
                  <span className="text-green-300">CTRL+K</span> = Clear
                </span>
              </div>
              <div>{inputMessage.length} / 10000</div>
            </div>
          </div>
        </main>

        {/* デスクトップ用サイドバー */}
        <aside className="hidden md:block w-96 space-y-4">
          {/* アバター */}
          <div className="border border-green-400/30 p-6">
            <div className="text-center space-y-4">
              <div className="text-green-300 font-bold text-lg">YUI (結)</div>
              <div className="relative mx-auto w-72 h-72 border border-green-400/30 bg-green-400/5">
                <Image
                  src={
                    avatarState === 'open'
                      ? '/yui_mouth_open.webp'
                      : '/yui_mouth_closed.webp'
                  }
                  alt="YUI Avatar"
                  className="w-full h-full object-cover rounded-sm"
                  width={288}
                  height={288}
                />
              </div>
            </div>
          </div>

          {/* 接続状態 */}
          <div className="border border-green-400/30 p-4">
            <div className="text-green-300 font-bold mb-2">CONNECTION</div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
              />
              <span className="text-sm">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* システム情報 */}
          <div className="border border-green-400/30 p-4">
            <div className="text-green-300 font-bold mb-2">SYSTEM INFO</div>
            <div className="text-xs space-y-1 text-green-400/60">
              <div>Protocol: HTTPS/WSS</div>
              <div>
                Status: <span className="text-green-400">Active</span>
              </div>
              <div>
                Uptime: <span className="text-green-400">{uptime}</span>
              </div>
              {sessionId && (
                <div>
                  Session:{' '}
                  <span className="text-green-400 text-[10px]">
                    {sessionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
