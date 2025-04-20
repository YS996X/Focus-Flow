"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Define the shape of our context
type AudioContextType = {
  ambientSound: string | null
  isAmbientPlaying: boolean
  volume: number
  playAmbientSound: (sound: string) => void
  pauseAmbientSound: () => void
  resumeAmbientSound: () => void
  setAmbientVolume: (value: number) => void
  stopAmbientSound: () => void
}

// Create the context with a default value
const AudioContext = createContext<AudioContextType>({
  ambientSound: null,
  isAmbientPlaying: false,
  volume: 70,
  playAmbientSound: () => {},
  pauseAmbientSound: () => {},
  resumeAmbientSound: () => {},
  setAmbientVolume: () => {},
  stopAmbientSound: () => {},
})

// Hook for components to consume the audio context
export const useAudio = () => useContext(AudioContext)

interface AudioProviderProps {
  children: ReactNode
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [ambientSound, setAmbientSound] = useState<string | null>(null)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false)
  const [volume, setVolume] = useState(70)

  // Initialize audio element when component mounts
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = new Audio()
      audio.loop = true
      setAudioElement(audio)
      
      // Cleanup when component unmounts
      return () => {
        audio.pause()
        audio.src = ""
      }
    }
  }, [])

  // Update volume when it changes
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume / 100
    }
  }, [volume, audioElement])

  // Play a new ambient sound
  const playAmbientSound = (sound: string) => {
    if (!audioElement) return
    
    // Stop current sound if playing
    audioElement.pause()
    
    // Set new sound
    const soundPath = `/ambient-sounds/${sound}.mp3`
    audioElement.src = soundPath
    audioElement.load()
    audioElement.play().catch(error => {
      console.error("Error playing ambient sound:", error)
    })
    
    setAmbientSound(sound)
    setIsAmbientPlaying(true)
  }

  // Pause the current ambient sound
  const pauseAmbientSound = () => {
    if (audioElement && isAmbientPlaying) {
      audioElement.pause()
      setIsAmbientPlaying(false)
    }
  }

  // Resume the current ambient sound
  const resumeAmbientSound = () => {
    if (audioElement && !isAmbientPlaying && ambientSound) {
      audioElement.play().catch(error => {
        console.error("Error resuming ambient sound:", error)
      })
      setIsAmbientPlaying(true)
    }
  }

  // Stop and clear the current ambient sound
  const stopAmbientSound = () => {
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
      audioElement.src = ""
      setAmbientSound(null)
      setIsAmbientPlaying(false)
    }
  }

  // Set the volume for ambient sounds
  const setAmbientVolume = (value: number) => {
    setVolume(value)
  }

  // Context value
  const value = {
    ambientSound,
    isAmbientPlaying,
    volume,
    playAmbientSound,
    pauseAmbientSound,
    resumeAmbientSound,
    setAmbientVolume,
    stopAmbientSound,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
} 