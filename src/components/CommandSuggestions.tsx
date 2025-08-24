'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import type { SlashCommand, CommandSuggestion } from '@/lib/commands/types'

interface CommandSuggestionsProps {
  suggestions: CommandSuggestion[]
  visible: boolean
  inputElement: HTMLInputElement | null
  onSelect: (command: SlashCommand) => void
  onComplete: (commandName: string) => void
}

export default function CommandSuggestions({
  suggestions,
  visible,
  inputElement,
  onSelect,
  onComplete
}: CommandSuggestionsProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  
  // input要素の位置を計算してサジェストを配置
  useEffect(() => {
    if (inputElement && visible) {
      const rect = inputElement.getBoundingClientRect()
      setPosition({
        x: rect.left,
        y: rect.bottom + 4
      })
    }
  }, [inputElement, visible, suggestions])

  if (!visible || suggestions.length === 0) return null

  return createPortal(
    <div 
      className="fixed z-50 bg-black border border-green-400/30 rounded shadow-lg max-h-60 overflow-y-auto font-mono"
      style={{ 
        left: position.x, 
        top: position.y,
        minWidth: '320px'
      }}
    >
      {suggestions.slice(0, 10).map((suggestion, index) => (
        <div
          key={suggestion.command.name}
          className={`
            px-3 py-2 cursor-pointer border-b border-green-400/20 last:border-b-0
            ${index === 0 ? 'bg-green-400/20 text-green-300' : 'text-green-400 hover:bg-green-400/10'}
            transition-colors duration-150
          `}
          onClick={() => onSelect(suggestion.command)}
        >
          <div className="flex items-start gap-2">
            <span className="font-mono text-sm">
              /{suggestion.command.name}
            </span>
          </div>
          <div className="text-green-400/70 text-xs mt-1">
            {suggestion.command.description}
          </div>
        </div>
      ))}
    </div>,
    document.body
  )
}