"use client"
import { useState, useEffect, useRef } from "react"
import { Music, Settings, Maximize, Minimize, Volume2, BookOpen, ListTodo, Clock, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import SettingsMenu from "@/components/settings-menu"
import { useAudio } from "@/components/audio-provider"
import { FloatingDock } from "@/components/ui/floating-dock"
import WallpaperProvider from "@/components/wallpaper-provider"

export default function HomePage() {
  const router = useRouter()
  const { isAmbientPlaying, ambientSound } = useAudio()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [userName, setUserName] = useState("User")
  const [currentDay, setCurrentDay] = useState("")
  const [greeting, setGreeting] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDockVisible, setIsDockVisible] = useState(true)
  const dockAreaRef = useRef<HTMLDivElement>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  // Format time as HH:MM
  const formattedTime = `${String(currentTime.getHours()).padStart(2, "0")}:${String(currentTime.getMinutes()).padStart(2, "0")}`

  // Update current day and greeting
  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const date = new Date()
    setCurrentDay(days[date.getDay()])
    const hour = date.getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")
    const savedName = localStorage.getItem("focusUserName")
    if (savedName) setUserName(savedName)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      const docEl = document.documentElement
      if (docEl.requestFullscreen) docEl.requestFullscreen()
      else if ((docEl as any).mozRequestFullScreen) (docEl as any).mozRequestFullScreen()
      else if ((docEl as any).webkitRequestFullscreen) (docEl as any).webkitRequestFullscreen()
      else if ((docEl as any).msRequestFullscreen) (docEl as any).msRequestFullscreen()
    } else {
      if (document.exitFullscreen) document.exitFullscreen()
      else if ((document as any).mozCancelFullScreen) (document as any).mozCancelFullScreen()
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen()
      else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // Handle mouse movement to show/hide dock
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientY } = e
      const viewportHeight = window.innerHeight
      const threshold = viewportHeight - 150 // Show dock when mouse is within 150px of bottom

      // Mouse is in the dock area (near bottom)
      if (clientY > threshold) {
        // Clear any hide timeout
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
          hideTimeoutRef.current = null
        }
        setIsDockVisible(true)
      } 
      // Mouse has moved away from dock area
      else if (isDockVisible) {
        // Set a timeout to hide the dock after a delay
        if (!hideTimeoutRef.current) {
          hideTimeoutRef.current = setTimeout(() => {
            setIsDockVisible(false)
            hideTimeoutRef.current = null
          }, 1500) // 1.5 second delay before hiding
        }
      }
    }

    // Check if mouse is over the dock itself
    const handleDockMouseEnter = () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
        hideTimeoutRef.current = null
      }
      setIsDockVisible(true)
    }

    window.addEventListener('mousemove', handleMouseMove)
    const dockElement = dockAreaRef.current
    if (dockElement) {
      dockElement.addEventListener('mouseenter', handleDockMouseEnter)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (dockElement) {
        dockElement.removeEventListener('mouseenter', handleDockMouseEnter)
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [isDockVisible])

  // Navigation items for the dock
  const navigationItems = [
    {
      title: "Notes",
      icon: <BookOpen className="h-full w-full text-white" />,
      href: "/notes"
    },
    {
      title: "AI Helper",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
          <path d="M7 7h.01"></path>
        </svg>
      ),
      href: "/ai-helper"
    },
    {
      title: "Focus Timer",
      icon: <Clock className="h-full w-full text-white" />,
      href: "/focus-timer"
    },
    {
      title: "Ambient Sounds",
      icon: <Volume2 className="h-full w-full text-white" />,
      href: "/ambient"
    },
    {
      title: "Schedule",
      icon: <Calendar className="h-full w-full text-white" />,
      href: "/schedule"
    },
    {
      title: "Tasks",
      icon: <ListTodo className="h-full w-full text-white" />,
      href: "/tasks"
    },
    {
      title: "Settings",
      icon: <Settings className="h-full w-full text-white" />,
      href: "#settings"
    },
    {
      title: "Fullscreen",
      icon: isFullscreen ? <Minimize className="h-full w-full text-white" /> : <Maximize className="h-full w-full text-white" />,
      href: "#fullscreen"
    }
  ];

  // Handle custom click events
  const handleNavClick = (href: string) => {
    if (href === "#settings") {
      setIsSettingsOpen(true);
    } else if (href === "#fullscreen") {
      toggleFullscreen();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ensure wallpaper is applied when page loads */}
      <WallpaperProvider />
      
      {/* Background overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1526]/80 via-[#0a1526]/70 to-[#0a1526]/80 mix-blend-multiply z-10" />
      <div className="absolute inset-0 bg-gradient-radial from-[#995c1d]/10 via-transparent to-transparent z-10 opacity-40" />
      <div className="absolute inset-0 shadow-[inset_0_0_150px_30px_rgba(0,0,0,0.8)] z-10 pointer-events-none" />

      {/* Main Content */}
      <div className="text-center relative z-20 flex flex-col items-center">
        <div className="text-[190px] font-extrabold tracking-tight leading-none text-white" 
          style={{ 
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            textShadow: '0 0 10px rgba(255,255,255,0.1)'
          }}>
          {formattedTime}
        </div>
        <div className="text-2xl mt-1 text-white/90 font-light tracking-wide">
          {greeting}, <span className="font-medium">{userName}</span>. {currentDay}
        </div>
        </div>

      {/* Custom Floating Dock */}
      <div 
        ref={dockAreaRef}
        className="fixed bottom-5 left-0 w-full h-32 z-20 flex items-end justify-center"
      >
        <div 
          className={`transition-transform duration-500 ease-in-out transform ${isDockVisible ? 'translate-y-0' : 'translate-y-24'}`}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const href = target.closest('a')?.getAttribute('href');
            if (href?.startsWith('#')) {
              e.preventDefault();
              handleNavClick(href);
            }
          }}
        >
          <FloatingDock
            items={navigationItems}
            desktopClassName="!bg-[#232323]/50 backdrop-blur-md border border-white/5 !rounded-full !px-7 !h-[72px] !pb-5"
          />
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsMenu isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  )
}
 