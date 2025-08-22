'use client'

import { useTypewriter } from '@/hooks/useTypewriter'

interface TypewriterTextProps {
  text: string
  delay?: number
  onComplete?: () => void
  className?: string
}

export default function TypewriterText({ 
  text, 
  delay = 30, 
  onComplete,
  className = '' 
}: TypewriterTextProps) {
  const { displayedText, isTyping } = useTypewriter(text, { delay, onComplete })

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="animate-pulse text-green-400 ml-1">●</span>
      )}
    </span>
  )
}