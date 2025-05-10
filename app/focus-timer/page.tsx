"use client"

import { useState, useEffect, useRef } from "react"
import { Clock, BarChart2, Play, Pause, RotateCcw, Users, Music, MoreHorizontal, X, Volume2, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Anton } from "next/font/google"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { useAudio } from "@/components/audio-provider"
import { AppHeader } from "@/components/app-header"
import WallpaperProvider from "@/components/wallpaper-provider"

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
  const [isMoreModalVisible, setIsMoreModalVisible] = useState(false)
  const [activeTab, setActiveTab] = useState("insights")
  const [user, setUser] = useState<User | null>(null)
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([])
  const [showMoreOptions, setShowMoreOptions] = useState(false)
 
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
  const [visualTimerDuration, setVisualTimerDuration] = useState(25)
  const [visualTimerRunning, setVisualTimerRunning] = useState(false)
  const [visualTimerElapsed, setVisualTimerElapsed] = useState(0)
  const visualTimerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Time estimator state
  const [estimatedTime, setEstimatedTime] = useState(25)
  const [realisticTime, setRealisticTime] = useState(38)

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

  // Enhanced session saving with backup
  const saveFocusSession = async (session: FocusSession, userId: string) => {
    try {
      const sessionToSave = {
        ...session,
        userId,
        timestamp: Timestamp.now(),
        streak: streak + 1
      }
      
      // Save to Firestore
      const docRef = await addDoc(collection(db, "focusSessions"), sessionToSave)
      console.log("Focus session saved successfully with ID:", docRef.id)
      
      // Update local state
      setFocusSessions(prev => [...prev, { ...sessionToSave, id: docRef.id }])
      setStreak(prev => prev + 1)
      
      // Show completion message
      setShowMotivationalQuote(true)
      setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)])
      
      // Fetch updated sessions
      await fetchSessions(userId)
    } catch (error) {
      console.error("Error saving focus session:", error)
    }
  }

  // Backup all focus data
  const backupFocusData = async (userId: string) => {
    try {
      const backupData = {
        userId,
        timestamp: Timestamp.now(),
        sessions: focusSessions,
        stats: {
          productivityScore,
          sessionsToday,
          focusTimeToday,
          completionRate,
          streak,
          bestMorningTime,
          bestEveningTime
        }
      }

      await addDoc(collection(db, "focusBackups"), backupData)
      console.log("Focus data backed up successfully")
    } catch (error) {
      console.error("Error backing up focus data:", error)
    }
  }

  // Restore focus data from backup
  const restoreFocusData = async (userId: string) => {
    try {
      const q = query(
        collection(db, "focusBackups"),
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      )
      
      const querySnapshot = await getDocs(q)
      if (!querySnapshot.empty) {
        const latestBackup = querySnapshot.docs[0].data()
        
        // Restore sessions
        setFocusSessions(latestBackup.sessions)
        
        // Restore stats
        const stats = latestBackup.stats
        setProductivityScore(stats.productivityScore)
        setSessionsToday(stats.sessionsToday)
        setFocusTimeToday(stats.focusTimeToday)
        setCompletionRate(stats.completionRate)
        setStreak(stats.streak)
        setBestMorningTime(stats.bestMorningTime)
        setBestEveningTime(stats.bestEveningTime)
        
        console.log("Focus data restored successfully")
      }
    } catch (error) {
      console.error("Error restoring focus data:", error)
    }
  }

  // Auto-backup on session completion
  useEffect(() => {
    if (user && typeof user.uid === 'string' && focusSessions.length > 0) {
      backupFocusData(user.uid)
    }
  }, [focusSessions, user])

  // Auto-restore on component mount
  useEffect(() => {
    if (user && typeof user.uid === 'string') {
      restoreFocusData(user.uid)
    }
  }, [user])

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
    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    
    // Calculate daily streak
    let currentStreak = 0
    const uniqueDates = [...new Set(sessionData.map(session => session.date))].sort()
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const checkDateStr = checkDate.toISOString().split('T')[0]
      
      if (uniqueDates.includes(checkDateStr)) {
        currentStreak++
      } else {
        break
      }
    }
    setStreak(currentStreak)

    // Calculate today's sessions and focus time
    const todaySessions = sessionData.filter(session => session.date === todayStr)
    const todayFocusTime = todaySessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60 // Convert to minutes
    setSessionsToday(todaySessions.length)
    setFocusTimeToday(Math.round(todayFocusTime / 60 * 10) / 10) // Round to 1 decimal place

    // Calculate completion rate
    const completedSessions = sessionData.filter(session => session.completed)
    const completionRateValue = sessionData.length > 0 
      ? Math.round((completedSessions.length / sessionData.length) * 100)
      : 0
    setCompletionRate(completionRateValue)

    // Calculate productivity score
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const lastWeekSessions = sessionData.filter(session => {
      if (!session.timestamp) return false
      const sessionDate = session.timestamp.toDate()
      return sessionDate >= weekAgo
    })

    // 1. Consistency (30 points)
    const daysWithSessions = new Set(lastWeekSessions.map(s => s.date)).size
    const consistencyScore = Math.round((daysWithSessions / 7) * 30)

    // 2. Completion rate (30 points)
    const weekCompletionScore = lastWeekSessions.length > 0
      ? Math.round((lastWeekSessions.filter(s => s.completed).length / lastWeekSessions.length) * 30)
      : 0

    // 3. Focus time (40 points) - Target: 2 hours per day
    const weeklyFocusHours = lastWeekSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 3600
    const focusScore = Math.min(40, Math.round((weeklyFocusHours / 14) * 40))

    const totalScore = consistencyScore + weekCompletionScore + focusScore
    setProductivityScore(totalScore)

    // Calculate focus time distribution for the last 7 days
    const focusTimeByDay = new Map()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const sessionsForDay = sessionData.filter(session => session.date === dateStr)
      const minutesForDay = sessionsForDay.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
      focusTimeByDay.set(dateStr, Math.round(minutesForDay))
    }

    // Calculate best focus times
    const hourCounts = new Map()
    
    sessionData.forEach(session => {
      if (session.timeOfDay !== undefined && session.duration) {
        const hour = session.timeOfDay
        if (!hourCounts.has(hour)) {
          hourCounts.set(hour, { count: 0, totalDuration: 0 })
        }
        const data = hourCounts.get(hour)
        data.count++
        data.totalDuration += session.duration
        hourCounts.set(hour, data)
      }
    })

    // Find best morning and evening times
    let bestMorningScore = 0
    let bestEveningScore = 0
    let bestMorningHour = -1
    let bestEveningHour = -1

    hourCounts.forEach((data, hour) => {
      const avgDuration = data.totalDuration / data.count
      const score = data.count * (avgDuration / 3600) // Convert to hours

      if (hour >= 5 && hour < 12 && score > bestMorningScore && data.count >= 3) {
        bestMorningScore = score
        bestMorningHour = hour
      }
      if (hour >= 17 && hour < 22 && score > bestEveningScore && data.count >= 3) {
        bestEveningScore = score
        bestEveningHour = hour
      }
    })

    // Format and set best times
    const formatHour = (hour: number) => {
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const formattedHour = hour % 12 || 12
      return `${formattedHour} ${ampm}`
    }

    setBestMorningTime(bestMorningHour !== -1 
      ? `${formatHour(bestMorningHour)}-${formatHour(bestMorningHour + 1)}`
      : "Not enough data"
    )
    
    setBestEveningTime(bestEveningHour !== -1
      ? `${formatHour(bestEveningHour)}-${formatHour(bestEveningHour + 1)}`
      : "Not enough data"
    )
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <WallpaperProvider />
      <AppHeader />

      <main className="flex-1 px-8 py-8 relative overflow-hidden">
        {/* Background overlays - matching home page style */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1526]/80 via-[#0a1526]/70 to-[#0a1526]/80 mix-blend-multiply z-10 rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-radial from-[#995c1d]/10 via-transparent to-transparent opacity-40 z-10 rounded-2xl" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_30px_rgba(0,0,0,0.8)] pointer-events-none z-10 rounded-2xl" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-20">
          {/* Timer Section */}
          <div className="space-y-8">
            {/* Timer Display */}
            <div className="relative aspect-square max-w-md mx-auto bg-[#1a1a1a]/40 rounded-2xl p-1 backdrop-blur-lg border border-white/5">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={cn(
                    anton.className,
                    "text-8xl tracking-wider transition-colors",
                    isRunning ? "text-purple-400" : "text-white"
                  )}>
                    {formattedTime}
                  </div>
                  {showMotivationalQuote && (
                    <div className="mt-4 text-gray-300 text-lg max-w-[280px] mx-auto font-light">
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
                  strokeWidth="2"
                  className="text-gray-800/30"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - calculateMainTimerPercentage() / 100)}`}
                  className="text-purple-500/80 transition-all duration-1000"
                />
              </svg>
            </div>

            {/* Timer Controls */}
            <div className="space-y-6">
              <div className="flex justify-center gap-2 p-1 bg-[#1a1a1a]/40 backdrop-blur-lg rounded-full border border-white/5">
                <Button
                  variant={timerMode === "pomodoro" ? "default" : "ghost"}
                  onClick={() => setTimerType("pomodoro")}
                  className={cn(
                    "flex-1 rounded-full transition-colors",
                    timerMode === "pomodoro" ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-white/10"
                  )}
                >
                  Pomodoro
                </Button>
                <Button
                  variant={timerMode === "shortBreak" ? "default" : "ghost"}
                  onClick={() => setTimerType("shortBreak")}
                  className={cn(
                    "flex-1 rounded-full transition-colors",
                    timerMode === "shortBreak" ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-white/10"
                  )}
                >
                  Short Break
                </Button>
                <Button
                  variant={timerMode === "longBreak" ? "default" : "ghost"}
                  onClick={() => setTimerType("longBreak")}
                  className={cn(
                    "flex-1 rounded-full transition-colors",
                    timerMode === "longBreak" ? "bg-purple-600 hover:bg-purple-700" : "hover:bg-white/10"
                  )}
                >
                  Long Break
                </Button>
              </div>

              <div className="flex justify-center gap-4">
                {!isRunning ? (
                  <Button
                    size="lg"
                    onClick={startTimer}
                    className="bg-purple-600 hover:bg-purple-700 text-white h-16 w-16 rounded-full"
                  >
                    <Play className="w-8 h-8" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={pauseTimer}
                    className="bg-purple-600 hover:bg-purple-700 text-white h-16 w-16 rounded-full"
                  >
                    <Pause className="w-8 h-8" />
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={resetTimer}
                  className="text-gray-400 h-16 w-16 rounded-full border-white/10 hover:bg-white/5"
                >
                  <RotateCcw className="w-8 h-8" />
                </Button>
              </div>

              {/* Session Progress */}
              {isRunning && (
                <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-300">Session Progress</div>
                    <div className="text-sm text-purple-400">{Math.round(calculateMainTimerPercentage())}%</div>
                  </div>
                  <div className="w-full bg-gray-800/50 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all duration-1000"
                      style={{ width: `${calculateMainTimerPercentage()}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Streak and Goals */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-4 border border-white/5 text-center">
                  <div className="text-3xl font-bold text-purple-400">{streak}</div>
                  <div className="text-sm text-gray-300 mt-1">Day Streak</div>
                </div>
                <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-4 border border-white/5 text-center">
                  <div className="text-3xl font-bold text-purple-400">{sessionsToday}/{dailyGoal}</div>
                  <div className="text-sm text-gray-300 mt-1">Daily Goal</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Focus Insights</h2>
                <div className="text-sm text-gray-400">Today's Overview</div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#232323]/50 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-purple-400">{productivityScore}</div>
                  <div className="text-sm text-gray-300 mt-1">Focus Score</div>
                </div>
                <div className="bg-[#232323]/50 rounded-xl p-4 backdrop-blur-sm">
                  <div className="text-3xl font-bold text-purple-400">{focusTimeToday}h</div>
                  <div className="text-sm text-gray-300 mt-1">Focus Time</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="font-medium text-gray-200">Focus Time Distribution</div>
                <div className="grid grid-cols-7 gap-1 h-32">
                  {(() => {
                    const days = Array.from({ length: 7 }, (_, i) => {
                      const date = new Date()
                      date.setDate(date.getDate() - i)
                      return date.toISOString().split('T')[0]
                    }).reverse()

                    const dailyFocusTime = days.map(date => {
                      const sessionsForDay = focusSessions.filter(session => session.date === date)
                      const totalMinutes = sessionsForDay.reduce((sum, session) => sum + (session.duration || 0), 0) / 60
                      return totalMinutes
                    })

                    const maxFocusTime = Math.max(...dailyFocusTime, 120)

                    return days.map((date, i) => {
                      const height = (dailyFocusTime[i] / maxFocusTime) * 100
                      const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(date).getDay()]
                      
                      return (
                        <div key={date} className="flex flex-col justify-end">
                          <div
                            className="bg-purple-500/40 hover:bg-purple-500/60 transition-colors rounded-t relative group"
                            style={{ height: `${height}%` }}
                          >
                            <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-[#1a1a1a] text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-lg">
                              {Math.round(dailyFocusTime[i])} min
                            </div>
                          </div>
                          <div className="text-xs text-center mt-2 text-gray-400">{dayName}</div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </div>

            {/* Additional Features Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-4 border border-white/5">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Best Focus Times
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Morning</span>
                    <span className="text-purple-400">{bestMorningTime || 'Not enough data'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Evening</span>
                    <span className="text-purple-400">{bestEveningTime || 'Not enough data'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-4 border border-white/5">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Achievements
                </h3>
                <div className="text-sm text-gray-300">
                  {streak >= 3 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">🔥</span>
                      <span>{streak} Day Streak!</span>
                    </div>
                  ) : (
                    <div className="text-gray-400">Keep going to earn achievements!</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* More Options Modal */}
      {showMoreOptions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#1a1a1a]/90 rounded-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowMoreOptions(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-semibold mb-6">Timer Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timer Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={initialTime.minutes}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    setInitialTime({ ...initialTime, minutes: value })
                    setMinutes(value)
                    setEstimatedTime(value)
                    setVisualTimerDuration(value)
                  }}
                  className="w-full bg-[#232323] rounded-lg border border-white/5 px-3 py-2 text-white focus:outline-none focus:border-purple-500/30"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">Quick Presets</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 25, 45].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setInitialTime({ minutes: preset, seconds: 0 })
                        setMinutes(preset)
                        setSeconds(0)
                        setEstimatedTime(preset)
                        setVisualTimerDuration(preset)
                      }}
                      className={cn(
                        "py-2 rounded-lg text-sm font-medium transition-colors",
                        initialTime.minutes === preset
                          ? "bg-purple-600 text-white"
                          : "bg-[#232323] text-gray-300 hover:bg-white/5"
                      )}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}