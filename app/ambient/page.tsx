"use client"

import { useState, useEffect } from "react"
import { CloudRain, Pause, Play, Volume1, Volume2, TreePine, Cloud, Coffee, Brain, Headphones, Volume } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { cn } from "@/lib/utils"
import WallpaperProvider from "@/components/wallpaper-provider"

interface Sound {
  id: string;
  name: string;
  url: string;
  category: 'nature' | 'weather' | 'ambient';
}

const natureSounds: Sound[] = [
  { id: 'forest', name: 'Forest', url: '/sounds/forest.mp3', category: 'nature' },
  { id: 'ocean', name: 'Ocean', url: '/sounds/ocean.mp3', category: 'nature' },
  { id: 'birds', name: 'Birds', url: '/sounds/birds.mp3', category: 'nature' },
  { id: 'stream', name: 'Stream', url: '/sounds/stream.mp3', category: 'nature' },
];

const weatherSounds: Sound[] = [
  { id: 'rain', name: 'Rain', url: '/sounds/rain.mp3', category: 'weather' },
  { id: 'thunder', name: 'Thunder', url: '/sounds/thunder.mp3', category: 'weather' },
  { id: 'wind', name: 'Wind', url: '/sounds/wind.mp3', category: 'weather' },
  { id: 'storm', name: 'Storm', url: '/sounds/storm.mp3', category: 'weather' },
];

const ambientSounds: Sound[] = [
  { id: 'cafe', name: 'Café', url: '/sounds/cafe.mp3', category: 'ambient' },
  { id: 'fireplace', name: 'Fireplace', url: '/sounds/fireplace.mp3', category: 'ambient' },
  { id: 'whitenoise', name: 'White Noise', url: '/sounds/whitenoise.mp3', category: 'ambient' },
  { id: 'keyboard', name: 'Keyboard', url: '/sounds/keyboard.mp3', category: 'ambient' },
];

export default function AmbientPage() {
  const router = useRouter();
  const [volume, setVolume] = useState(50);
  const [activeSound, setActiveSound] = useState<Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const toggleSound = (sound: Sound) => {
    if (activeSound?.id === sound.id) {
      setActiveSound(null);
      setIsPlaying(false);
      audio?.pause();
      audio?.remove();
      setAudio(null);
    } else {
      setActiveSound(sound);
      setIsPlaying(true);
      audio?.pause();
      audio?.remove();
      const newAudio = new Audio(sound.url);
      newAudio.volume = volume / 100;
      newAudio.loop = true;
      newAudio.play();
      setAudio(newAudio);
    }
  };

  // Update volume
  useEffect(() => {
    if (audio) {
      audio.volume = volume / 100;
    }
  }, [volume, audio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.remove();
      }
    };
  }, [audio]);

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <WallpaperProvider />
      <AppHeader />

      <main className="flex-1 px-8 py-8 relative overflow-hidden">
        {/* Background overlays - matching home page style */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1526]/80 via-[#0a1526]/70 to-[#0a1526]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-radial from-[#995c1d]/10 via-transparent to-transparent opacity-40" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_30px_rgba(0,0,0,0.8)] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 size={24} className="text-purple-400" />
              <h1 className="text-2xl font-semibold">Ambient Sounds</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Volume: {volume}%
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-32 accent-purple-500"
              />
            </div>
          </div>

          {/* Sound Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Nature Sounds */}
            <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TreePine size={20} className="text-purple-400" />
                Nature
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {natureSounds.map((sound) => (
                  <Button
                    key={sound.id}
                    variant="outline"
                    className={cn(
                      "bg-[#232323]/50 border-white/5 hover:bg-white/5 h-auto py-3",
                      activeSound?.id === sound.id && "border-purple-500/50 bg-purple-600/20"
                    )}
                    onClick={() => toggleSound(sound)}
                  >
                    <div className="flex items-center gap-2">
                      {activeSound?.id === sound.id ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                      <span>{sound.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Weather Sounds */}
            <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Cloud size={20} className="text-purple-400" />
                Weather
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {weatherSounds.map((sound) => (
                  <Button
                    key={sound.id}
                    variant="outline"
                    className={cn(
                      "bg-[#232323]/50 border-white/5 hover:bg-white/5 h-auto py-3",
                      activeSound?.id === sound.id && "border-purple-500/50 bg-purple-600/20"
                    )}
                    onClick={() => toggleSound(sound)}
                  >
                    <div className="flex items-center gap-2">
                      {activeSound?.id === sound.id ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                      <span>{sound.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Ambient Sounds */}
            <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Coffee size={20} className="text-purple-400" />
                Ambient
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {ambientSounds.map((sound) => (
                  <Button
                    key={sound.id}
                    variant="outline"
                    className={cn(
                      "bg-[#232323]/50 border-white/5 hover:bg-white/5 h-auto py-3",
                      activeSound?.id === sound.id && "border-purple-500/50 bg-purple-600/20"
                    )}
                    onClick={() => toggleSound(sound)}
                  >
                    <div className="flex items-center gap-2">
                      {activeSound?.id === sound.id ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                      <span>{sound.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Currently Playing */}
          {activeSound && (
            <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center">
                    <Volume2 size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Now Playing</h3>
                    <p className="text-gray-400">{activeSound.name}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/10 hover:bg-white/5"
                  onClick={() => toggleSound(activeSound)}
                >
                  <Pause size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
            <h2 className="text-xl font-semibold mb-4">Sound Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center flex-shrink-0">
                  <Brain size={18} className="text-purple-400" />
                </div>
                <div>
                  <div className="font-medium">Focus Enhancement</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Nature sounds can help reduce stress and improve concentration
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center flex-shrink-0">
                  <Headphones size={18} className="text-purple-400" />
                </div>
                <div>
                  <div className="font-medium">Best with Headphones</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Use headphones for the most immersive experience
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center flex-shrink-0">
                  <Volume size={18} className="text-purple-400" />
                </div>
                <div>
                  <div className="font-medium">Volume Control</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Keep volume at a comfortable level to avoid distraction
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
