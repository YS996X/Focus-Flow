"use client"

import { useState, useEffect } from "react"
import { CloudRain, Pause, Play, Volume1, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useRouter } from "next/navigation"
import { useAudio } from "@/components/audio-provider"
import { AppHeader } from "@/components/app-header"

// Define available ambient sounds
const ambientSounds = [
  { id: "rain", name: "Rain", icon: CloudRain },
  { 
    id: "forest", 
    name: "Forest", 
    icon: (props: any) => (
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
        {...props}
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
    )
  },
  { 
    id: "cafe", 
    name: "Café", 
    icon: (props: any) => (
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
        {...props}
      >
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" x2="6" y1="2" y2="4" />
        <line x1="10" x2="10" y1="2" y2="4" />
        <line x1="14" x2="14" y1="2" y2="4" />
      </svg>
    )
  },
  { 
    id: "waves", 
    name: "Waves", 
    icon: (props: any) => (
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
        {...props}
      >
        <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
      </svg>
    )
  },
  {
    id: "fireplace",
    name: "Fireplace",
    icon: (props: any) => (
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
        {...props}
      >
        <path d="M12 2v2M9 13v5a3 3 0 0 0 6 0v-5a3 3 0 0 0-6 0ZM9 8c0-1.7 1-3 3-3s3 1.3 3 3M8 2v2M16 2v2" />
      </svg>
    )
  },
  {
    id: "whitenoise",
    name: "White Noise",
    icon: (props: any) => (
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
        {...props}
      >
        <path d="M2 9C2 8 6 7 6 5c0-1.67 1-3 3-3 1.77 0 3 1 3 3 0 2-4 3-4 4" />
        <path d="M12 19c0-1 4-2 4-4 0-1.67 1-3 3-3 1.77 0 3 1 3 3 0 2-4 3-4 4" />
        <path d="M9 19c-.5-.5-1-1-1-2 0-1.78-1.75-2.66-3-3C3.14 13.28 2 12 2 10" />
        <path d="M22 10c-1-.5-2-1-2-2 0-1.78-1.75-2.66-3-3-1.86-.72-3-2-3-4" />
      </svg>
    )
  },
  {
    id: "birds",
    name: "Birds",
    icon: (props: any) => (
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
        {...props}
      >
        <path d="M16 7h.01" />
        <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
        <path d="m20 7 2 .5-2 .5" />
        <path d="M10 18v3" />
        <path d="M14 17.75V21" />
        <path d="M7 18a6 6 0 0 0 3.84-10.61" />
      </svg>
    )
  },
  {
    id: "thunder",
    name: "Thunder",
    icon: (props: any) => (
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
        {...props}
      >
        <path d="M8 2l-4 4h4v6H4l4 4" />
        <path d="M16 2l4 4h-4v6h4l-4 4" />
      </svg>
    )
  }
]

// Create a component wrapper for each sound button
const SoundButton = ({ 
  sound, 
  activeSound, 
  isAmbientPlaying, 
  onClick 
}: { 
  sound: { id: string; name: string; icon: any }; 
  activeSound: string | null; 
  isAmbientPlaying: boolean; 
  onClick: () => void;
}) => {
  const Icon = sound.icon;
  const isActive = activeSound === sound.id;
  const isPlaying = isActive && isAmbientPlaying;
  
  return (
    <Button
      key={sound.id}
      variant={isActive ? "default" : "outline"}
      className={`h-24 flex flex-col items-center justify-center gap-2 ${
        isPlaying ? "bg-purple-700 hover:bg-purple-800" : ""
      }`}
      onClick={onClick}
    >
      <Icon size={24} />
      <span>{sound.name}</span>
    </Button>
  );
};

export default function AmbientPage() {
  const router = useRouter()
  const { 
    ambientSound, 
    isAmbientPlaying, 
    volume, 
    playAmbientSound, 
    pauseAmbientSound, 
    resumeAmbientSound, 
    setAmbientVolume 
  } = useAudio()
  
  const [activeSound, setActiveSound] = useState<string | null>(ambientSound)

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"

    // Redirect to login if not logged in
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  // Set the active sound based on the audio context
  useEffect(() => {
    setActiveSound(ambientSound)
  }, [ambientSound])

  // Handle sound selection
  const handleSoundSelect = (soundId: string) => {
    setActiveSound(soundId)
    
    if (ambientSound === soundId && isAmbientPlaying) {
      pauseAmbientSound()
    } else if (ambientSound === soundId && !isAmbientPlaying) {
      resumeAmbientSound()
    } else {
      playAmbientSound(soundId)
    }
  }

  // Handle play/pause button
  const togglePlay = () => {
    if (!activeSound) return
    
    if (isAmbientPlaying) {
      pauseAmbientSound()
    } else if (ambientSound === activeSound) {
      resumeAmbientSound()
    } else {
      playAmbientSound(activeSound)
    }
  }

  // Handle volume change
  const handleVolumeChange = (newVolume: number[]) => {
    setAmbientVolume(newVolume[0])
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <AppHeader />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <CloudRain size={24} />
          <h1 className="text-2xl font-bold">Ambient Sounds</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {ambientSounds.map((sound) => (
            <SoundButton
              key={sound.id}
              sound={sound}
              activeSound={activeSound}
              isAmbientPlaying={isAmbientPlaying}
              onClick={() => handleSoundSelect(sound.id)}
            />
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-medium mb-2 flex items-center gap-2">
            {volume < 50 ? <Volume1 size={18} /> : <Volume2 size={18} />}
            Volume
          </h2>
          <Slider value={[volume]} onValueChange={handleVolumeChange} max={100} step={1} className="mb-2" />
          <div className="text-right text-sm text-gray-400">{volume}%</div>
        </div>

        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="lg" 
            className={`min-w-[150px] ${isAmbientPlaying ? "bg-purple-700 hover:bg-purple-800 text-white" : ""}`} 
            onClick={togglePlay}
            disabled={!activeSound}
          >
            {isAmbientPlaying ? (
              <>
                <Pause size={18} className="mr-2" /> Pause
              </>
            ) : (
              <>
                <Play size={18} className="mr-2" /> Play
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
