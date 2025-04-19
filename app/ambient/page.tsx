"use client"

import { useState, useEffect } from "react"
import { CloudRain, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SpotifyPlayer } from "@/components/spotify-player"

export default function AmbientPage() {
  const router = useRouter()

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"

    // Redirect to login if not logged in
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  const [volume, setVolume] = useState(70)
  const [activeSound, setActiveSound] = useState("rain")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpotifyVisible, setIsSpotifyVisible] = useState(false)

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/home" className="text-2xl font-bold tracking-tight">
            FOCUS FLOW
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSpotifyVisible(!isSpotifyVisible)}
            className={`flex items-center gap-1 ${isSpotifyVisible ? "text-purple-400" : ""}`}
          >
            <Music size={16} />
            Music
          </Button>
          <Link href="/home">
            <Button variant="ghost" size="sm">
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <CloudRain size={24} />
          <h1 className="text-2xl font-bold">Ambient Sounds</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            variant={activeSound === "rain" ? "default" : "outline"}
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setActiveSound("rain")}
          >
            <CloudRain size={24} />
            <span>Rain</span>
          </Button>
          <Button
            variant={activeSound === "forest" ? "default" : "outline"}
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setActiveSound("forest")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-trees"
            >
              <path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
              <path d="M7 16v6" />
              <path d="M13 19v3" />
              <path d="M12 13v.2a3 3 0 0 0 1.1 5.8H17v0h0a3 3 0 0 0 1-5.8V13a3 3 0 0 0-6 0Z" />
              <path d="M13 13v-3" />
              <path d="M7 10V7" />
              <path d="M7 7H4" />
              <path d="M7 7h3" />
            </svg>
            <span>Forest</span>
          </Button>
          <Button
            variant={activeSound === "cafe" ? "default" : "outline"}
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setActiveSound("cafe")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-coffee"
            >
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" x2="6" y1="2" y2="4" />
              <line x1="10" x2="10" y1="2" y2="4" />
              <line x1="14" x2="14" y1="2" y2="4" />
            </svg>
            <span>Café</span>
          </Button>
          <Button
            variant={activeSound === "waves" ? "default" : "outline"}
            className="h-24 flex flex-col items-center justify-center gap-2"
            onClick={() => setActiveSound("waves")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-wave"
            >
              <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            </svg>
            <span>Waves</span>
          </Button>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-medium mb-2">Volume</h2>
          <Slider value={[volume]} onValueChange={(value) => setVolume(value[0])} max={100} step={1} className="mb-2" />
          <div className="text-right text-sm text-gray-400">{volume}%</div>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" size="lg" className="min-w-[150px]" onClick={togglePlay}>
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </div>
      </main>

      <SpotifyPlayer isVisible={isSpotifyVisible} onClose={() => setIsSpotifyVisible(false)} />
    </div>
  )
}
