"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, BarChart2, Play, Pause, RotateCcw, Users, Music, MoreHorizontal, X, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Anton } from "next/font/google"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SpotifyPlayer } from "@/components/spotify-player"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { useAudio } from "@/components/audio-provider"
import { AppHeader } from "@/components/app-header"

const anton = Anton({ weight: "400", subsets: ["latin"] })

type FocusSession = {
  id?: string;
  userId?: string;
  duration: number;
  timestamp?: Timestamp;
  timeOfDay?: number;
  date?: string;
  completed?: boolean;
  streak?: number;
};

export default function FocusTimerPage() {
  const router = useRouter()
  const { isAmbientPlaying, ambientSound } = useAudio()
  const [isSpotifyVisible, setIsSpotifyVisible] = useState(false)
  const [isMoreModalVisible, setIsMoreModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("insights")
  const [user, setUser] = useState<User | null>(null)
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([])

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
  const [productivityScore, setProductivityScore] = useState(0)
  const [sessionsToday, setSessionsToday] = useState(0)
  const [focusTimeToday, setFocusTimeToday] = useState(0)
  const [completionRate, setCompletionRate] = useState(0)
  const [bestMorningTime, setBestMorningTime] = useState<string | null>(null)
  const [bestEveningTime, setBestEveningTime] = useState<string | null>(null)

  // Body doubling state
  const [activeSessions, setActiveSessions] = useState([
    { id: 1, name: "Study Session", participants: 3, joined: false },
    { id: 2, name: "Writing Session", participants: 1, joined: false },
    { id: 3, name: "Deep Work Session", participants: 5, joined: false },
  ])

  // New state variables
  const [showMotivationalQuote, setShowMotivationalQuote] = useState(true)
  const [currentQuote, setCurrentQuote] = useState("")
  const [streak, setStreak] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(4) // 4 sessions per day default

  // Format time as MM:SS
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        isRunning ? pauseTimer() : startTimer()
      } else if (e.code === "KeyR" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        resetTimer()
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [isRunning])

  // Motivational quotes
  const quotes = [
    "Focus on the process, not the outcome.",
    "Small steps lead to big achievements.",
    "Your future self will thank you.",
    "Stay focused, stay strong.",
    "Every minute counts.",
  ]

  useEffect(() => {
    setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)])
  }, [])

  // Enhanced session saving
  const saveFocusSession = async (session: FocusSession, userId: string) => {
    try {
      const sessionToSave = {
        ...session,
        userId,
        timestamp: Timestamp.now(),
        streak: streak + 1
      }
      
      await addDoc(collection(db, "focusSessions"), sessionToSave)
      console.log("Focus session saved successfully")
      
      // Update streak
      setStreak(prev => prev + 1)
      
      // Show completion message
      setShowMotivationalQuote(true)
      setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)])
      
      fetchSessions(userId)
    } catch (error) {
      console.error("Error saving focus session:", error)
    }
  }

  // Calculate timer percentage for circular progress
  const calculateMainTimerPercentage = () => {
    const totalSeconds = initialTime.minutes * 60 + initialTime.seconds
    const remainingSeconds = minutes * 60 + seconds
    return 100 - ((remainingSeconds / totalSeconds) * 100) // Invert the percentage
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
            const timeOfDay = new Date().getHours()
            const newSession: FocusSession = {
              date: today,
              duration: initialTime.minutes * 60, // convert to seconds for consistency
              timeOfDay: timeOfDay,
              completed: true,
            }
            
            // Save to local state
            setFocusSessions((prev) => [...prev, newSession])
            setSessionsToday((prev) => prev + 1)
            setFocusTimeToday((prev) => prev + initialTime.minutes / 60)
            
            // Save to Firebase if user is authenticated
            if (user && typeof user.uid === 'string') {
              saveFocusSession(newSession, user.uid)
            }

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
  }, [isRunning, minutes, seconds, initialTime, timerMode, user])

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
                    <div className="text-purple-400 font-medium">
                      {bestMorningTime || "Not enough data"}
                    </div>
                  </div>
                  <div className="bg-gray-700/50 p-2 rounded-lg text-center">
                    <div className="text-sm text-gray-300">Evening</div>
                    <div className="text-purple-400 font-medium">
                      {bestEveningTime || "Not enough data"}
                    </div>
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

  useEffect(() => {
    // Check authentication state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        fetchSessions(currentUser.uid)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchSessions = async (userId: string) => {
    try {
      const q = query(
        collection(db, "focusSessions"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      )
      
      const querySnapshot = await getDocs(q)
      const sessionData: FocusSession[] = []
      
      querySnapshot.forEach((doc) => {
        sessionData.push({
          id: doc.id,
          ...doc.data()
        } as FocusSession)
      })
      
      setFocusSessions(sessionData)
      calculateInsights(sessionData)
    } catch (error) {
      console.error("Error fetching sessions:", error)
    }
  }

  const calculateInsights = (sessionData: FocusSession[]) => {
    if (sessionData.length === 0) {
      // Reset all insights if no data
      setSessionsToday(0)
      setFocusTimeToday(0)
      setProductivityScore(0)
      setCompletionRate(0)
      setBestMorningTime(null)
      setBestEveningTime(null)
      setStreak(0)
      return
    }
    
    // Helper function to format hour to 12-hour format with AM/PM
    const formatHour = (hour: number) => {
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const formattedHour = hour % 12 || 12
      return `${formattedHour} ${ampm}`
    }
    
    // Get today's date and format it
    const today = new Date().toISOString().split('T')[0]
    
    // Calculate daily streak
    const sortedDates = [...new Set(sessionData.map(session => session.date))].sort()
    let currentStreak = 0
    let date = new Date()
    date.setHours(0, 0, 0, 0)

    // Count backwards from today until we find a day without sessions
    while (true) {
      const dateStr = date.toISOString().split('T')[0]
      const hasSession = sortedDates.includes(dateStr)
      if (!hasSession) break
      currentStreak++
      date.setDate(date.getDate() - 1)
    }
    setStreak(currentStreak)

    // Count today's sessions and focus time
    const todaySessions = sessionData.filter(session => session.date === today)
    const todayFocusTime = todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 3600 // Convert to hours
    setSessionsToday(todaySessions.length)
    setFocusTimeToday(parseFloat(todayFocusTime.toFixed(1)))

    // Calculate completion rate
    const completedSessions = sessionData.filter(session => session.completed)
    const completionRateValue = Math.round((completedSessions.length / sessionData.length) * 100)
    setCompletionRate(completionRateValue)

    // Calculate productivity score based on multiple factors
    const lastWeekSessions = sessionData.filter(session => {
      if (!session.timestamp) return false
      const sessionDate = session.timestamp.toDate()
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return sessionDate >= weekAgo
    })

    // Factors for productivity score:
    // 1. Consistency (sessions per day) - max 30 points
    const daysWithSessions = new Set(lastWeekSessions.map(s => s.date)).size
    const consistencyScore = Math.min(30, Math.round((daysWithSessions / 7) * 30))

    // 2. Session completion rate - max 30 points
    const weekCompletionRate = lastWeekSessions.filter(s => s.completed).length / lastWeekSessions.length
    const completionScore = Math.round(weekCompletionRate * 30)

    // 3. Focus time - max 40 points
    // Assume 2 hours per day is optimal (14 hours per week)
    const weeklyFocusHours = lastWeekSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 3600
    const focusScore = Math.min(40, Math.round((weeklyFocusHours / 14) * 40))

    setProductivityScore(consistencyScore + completionScore + focusScore)

    // Calculate best focus times
    const hourCounts: Record<number, { count: number, totalDuration: number }> = {}
    
    sessionData.forEach(session => {
      if (session.timeOfDay !== undefined && session.duration) {
        const hour = session.timeOfDay
        if (!hourCounts[hour]) {
          hourCounts[hour] = { count: 0, totalDuration: 0 }
        }
        hourCounts[hour].count++
        hourCounts[hour].totalDuration += session.duration
      }
    })

    // Find best times based on both frequency and average duration
    let bestMorningHour = -1
    let bestEveningHour = -1
    let maxMorningScore = 0
    let maxEveningScore = 0

    Object.entries(hourCounts).forEach(([hourStr, data]) => {
      const hour = parseInt(hourStr)
      const avgDuration = data.totalDuration / data.count
      // Score = frequency * average duration (in minutes)
      const score = data.count * (avgDuration / 60)

      // Morning: 5am-12pm
      if (hour >= 5 && hour < 12 && score > maxMorningScore) {
        bestMorningHour = hour
        maxMorningScore = score
      }
      // Evening: 5pm-10pm
      if (hour >= 17 && hour < 22 && score > maxEveningScore) {
        bestEveningHour = hour
        maxEveningScore = score
      }
    })

    // Only set best times if we have enough data (at least 3 sessions)
    if (maxMorningScore > 0 && hourCounts[bestMorningHour]?.count >= 3) {
      setBestMorningTime(`${formatHour(bestMorningHour)}-${formatHour(bestMorningHour + 1)}`)
    } else {
      setBestMorningTime(null)
    }

    if (maxEveningScore > 0 && hourCounts[bestEveningHour]?.count >= 3) {
      setBestEveningTime(`${formatHour(bestEveningHour)}-${formatHour(bestEveningHour + 1)}`)
    } else {
      setBestEveningTime(null)
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <AppHeader />

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Section */}
          <div className="space-y-6">
            {/* Timer Display */}
            <div className="relative aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gray-900/50 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className={cn(
                    anton.className,
                    "text-7xl tracking-wider transition-colors",
                    isRunning ? "text-purple-400" : "text-white"
                  )}>
                    {formattedTime}
                  </div>
                  {showMotivationalQuote && (
                    <div className="mt-2 text-gray-400 text-sm max-w-[200px] mx-auto">
                      {currentQuote}
                    </div>
                  )}
                </div>
              </div>
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-gray-800"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - calculateMainTimerPercentage() / 100)}`}
                  className="text-purple-500 transition-all duration-1000"
                />
              </svg>
            </div>

            {/* Timer Controls */}
            <div className="space-y-4">
              <div className="flex justify-center gap-2">
                <Button
                  variant={timerMode === "pomodoro" ? "default" : "ghost"}
                  onClick={() => setTimerType("pomodoro")}
                  className="flex-1"
                >
                  Pomodoro
                </Button>
                <Button
                  variant={timerMode === "shortBreak" ? "default" : "ghost"}
                  onClick={() => setTimerType("shortBreak")}
                  className="flex-1"
                >
                  Short Break
                </Button>
                <Button
                  variant={timerMode === "longBreak" ? "default" : "ghost"}
                  onClick={() => setTimerType("longBreak")}
                  className="flex-1"
                >
                  Long Break
                </Button>
              </div>

              <div className="flex justify-center gap-2">
                {!isRunning ? (
                  <Button
                    size="lg"
                    onClick={startTimer}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Play className="w-6 h-6" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={pauseTimer}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Pause className="w-6 h-6" />
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetTimer}
                  className="text-gray-400"
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
              </div>

              {/* Session Progress */}
              {isRunning && (
                <div className="bg-gray-800/30 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-400">Session Progress</div>
                    <div className="text-sm text-purple-400">{Math.round(calculateMainTimerPercentage())}%</div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-purple-500 h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${calculateMainTimerPercentage()}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Streak and Goals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{streak}</div>
                  <div className="text-sm text-gray-400">Day Streak</div>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{sessionsToday}/{dailyGoal}</div>
                  <div className="text-sm text-gray-400">Daily Goal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart2 size={24} />
                <h2 className="text-2xl font-bold">Focus Stats</h2>
              </div>

              {/* Enhanced Stats Display */}
              <div className="space-y-6">
                {/* Productivity Score */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">Productivity Score</div>
                    <div className="text-purple-400 font-medium">{productivityScore}/100</div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-500 h-full transition-all duration-1000"
                      style={{ width: `${productivityScore}%` }}
                    />
                  </div>
                </div>

                {/* Focus Time Distribution */}
                <div className="space-y-2">
                  <div className="font-medium mb-2">Focus Time Distribution</div>
                  <div className="grid grid-cols-7 gap-1 h-24">
                    {(() => {
                      // Get the last 7 days
                      const days = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date()
                        date.setDate(date.getDate() - i)
                        return date.toISOString().split('T')[0]
                      }).reverse()

                      // Calculate focus time for each day
                      const dailyFocusTime = days.map(date => {
                        const sessionsForDay = focusSessions.filter(session => session.date === date)
                        const totalMinutes = sessionsForDay.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
                        return totalMinutes
                      })

                      // Find the maximum focus time for scaling
                      const maxFocusTime = Math.max(...dailyFocusTime, 120) // At least 2 hours for scale

                      return days.map((date, i) => {
                        const height = (dailyFocusTime[i] / maxFocusTime) * 100
                        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date).getDay()]
                        
                        return (
                          <div key={date} className="flex flex-col justify-end">
                            <div
                              className="bg-purple-500/70 rounded-t relative group"
                              style={{ height: `${height}%` }}
                            >
                              <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {Math.round(dailyFocusTime[i])} min
                              </div>
                            </div>
                            <div className="text-xs text-center mt-1">{dayName}</div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>

                {/* Best Focus Times */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Best Morning Time</div>
                    <div className="text-xl font-medium text-purple-400">
                      {bestMorningTime || "Not enough data"}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400 mb-1">Best Evening Time</div>
                    <div className="text-xl font-medium text-purple-400">
                      {bestEveningTime || "Not enough data"}
                    </div>
                  </div>
                </div>

                {/* Recent Sessions */}
                <div>
                  <h3 className="font-medium mb-3">Recent Sessions</h3>
                  <div className="space-y-2">
                    {focusSessions.slice(0, 3).map((session, i) => (
                      <div key={i} className="bg-gray-800/50 p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-400">
                            {session.duration / 60} minutes
                          </div>
                        </div>
                        <div className="text-purple-400">{session.completed ? "Completed" : "Incomplete"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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