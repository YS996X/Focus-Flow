"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, BarChart2, Play, Pause, RotateCcw, Users, Music, MoreHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Anton } from "next/font/google"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SpotifyPlayer } from "@/components/spotify-player"

const anton = Anton({ weight: "400", subsets: ["latin"] })

type FocusSession = {
  date: string
  duration: number
  completed: boolean
}

export default function FocusTimerPage() {
  const router = useRouter()
  const [isSpotifyVisible, setIsSpotifyVisible] = useState(false)
  const [isMoreModalVisible, setIsMoreModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("insights")

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"

    // Redirect to login if not logged in
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  // Main timer state
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [timerMode, setTimerMode] = useState<"pomodoro" | "shortBreak" | "longBreak">("pomodoro")
  const [initialTime, setInitialTime] = useState({ minutes: 25, seconds: 0 })

  // Visual timer state
  const [visualTimerProgress, setVisualTimerProgress] = useState(100)
  const [visualTimerDuration, setVisualTimerDuration] = useState(15)
  const [visualTimerRunning, setVisualTimerRunning] = useState(false)
  const [visualTimerElapsed, setVisualTimerElapsed] = useState(0)
  const visualTimerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Time estimator state
  const [estimatedTime, setEstimatedTime] = useState(30)
  const [realisticTime, setRealisticTime] = useState(45)

  // Focus insights state
  const [productivityScore, setProductivityScore] = useState(78)
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([
    { date: "2025-04-08", duration: 75, completed: true },
    { date: "2025-04-09", duration: 150, completed: true },
    { date: "2025-04-10", duration: 100, completed: true },
    { date: "2025-04-11", duration: 200, completed: true },
    { date: "2025-04-12", duration: 125, completed: true },
    { date: "2025-04-13", duration: 50, completed: true },
    { date: "2025-04-14", duration: 25, completed: false },
  ])
  const [sessionsToday, setSessionsToday] = useState(12)
  const [focusTimeToday, setFocusTimeToday] = useState(3.5)
  const [completionRate, setCompletionRate] = useState(85)

  // Body doubling state
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, name: "Study Session", participants: 3, joined: false },
    { id: 2, name: "Writing Session", participants: 1, joined: false },
    { id: 3, name: "Deep Work Session", participants: 5, joined: false },
  ])

  // Format time as MM:SS
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  // Calculate percentage of time remaining for the main timer
  const calculateMainTimerPercentage = () => {
    const totalSeconds = initialTime.minutes * 60 + initialTime.seconds
    const remainingSeconds = minutes * 60 + seconds
    return (remainingSeconds / totalSeconds) * 100
  }

  // Main timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsRunning(false)
            // Timer completed - play sound or notification
            const audio = new Audio("/notification.mp3")
            audio.play().catch((e) => console.log("Audio play failed:", e))

            // Record completed session
            const today = new Date().toISOString().split("T")[0]
            const newSession = {
              date: today,
              duration: initialTime.minutes,
              completed: true,
            }
            setFocusSessions((prev) => [...prev, newSession])
            setSessionsToday((prev) => prev + 1)
            setFocusTimeToday((prev) => prev + initialTime.minutes / 60)

            // Auto switch to break if in pomodoro mode
            if (timerMode === "pomodoro") {
              setTimerType("shortBreak")
            }
          } else {
            setMinutes(minutes - 1)
            setSeconds(59)
          }
        } else {
          setSeconds(seconds - 1)
        }
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, minutes, seconds, initialTime, timerMode])

  // Visual timer functionality
  useEffect(() => {
    if (visualTimerRunning) {
      visualTimerIntervalRef.current = setInterval(() => {
        setVisualTimerElapsed((prev) => {
          const newElapsed = prev + 1
          if (newElapsed >= visualTimerDuration * 60) {
            setVisualTimerRunning(false)
            clearInterval(visualTimerIntervalRef.current as NodeJS.Timeout)
            // Play notification sound
            const audio = new Audio("/notification.mp3")
            audio.play().catch((e) => console.log("Audio play failed:", e))
            return visualTimerDuration * 60
          }
          return newElapsed
        })
      }, 1000)
    } else if (visualTimerIntervalRef.current) {
      clearInterval(visualTimerIntervalRef.current)
    }

    return () => {
      if (visualTimerIntervalRef.current) {
        clearInterval(visualTimerIntervalRef.current)
      }
    }
  }, [visualTimerRunning, visualTimerDuration])

  // Update visual timer progress
  useEffect(() => {
    const totalSeconds = visualTimerDuration * 60
    const progress = ((totalSeconds - visualTimerElapsed) / totalSeconds) * 100
    setVisualTimerProgress(progress)
  }, [visualTimerElapsed, visualTimerDuration])

  // Update realistic time when estimated time changes
  useEffect(() => {
    setRealisticTime(Math.round(estimatedTime * 1.5))
  }, [estimatedTime])

  // Main timer controls
  const startTimer = () => {
    setIsRunning(true)
  }

  const pauseTimer = () => {
    setIsRunning(false)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setMinutes(initialTime.minutes)
    setSeconds(initialTime.seconds)
  }

  const setTimerType = (type: "pomodoro" | "shortBreak" | "longBreak") => {
    setIsRunning(false)
    setTimerMode(type)

    let newMinutes = 25
    if (type === "shortBreak") {
      newMinutes = 5
    } else if (type === "longBreak") {
      newMinutes = 15
    }

    setMinutes(newMinutes)
    setSeconds(0)
    setInitialTime({ minutes: newMinutes, seconds: 0 })
  }

  // Visual timer controls
  const startVisualTimer = () => {
    setVisualTimerRunning(true)
  }

  const pauseVisualTimer = () => {
    setVisualTimerRunning(false)
  }

  const resetVisualTimer = () => {
    setVisualTimerRunning(false)
    setVisualTimerElapsed(0)
  }

  const setVisualTimer = (mins: number) => {
    setVisualTimerDuration(mins)
    resetVisualTimer()
  }

  // Format seconds to MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  // Body doubling controls
  const toggleJoinSession = (sessionId: number) => {
    setActiveSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              joined: !session.joined,
              participants: session.joined ? session.participants - 1 : session.participants + 1,
            }
          : session,
      ),
    )
  }

  // Modal tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case "insights":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <BarChart2 size={20} className="mr-2" />
              Focus Insights
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">Productivity Score</div>
                  <div className="text-purple-400 font-medium">{productivityScore}/100</div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${productivityScore}%` }}></div>
                </div>
              </div>

              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="font-medium mb-2">Best Focus Times</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-700/50 p-2 rounded-lg text-center">
                    <div className="text-sm text-gray-300">Morning</div>
                    <div className="text-purple-400 font-medium">9-11 AM</div>
                  </div>
                  <div className="bg-gray-700/50 p-2 rounded-lg text-center">
                    <div className="text-sm text-gray-300">Evening</div>
                    <div className="text-purple-400 font-medium">7-9 PM</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="font-medium mb-2">Weekly Focus Sessions</div>
                <div className="flex justify-between h-20">
                  {focusSessions.map((session, index) => {
                    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
                    const height = (session.duration / 200) * 100 // 200 minutes is max height (100%)

                    return (
                      <div key={index} className="flex flex-col items-center justify-end">
                        <div className="w-6 bg-purple-500/70 rounded-t-sm" style={{ height: `${height}%` }}></div>
                        <div className="text-xs mt-1">{dayNames[index]}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="font-medium mb-2">Focus Stats</div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-700/50 p-2 rounded-lg">
                    <div className="text-purple-400 font-medium text-xl">{sessionsToday}</div>
                    <div className="text-xs text-gray-300">Sessions Today</div>
                  </div>
                  <div className="bg-gray-700/50 p-2 rounded-lg">
                    <div className="text-purple-400 font-medium text-xl">{focusTimeToday}h</div>
                    <div className="text-xs text-gray-300">Focus Time</div>
                  </div>
                  <div className="bg-gray-700/50 p-2 rounded-lg">
                    <div className="text-purple-400 font-medium text-xl">{completionRate}%</div>
                    <div className="text-xs text-gray-300">Completion</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      case "bodyDoubling":
        return (
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Users size={20} className="mr-2" />
              Body Doubling
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Work alongside others virtually to increase focus and accountability
            </p>

            <div className="space-y-3">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex justify-between items-center bg-gray-800/50 p-3 rounded-lg">
                  <div>
                    <div className="font-medium">{session.name}</div>
                    <div className="text-sm text-gray-400">
                      {session.participants} {session.participants === 1 ? "person" : "people"}{" "}
                      {session.name.toLowerCase().split(" ")[0]} now
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className={cn(
                      session.joined ? "bg-gray-600 hover:bg-gray-700" : "bg-purple-600 hover:bg-purple-700",
                    )}
                    onClick={() => toggleJoinSession(session.id)}
                  >
                    {session.joined ? "Leave" : "Join"}
                  </Button>
                </div>
              ))}

              <div className="mt-3">
                <Button variant="outline" className="w-full">
                  Create Custom Session
                </Button>
              </div>
            </div>

            <div className="mt-4 bg-gray-800/30 p-3 rounded-lg">
              <h4 className="font-medium mb-2">What is Body Doubling?</h4>
              <p className="text-sm text-gray-400">
                Body doubling is when another person works alongside you. Their presence helps create accountability
                and reduces procrastination - especially helpful for people with ADHD.
              </p>
            </div>
          </div>
        )
      case "visualTimer":
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">Visual Timer</h3>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="w-full h-6 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-1000"
                  style={{ width: `${visualTimerProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>{formatTime(visualTimerElapsed)}</span>
                <span>{visualTimerDuration}:00</span>
              </div>
              <div className="flex justify-center gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs px-3" onClick={() => setVisualTimer(5)}>
                  5 min
                </Button>
                <Button size="sm" variant="outline" className="text-xs px-3" onClick={() => setVisualTimer(15)}>
                  15 min
                </Button>
                <Button size="sm" variant="outline" className="text-xs px-3" onClick={() => setVisualTimer(25)}>
                  25 min
                </Button>
              </div>
              <div className="flex justify-center gap-2 mt-3">
                {!visualTimerRunning ? (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
                    onClick={startVisualTimer}
                  >
                    <Play size={14} /> Start
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
                    onClick={pauseVisualTimer}
                  >
                    <Pause size={14} /> Pause
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex items-center gap-1" onClick={resetVisualTimer}>
                  <RotateCcw size={14} /> Reset
                </Button>
              </div>
            </div>
          </div>
        )
      case "timeEstimator":
        return (
          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Time Estimator
            </h3>
            <p className="text-sm text-gray-400 mb-3">
              Estimate how long tasks will take (often underestimated with ADHD)
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                <span>Your estimate</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="5"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(Number.parseInt(e.target.value) || 30)}
                    className="w-16 p-1 bg-gray-700 rounded-md text-center focus:outline-none border border-gray-600"
                  />
                  <span className="text-sm text-gray-400">min</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                <span>Realistic time (×1.5)</span>
                <div className="text-purple-400 font-medium">{realisticTime} min</div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Tip: People with ADHD often underestimate how long tasks take. Try multiplying your estimate by 1.5
                for better planning.
              </p>
            </div>
          </div>
        )
      case "tips":
        return (
          <div>
            <h3 className="text-lg font-medium mb-3">Focus Tips</h3>
            <div className="space-y-3">
              <div className="bg-purple-600/20 border border-purple-600/30 p-3 rounded-lg">
                <div className="font-medium mb-1">Tip of the Day</div>
                <p className="text-sm text-gray-300">
                  Try the "2-minute rule" - if a task takes less than 2 minutes, do it immediately instead of
                  scheduling it for later.
                </p>
              </div>

              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="font-medium mb-1">Distraction Management</div>
                <ul className="text-sm text-gray-300 space-y-1 ml-4 list-disc">
                  <li>Put your phone in another room</li>
                  <li>Use website blockers during focus sessions</li>
                  <li>Wear noise-cancelling headphones</li>
                  <li>Keep a "distraction pad" to jot down intrusive thoughts</li>
                </ul>
              </div>

              <div className="bg-gray-800/50 p-3 rounded-lg">
                <div className="font-medium mb-1">ADHD-Friendly Focus Techniques</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button variant="outline" size="sm" className="text-xs h-auto py-2">
                    Pomodoro Method
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-auto py-2">
                    Body Doubling
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-auto py-2">
                    Task Chunking
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-auto py-2">
                    Time Blocking
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
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

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Main Pomodoro Timer */}
          <div className="bg-gray-900/50 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Clock size={24} />
              <h1 className="text-2xl font-bold">Focus Timer</h1>
            </div>

            <div className="relative w-[280px] h-[280px] mx-auto mb-8">
              {/* Circle progress indicator */}
              <div className="absolute inset-0 rounded-full bg-gray-800/50 border-4 border-gray-800/30"></div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-purple-600"
                style={{
                  clipPath: `path('M140,0 A140,140 0 ${calculateMainTimerPercentage() <= 50 ? '0' : '1'},1 ${
                    140 + 140 * Math.cos((calculateMainTimerPercentage() / 100) * Math.PI * 2 - Math.PI / 2)
                  },${140 + 140 * Math.sin((calculateMainTimerPercentage() / 100) * Math.PI * 2 - Math.PI / 2)} L140,140 Z')`,
                }}
              ></div>
              
              {/* Time display in the center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn("text-7xl font-bold tracking-tighter leading-none", anton.className)}>
                  {formattedTime}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={isRunning ? pauseTimer : startTimer}
                className="min-w-[120px] bg-purple-600 hover:bg-purple-700 text-white border-none flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Pause size={16} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={16} /> Start
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={resetTimer}
                className="min-w-[120px] flex items-center gap-2"
              >
                <RotateCcw size={16} /> Reset
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full bg-gray-800/50 p-1 rounded-lg">
              <Button
                variant={timerMode === "pomodoro" ? "default" : "ghost"}
                onClick={() => setTimerType("pomodoro")}
                className={timerMode === "pomodoro" ? "bg-gray-700" : ""}
              >
                Pomodoro
              </Button>
              <Button
                variant={timerMode === "shortBreak" ? "default" : "ghost"}
                onClick={() => setTimerType("shortBreak")}
                className={timerMode === "shortBreak" ? "bg-gray-700" : ""}
              >
                Short Break
              </Button>
              <Button
                variant={timerMode === "longBreak" ? "default" : "ghost"}
                onClick={() => setTimerType("longBreak")}
                className={timerMode === "longBreak" ? "bg-gray-700" : ""}
              >
                Long Break
              </Button>
            </div>

            <p className="text-gray-400 text-sm mt-4">
              {timerMode === "pomodoro"
                ? "Focus for 25 minutes, then take a short break"
                : timerMode === "shortBreak"
                  ? "Take a 5 minute break to recharge"
                  : "Take a 15 minute break after completing 4 pomodoros"}
            </p>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => setIsMoreModalVisible(true)}
              className="mt-8 w-full flex items-center justify-center gap-2 border border-gray-700 hover:bg-gray-800"
            >
              <MoreHorizontal size={18} /> More Options
            </Button>
          </div>
        </div>
      </main>

      {/* Spotify Player */}
      <SpotifyPlayer isVisible={isSpotifyVisible} onClose={() => setIsSpotifyVisible(false)} />

      {/* More Options Modal */}
      {isMoreModalVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">More Options</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsMoreModalVisible(false)}>
                <X size={20} />
              </Button>
            </div>

            {/* Modal Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <Button
                variant={activeTab === "insights" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("insights")}
                className={activeTab === "insights" ? "bg-purple-600" : ""}
              >
                <BarChart2 size={16} className="mr-1" /> Insights
              </Button>
              <Button
                variant={activeTab === "bodyDoubling" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("bodyDoubling")}
                className={activeTab === "bodyDoubling" ? "bg-purple-600" : ""}
              >
                <Users size={16} className="mr-1" /> Body Doubling
              </Button>
              <Button
                variant={activeTab === "timeEstimator" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("timeEstimator")}
                className={activeTab === "timeEstimator" ? "bg-purple-600" : ""}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Time Estimator
              </Button>
              <Button
                variant={activeTab === "tips" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab("tips")}
                className={activeTab === "tips" ? "bg-purple-600" : ""}
              >
                Tips
              </Button>
            </div>

            {/* Tab Content */}
            <div className="pb-2">{renderTabContent()}</div>
          </div>
        </div>
      )}
    </div>
  )
}