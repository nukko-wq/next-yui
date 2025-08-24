'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { createChatClient } from '@/lib/chat-client'
import type { ChatResponse, SessionStatus } from '@/lib/config'
import { createCommandManager } from '@/lib/commands'
import type { ChatContext, CommandSuggestion } from '@/lib/commands'
import TypewriterText from './TypewriterText'
import CommandSuggestions from './CommandSuggestions'

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
  const commandManager = useMemo(() => createCommandManager(), [])
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId, setSessionId] = useState<string>('')
  const [uptime, setUptime] = useState('00:00:00')
  const [startTime] = useState(Date.now())
  const [avatarState, setAvatarState] = useState<'closed' | 'open'>('closed')
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [isBotTyping, setIsBotTyping] = useState(false)
  const [commandSuggestions, setCommandSuggestions] = useState<CommandSuggestion[]>([])
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false)

  const chatDisplayRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLInputElement>(null)
  const lipSyncTimerRef = useRef<NodeJS.Timeout | null>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message])
    // 新しいメッセージが追加されたらスクロールする
    setTimeout(() => {
      if (!isUserScrolling && chatDisplayRef.current) {
        chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight
      }
    }, 0)
  }, [isUserScrolling])

  // ユーザーがスクロールしているかチェック
  const isNearBottom = useCallback(() => {
    if (!chatDisplayRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = chatDisplayRef.current
    // 下端から100px以内にいればtrueを返す
    return scrollHeight - scrollTop - clientHeight < 100
  }, [])

  // ユーザーが大きく上にスクロールしているかチェック（AI応答中の例外判定用）
  const isFarFromBottom = useCallback(() => {
    if (!chatDisplayRef.current) return false
    const { scrollTop, scrollHeight, clientHeight } = chatDisplayRef.current
    // 下端から200px以上離れている場合はtrue
    return scrollHeight - scrollTop - clientHeight > 200
  }, [])

  // AI応答中の自動スクロール（タイプライター効果中）
  const scrollDuringBotTyping = useCallback(() => {
    if (!chatDisplayRef.current) return
    
    // AI応答中は、ユーザーが大きく上にスクロールしていない限り自動スクロール
    if (isBotTyping && !isFarFromBottom()) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight
    }
  }, [isBotTyping, isFarFromBottom])


  // ユーザーのスクロール操作を検知
  const handleScroll = useCallback(() => {
    // AI応答中は異なるスクロール制御ロジックを使用
    if (isBotTyping) {
      // AI応答中：大きく上にスクロールした場合のみ、自動スクロールを一時的に停止
      // （isFarFromBottomで判定済み、特別な処理は不要）
      return
    }

    // 通常時のスクロール制御
    if (!isNearBottom()) {
      setIsUserScrolling(true)
    } else {
      setIsUserScrolling(false)
    }

    // スクロール操作が止まったら一定時間後にスクロールフラグをリセット
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (isNearBottom()) {
        setIsUserScrolling(false)
      }
    }, 1000)
  }, [isNearBottom, isBotTyping])

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

  // 初回レンダリング時に下までスクロール
  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight
    }
  }, [])

  // コンポーネントのクリーンアップ時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (lipSyncTimerRef.current) {
        clearInterval(lipSyncTimerRef.current)
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const clearSession = useCallback(async () => {
    if (!isConnected) return
    await chatClient.clearSession()
    setMessages([])
  }, [isConnected, chatClient])

  // ChatContext を作成
  const createChatContext = useCallback((): ChatContext => ({
    clearSession: clearSession,
    addMessage: addMessage,
    setMessages: setMessages,
    setInputMessage: setInputMessage,
    sessionId: sessionId,
    isConnected: isConnected
  }), [clearSession, addMessage, sessionId, isConnected])

  // 入力変更時のフィルタリング
  const handleInputChange = useCallback((value: string) => {
    setInputMessage(value)
    
    if (value.startsWith('/') && value.length > 1) {
      // "/"以降の文字でフィルタリング
      const query = value.slice(1).toLowerCase()
      const filtered = commandManager.getSuggestions(value)
        .sort((a, b) => a.command.name.localeCompare(b.command.name))
      
      setCommandSuggestions(filtered)
      setShowCommandSuggestions(filtered.length > 0)
    } else if (value === '/') {
      // "/" だけの場合は全コマンドを表示
      const allCommands = commandManager.getAllCommands()
        .filter(cmd => !cmd.hidden)
        .map(cmd => ({ command: cmd, highlight: cmd.name, description: cmd.description }))
        .sort((a, b) => a.command.name.localeCompare(b.command.name))
      
      setCommandSuggestions(allCommands)
      setShowCommandSuggestions(true)
    } else {
      setShowCommandSuggestions(false)
    }
  }, [commandManager])

  const sendMessage = async () => {
    if (!isConnected || !inputMessage.trim()) return

    const message = inputMessage.trim()

    // スラッシュコマンドかどうかチェック
    if (commandManager.isCommand(message)) {
      const context = createChatContext()
      const executed = await commandManager.execute(message, context)
      
      if (executed) {
        setInputMessage('')
        setShowCommandSuggestions(false)
        return
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
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

  // コマンド実行
  const executeCommand = useCallback(async (command: any) => {
    const context = createChatContext()
    try {
      await command.execute([], context)
    } catch (error) {
      context.addMessage({
        id: Date.now().toString(),
        type: 'system',
        content: `❌ コマンド実行エラー: ${String(error)}`,
        timestamp: new Date()
      })
    }
    
    setInputMessage('')
    setShowCommandSuggestions(false)
  }, [createChatContext])

  // キーボード操作
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommandSuggestions && commandSuggestions.length > 0) {
      switch (e.key) {
        case 'Tab':
          e.preventDefault()
          // 一番上のコマンドを補完
          const topCommand = commandSuggestions[0]?.command
          if (topCommand) {
            setInputMessage(`/${topCommand.name} `)
            setShowCommandSuggestions(false)
          }
          break
          
        case 'Enter':
          e.preventDefault()
          // 一番上のコマンドを実行
          const selectedCommand = commandSuggestions[0]?.command
          if (selectedCommand) {
            executeCommand(selectedCommand)
          }
          break
          
        case 'Escape':
          setShowCommandSuggestions(false)
          break
      }
      return
    }
    
    // 既存のEnterキー処理
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    } else if (e.ctrlKey && e.key === 'k') {
      e.preventDefault()
      clearSession()
    }
  }, [showCommandSuggestions, commandSuggestions, executeCommand, sendMessage, clearSession])

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
            onScroll={handleScroll}
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
                            console.log(
                              'Typewriter started for message:',
                              message.id,
                            )
                            setIsBotTyping(true)
                            startLipSync()
                          }}
                          onTextChange={() => {
                            // AI応答中の自動スクロール
                            scrollDuringBotTyping()
                          }}
                          onComplete={() => {
                            console.log(
                              'Typewriter completed for message:',
                              message.id,
                            )
                            setIsBotTyping(false)
                            stopLipSync()
                            setMessages((prev) =>
                              prev.map((msg) =>
                                msg.id === message.id
                                  ? { ...msg, isTyping: false }
                                  : msg,
                              ),
                            )

                            setTimeout(() => {
                              if (
                                messageInputRef.current &&
                                !messageInputRef.current.disabled
                              ) {
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
          <div className="mt-6 mb-6 relative">
            <div className="flex items-center space-x-2">
              <span className="text-green-300">&gt;</span>
              <input
                ref={messageInputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="メッセージを入力してください..."
                disabled={!isConnected}
                className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-400/50"
              />
            </div>
            
            {/* ヒントまたはコマンドサジェスト */}
            {!showCommandSuggestions && (
              <div className="text-xs text-green-400/60 mt-1 ml-4">
                / for commands
              </div>
            )}
            
            {/* コマンドサジェスト */}
            <CommandSuggestions
              suggestions={commandSuggestions}
              visible={showCommandSuggestions}
              inputElement={messageInputRef.current}
              onSelect={(command) => executeCommand(command)}
              onComplete={(commandName) => {
                setInputMessage(`/${commandName} `)
                setShowCommandSuggestions(false)
              }}
            />
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
