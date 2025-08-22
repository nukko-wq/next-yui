'use client'

import { useTypewriter } from '@/hooks/useTypewriter'

interface TypewriterTextProps {
  text: string
  delay?: number
  onComplete?: () => void
  onStart?: () => void
  className?: string
  enableSound?: boolean
}

export default function TypewriterText({ 
  text, 
  delay = 30, 
  onComplete,
  onStart,
  className = '',
  enableSound = false
}: TypewriterTextProps) {
  const { displayedText, isTyping } = useTypewriter(text, { delay, onComplete, onStart, enableSound })

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="animate-pulse text-green-400 ml-1">●</span>
      )}
    </span>
  )
}