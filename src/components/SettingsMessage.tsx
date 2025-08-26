'use client'

import { useCallback, useEffect, useState } from 'react'
import { loadSettings, saveSettings, type SettingsState } from '@/lib/settings'

interface SettingsMessageProps {
  messageId: string
  onSettingsChange: (settings: SettingsState) => void
  onClose: () => void
  messageInputRef?: React.RefObject<HTMLInputElement>
}

export default function SettingsMessage({ 
  messageId, 
  onSettingsChange, 
  onClose,
  messageInputRef
}: SettingsMessageProps) {
  const [settings, setSettings] = useState(() => loadSettings())
  const [isActive, setIsActive] = useState(true)

  const toggleSound = useCallback(() => {
    const newSettings = { ...settings, soundEnabled: !settings.soundEnabled }
    setSettings(newSettings)
    saveSettings(newSettings)
    onSettingsChange(newSettings)
  }, [settings, onSettingsChange])

  const handleClose = useCallback(() => {
    setIsActive(false)
    onClose()
    
    // 設定画面を閉じた後、入力フォームにフォーカス
    setTimeout(() => {
      if (messageInputRef?.current) {
        messageInputRef.current.focus()
      }
    }, 100)
  }, [onClose, messageInputRef])

  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'Tab':
          e.preventDefault()
          toggleSound()
          break
        case 'Enter':
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, toggleSound, handleClose])

  if (!isActive) return null

  return (
    <div className="border border-green-400/30 rounded p-4 bg-black/50">
      <div className="text-center space-y-4">
        <div className="text-green-300 font-bold">⚙️ YUI SETTINGS</div>
        
        <div className="space-y-2">
          <div className="text-green-400">🔊 Sound Effects</div>
          <div className="flex justify-center space-x-4">
            <button
              className={`px-3 py-1 rounded ${
                settings.soundEnabled 
                  ? 'bg-green-400/20 text-green-400 border border-green-400/50' 
                  : 'text-green-400/50 border border-green-400/20'
              }`}
              onClick={toggleSound}
            >
              ◉ ON
            </button>
            <button
              className={`px-3 py-1 rounded ${
                !settings.soundEnabled 
                  ? 'bg-green-400/20 text-green-400 border border-green-400/50' 
                  : 'text-green-400/50 border border-green-400/20'
              }`}
              onClick={toggleSound}
            >
              ○ OFF
            </button>
          </div>
        </div>

        <div className="text-xs text-green-400/60">
          Space/Tab: Toggle • Enter/Esc: Close
        </div>
      </div>
    </div>
  )
}