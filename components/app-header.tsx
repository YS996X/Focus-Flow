"use client"

import { useState } from "react"
import { Music, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAudio } from "@/components/audio-provider"
import { SpotifyPlayer } from "@/components/spotify-player"

interface AppHeaderProps {
  showBackButton?: boolean
}

export function AppHeader({ showBackButton = true }: AppHeaderProps) {
  const { isAmbientPlaying, ambientSound } = useAudio()
  const [isSpotifyVisible, setIsSpotifyVisible] = useState(false)

  return (
    <>
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Link href="/home">
              <Button variant="ghost" size="sm">
                Back to Home
              </Button>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/ambient">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center gap-1 ${isAmbientPlaying ? "text-purple-400" : ""}`}
              title={isAmbientPlaying ? `Playing: ${ambientSound}` : "Ambient Sounds"}
            >
              <Volume2 size={16} />
              Ambient
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSpotifyVisible(!isSpotifyVisible)}
            className={`flex items-center gap-1 ${isSpotifyVisible ? "text-purple-400" : ""}`}
          >
            <Music size={16} />
            Music
          </Button>
        </div>
      </header>
      
      <SpotifyPlayer isVisible={isSpotifyVisible} onClose={() => setIsSpotifyVisible(false)} />
    </>
  )
} 