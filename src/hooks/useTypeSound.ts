'use client'

import { useCallback, useRef } from 'react'

export function useTypeSound() {
  const audioContextRef = useRef<AudioContext | null>(null)

  const createTypeSound = useCallback(() => {
    if (typeof window === 'undefined') return () => {}

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )()
      }

      const ctx = audioContextRef.current

      return function playBeep() {
        if (ctx.state === 'suspended') ctx.resume()

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.type = 'square'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        gain.gain.setValueAtTime(0.05, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)

        osc.start()
        osc.stop(ctx.currentTime + 0.05)
      }
    } catch (error) {
      console.warn('Audio context creation failed:', error)
      return () => {}
    }
  }, [])

  const playTypeSound = useCallback(() => {
    const soundPlayer = createTypeSound()
    soundPlayer()
  }, [createTypeSound])

  return { playTypeSound }
}
