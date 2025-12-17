'use client'
import React, { useRef } from 'react'

function UseSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const play = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/sounds/snap.mp3")
      audioRef.current.volume = 0.6
    }
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }

  return play
}

export default UseSound
