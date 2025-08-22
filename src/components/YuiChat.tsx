'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import type { ChatResponse, SessionStatus } from '@/lib/config'
import { createChatClient } from '@/lib/chat-client'
import AuthStatus from './AuthStatus'
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
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [uptime, setUptime] = useState('00:00:00')
  const [startTime] = useState(Date.now())
  const [avatarState, setAvatarState] = useState<'closed' | 'open'>('closed')

  const chatDisplayRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message])
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
      if (data.processing) {
        // 処理中メッセージの場合
        setMessages((prev) => {
          const updated = [...prev]
          const lastMessage = updated[updated.length - 1]
          if (lastMessage?.processing) {
            return updated // 既に処理中メッセージがある場合は更新しない
          }
          return [
            ...updated,
            {
              id: Date.now().toString(),
              type: 'bot',
              content: data.response,
              timestamp: new Date(),
              processing: true,
            },
          ]
        })
        setIsTyping(true)
        setAvatarState('open')
      } else {
        // 最終レスポンスの場合
        setMessages((prev) => {
          const updated = prev.filter((msg) => !msg.processing) // 処理中メッセージを削除
          return [
            ...updated,
            {
              id: Date.now().toString(),
              type: 'bot',
              content: data.response,
              timestamp: new Date(),
              isTyping: true, // タイプライター効果を有効にする
            },
          ]
        })
        setIsTyping(false)
        // アバターの状態はタイプライター完了時に変更
      }
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

  const sendMessage = async () => {
    if (!isConnected || !inputMessage.trim() || isTyping) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    }

    addMessage(userMessage)
    await chatClient.sendMessage(inputMessage.trim())
    setInputMessage('')
    setIsTyping(true)
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
    <div className="min-h-screen bg-black text-green-400 font-mono flex flex-col">
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
      <div className="flex-1 flex gap-4 p-4">
        {/* チャットエリア */}
        <main className="flex-1 flex flex-col">
          {/* チャット表示 */}
          <div
            ref={chatDisplayRef}
            className="flex-1 border border-green-400/30 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-green-400/30 scrollbar-track-black"
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
                        <TypewriterText
                          key={`typewriter-${message.id}`}
                          text={message.content}
                          delay={50}
                          onComplete={() => {
                            console.log('Typewriter completed for message:', message.id)
                            setAvatarState('closed')
                            // メッセージのタイプライター状態を終了
                            setMessages((prev) =>
                              prev.map((msg) =>
                                msg.id === message.id
                                  ? { ...msg, isTyping: false }
                                  : msg
                              )
                            )
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
          </div>

          {/* 入力エリア */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-green-300">&gt;</span>
              <input
                ref={messageInputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="メッセージを入力してください..."
                disabled={!isConnected || isTyping}
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

        {/* サイドバー */}
        <aside className="w-80 space-y-4">
          {/* アバター */}
          <div className="border border-green-400/30 p-4">
            <div className="text-center space-y-2">
              <div className="text-green-300 font-bold">YUI (結)</div>
              <div className="relative mx-auto w-32 h-32 border border-green-400/30">
                <Image
                  src={
                    avatarState === 'open'
                      ? '/yui_mouth_open.webp'
                      : '/yui_mouth_closed.webp'
                  }
                  alt="YUI Avatar"
                  className="w-full h-full object-cover"
                  width={128}
                  height={128}
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

          {/* 認証状態 */}
          <div className="border border-green-400/30 p-4">
            <div className="text-green-300 font-bold mb-2">認証状態</div>
            <AuthStatus />
          </div>

          {/* システム情報 */}
          <div className="border border-green-400/30 p-4">
            <div className="text-green-300 font-bold mb-2">SYSTEM INFO</div>
            <div className="text-xs space-y-1 text-green-400/60">
              <div>Protocol: WebSocket</div>
              <div>Port: 3000</div>
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
