"use client"
import { useState, useEffect } from "react"
import { Music, Settings, Maximize, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Anton } from "next/font/google"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SpotifyPlayer } from "@/components/spotify-player"
import SettingsMenu from "@/components/settings-menu"

const anton = Anton({ weight: "400", subsets: ["latin"] })

export default function HomePage() {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [userName, setUserName] = useState("User")
  const [isMuted, setIsMuted] = useState(false)
  const [currentDay, setCurrentDay] = useState("")
  const [greeting, setGreeting] = useState("")
  const [isSpotifyVisible, setIsSpotifyVisible] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"

    // Redirect to login if not logged in
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  // Format time as HH:MM
  const formattedTime = `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(
    2,
    "0",
  )}`

  // Update current day and greeting
  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const date = new Date()
    setCurrentDay(days[date.getDay()])

    const hour = date.getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")

    // Get user's name from localStorage if available
    const savedName = localStorage.getItem("focusUserName")
    if (savedName) setUserName(savedName)
  }, [])

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col transition-colors duration-300",
        isDarkMode ? "bg-transparent text-white" : "bg-transparent text-gray-900",
      )}
    >
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-xl md:text-2xl mb-6">
          {greeting}, <span className="font-medium">{userName}</span>. It's {currentDay} time!
        </h2>

        <div className={cn("text-[8rem] md:text-[12rem] font-bold tracking-wider leading-none", anton.className)}>
          {formattedTime}
        </div>

        <div className="w-full">
          <div className="flex flex-wrap gap-2 mt-8 p-2 bg-gray-800/30 rounded-full mx-auto max-w-fit justify-center">
            <Link href="/notes">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                Notes
              </Button>
            </Link>
            <Link href="/ai-helper">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                AI Helper
              </Button>
            </Link>
            <Link href="/focus-timer">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                Focus Timer
              </Button>
            </Link>
            <Link href="/ambient">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                Ambient
              </Button>
            </Link>
            <Link href="/schedule">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                Schedule
              </Button>
            </Link>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                Tasks
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSpotifyVisible(!isSpotifyVisible)}
            className={isSpotifyVisible ? "text-purple-400" : ""}
          >
            <Music size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={20} />
          </Button>
          <Button variant="ghost" size="icon">
            <Maximize size={20} />
          </Button>
        </div>
      </footer>

      <SpotifyPlayer isVisible={isSpotifyVisible} onClose={() => setIsSpotifyVisible(false)} />
      <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
 