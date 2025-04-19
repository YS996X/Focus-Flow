"use client"

import { useState } from "react"
import { Music, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSpotifyStore } from "@/store/spotify-store"

type SpotifyPlayerProps = {
  isVisible: boolean
  onClose: () => void
}

// Preset playlists for different activities
const PRESET_PLAYLISTS = [
  {
    id: "37i9dQZF1DX8NTLI2TtZa6",
    title: "Focus Flow",
    description: "Instrumental beats for deep focus",
    category: "Study"
  },
  {
    id: "37i9dQZF1DX9sIqqvKsjG8",
    title: "Peaceful Piano",
    description: "Relaxing piano pieces for concentration",
    category: "Study"
  },
  {
    id: "37i9dQZF1DX5trt9i14X7j",
    title: "Coding Mode",
    description: "Electronic beats for coding sessions",
    category: "Programming"
  },
  {
    id: "37i9dQZF1DX0Yxoavh5qJV",
    title: "Deep Focus",
    description: "Keep calm and focus with ambient and post-rock",
    category: "Study"
  }
]

export function SpotifyPlayer({ isVisible, onClose }: SpotifyPlayerProps) {
  const [showInput, setShowInput] = useState(false)
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [playlistId, setPlaylistId] = useState<string | null>(null)
  const [isSelectingPlaylist, setIsSelectingPlaylist] = useState(true)
  const [isHovering, setIsHovering] = useState(false)

  const handleImportPlaylist = () => {
    const id = playlistUrl.split("/").pop()?.split("?")[0]
    if (id) {
      setPlaylistId(id)
      setShowInput(false)
      setIsSelectingPlaylist(false)
    }
  }

  const handlePresetSelect = (id: string) => {
    setPlaylistId(id)
    setIsSelectingPlaylist(false)
  }

  if (!isVisible) return null

  if (isSelectingPlaylist) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-900/90 rounded-lg w-full max-w-2xl p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-white text-center">Choose Your Focus Music</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {PRESET_PLAYLISTS.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => handlePresetSelect(playlist.id)}
                  className="bg-gray-800/50 hover:bg-gray-800 transition-colors rounded-lg p-4 text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-900/50 rounded-md flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white group-hover:text-purple-400 transition-colors">
                        {playlist.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">{playlist.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center space-y-4 mt-6">
              <div className="w-full h-px bg-gray-800"></div>
              <button
                onClick={() => setShowInput(true)}
                className="text-purple-400 hover:text-purple-300 text-sm"
              >
                Import your own Spotify playlist
              </button>
            </div>

            {showInput && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Paste Spotify playlist URL"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleImportPlaylist}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md transition-colors"
                >
                  Import Playlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed bottom-24 left-4 w-[300px] bg-black/95 rounded-xl overflow-hidden shadow-2xl z-50 group backdrop-blur-sm"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ 
        boxShadow: '0 4px 32px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}
    >
      <div 
        className={cn(
          "absolute top-3 right-3 z-10 flex items-center gap-2 transition-all duration-200",
          isHovering ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        )}
      >
        <button
          onClick={() => setIsSelectingPlaylist(true)}
          className="p-1.5 rounded-full bg-black/60 text-gray-400 hover:text-white hover:bg-black/80 transition-all"
        >
          <Music size={14} />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-black/60 text-gray-400 hover:text-white hover:bg-black/80 transition-all"
        >
          <X size={14} />
        </button>
      </div>
      {playlistId && (
        <div className="bg-black/40 backdrop-blur-sm">
          <iframe
            src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ 
              borderRadius: '12px',
              backgroundColor: 'transparent',
              display: 'block',
              margin: '-1px',
            }}
          />
        </div>
      )}
    </div>
  )
}
