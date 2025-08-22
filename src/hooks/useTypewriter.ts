'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTypeSound } from './useTypeSound'

interface UseTypewriterOptions {
  delay?: number
  onComplete?: () => void
  enableSound?: boolean
}

export function useTypewriter(text: string, options: UseTypewriterOptions = {}) {
  const { delay = 30, onComplete, enableSound = false } = options
  const { playTypeSound } = useTypeSound()
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const indexRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const currentTextRef = useRef('')

  // onCompleteコールバックの参照を安定化
  onCompleteRef.current = onComplete

  useEffect(() => {
    console.log('useTypewriter useEffect triggered with text:', text)
    
    // テキストが空の場合
    if (!text) {
      setDisplayedText('')
      setIsTyping(false)
      completedRef.current = false
      currentTextRef.current = ''
      return
    }

    // 同じテキストが既に完了している場合はスキップ
    if (completedRef.current && currentTextRef.current === text) {
      console.log('Already completed for this text, skipping')
      return
    }

    // 前のタイマーをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 初期化
    console.log('Starting typewriter animation for:', text)
    setDisplayedText('')
    setIsTyping(true)
    indexRef.current = 0
    completedRef.current = false
    currentTextRef.current = text

    // タイプライター効果
    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        const newText = text.slice(0, indexRef.current + 1)
        console.log('Typing character:', indexRef.current, newText)
        setDisplayedText(newText)
        
        // 音声再生（有効な場合のみ）
        if (enableSound) {
          playTypeSound()
        }
        
        indexRef.current++
        timeoutRef.current = setTimeout(typeNextChar, delay)
      } else {
        console.log('Typewriter animation completed')
        setIsTyping(false)
        completedRef.current = true
        onCompleteRef.current?.()
      }
    }

    // アニメーション開始
    typeNextChar()

    // クリーンアップ
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [text, delay])

  return {
    displayedText,
    isTyping,
  }
}