"use client"

import { useState, useEffect } from "react"
import { ListTodo, Plus, CheckCircle2, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

type Task = {
  id: string
  title: string
  completed: boolean
  priority: "low" | "medium" | "high"
  createdAt: string
  subtasks?: Subtask[]
}

type Subtask = {
  id: string
  title: string
  completed: boolean
}

type Mood = "great" | "good" | "okay" | "bad" | "terrible"
type MoodTag = "lowEnergy" | "highEnergy" | "brainFog" | "hyperfocus"

export default function TasksPage() {
  const router = useRouter()

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"

    // Redirect to login if not logged in
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  // Task state
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Complete math homework",
      completed: false,
      priority: "high",
      createdAt: new Date().toISOString(),
      subtasks: [
        { id: "1-1", title: "Review chapter 5", completed: true },
        { id: "1-2", title: "Solve practice problems", completed: false },
      ],
    },
    {
      id: "2",
      title: "Read chapter 5 of textbook",
      completed: false,
      priority: "medium",
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Prepare for presentation",
      completed: true,
      priority: "high",
      createdAt: new Date().toISOString(),
    },
  ])

  const [newTask, setNewTask] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [newSubtask, setNewSubtask] = useState("")
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  // Mood tracking state
  const [currentMood, setCurrentMood] = useState<Mood>("okay")
  const [moodMessage, setMoodMessage] = useState("You're doing your best. Breathe.")
  const [selectedMoodTags, setSelectedMoodTags] = useState<MoodTag[]>([])

  // Study companion state
  const [companionLevel, setCompanionLevel] = useState(1)
  const [companionProgress, setCompanionProgress] = useState(25)
  const [companionName, setCompanionName] = useState("Seedling")

  // Settings state
  const [notificationSettings, setNotificationSettings] = useState({
    taskReminders: true,
    focusMode: true,
    breakReminders: true,
    celebrationAnimations: true,
  })

  // Accessibility settings
  const [accessibilitySettings, setAccessibilitySettings] = useState({
    fontSize: "Medium",
    reducedMotion: false,
    highContrast: false,
    colorTheme: "Purple",
    simplifiedUI: false,
    dyslexiaFont: false,
    taskComplexity: "Balanced",
    extraReminders: true,
    focusMode: true,
  })

  // Get incomplete tasks
  const incompleteTasks = tasks.filter((task) => !task.completed)
  // Get completed tasks
  const completedTasks = tasks.filter((task) => task.completed)
  // Get selected task
  const selectedTask = tasks.find((task) => task.id === selectedTaskId)

  // Task management functions
  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now().toString(),
        title: newTask,
        completed: false,
        priority,
        createdAt: new Date().toISOString(),
        subtasks: [],
      }
      setTasks([...tasks, task])
      setNewTask("")

      // Update companion progress
      setCompanionProgress((prev) => Math.min(prev + 5, 100))
      if (companionProgress + 5 >= 100) {
        setCompanionLevel((prev) => prev + 1)
        setCompanionProgress(0)
        setCompanionName(getCompanionName(companionLevel + 1))
      }
    }
  }

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const newCompletedState = !task.completed

          // Update companion progress when completing a task
          if (newCompletedState) {
            setCompanionProgress((prev) => Math.min(prev + 10, 100))
            if (companionProgress + 10 >= 100) {
              setCompanionLevel((prev) => prev + 1)
              setCompanionProgress(0)
              setCompanionName(getCompanionName(companionLevel + 1))
            }
          }

          return { ...task, completed: newCompletedState }
        }
        return task
      }),
    )
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
    if (selectedTaskId === id) {
      setSelectedTaskId(null)
    }
  }

  const toggleExpandTask = (id: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // Subtask management
  const addSubtask = () => {
    if (selectedTaskId && newSubtask.trim()) {
      const subtask: Subtask = {
        id: Date.now().toString(),
        title: newSubtask,
        completed: false,
      }

      setTasks(
        tasks.map((task) =>
          task.id === selectedTaskId
            ? {
                ...task,
                subtasks: [...(task.subtasks || []), subtask],
              }
            : task,
        ),
      )

      setNewSubtask("")
    }
  }

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks?.map((subtask) =>
                subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask,
              ),
            }
          : task,
      ),
    )
  }

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subtasks: task.subtasks?.filter((subtask) => subtask.id !== subtaskId),
            }
          : task,
      ),
    )
  }

  // Mood tracking functions
  const setMood = (mood: Mood) => {
    setCurrentMood(mood)
    switch (mood) {
      case "great":
        setMoodMessage("Awesome! Keep up the great energy!")
        break
      case "good":
        setMoodMessage("You're doing well today!")
        break
      case "okay":
        setMoodMessage("You're doing your best. Breathe.")
        break
      case "bad":
        setMoodMessage("It's okay to have off days. Take care of yourself.")
        break
      case "terrible":
        setMoodMessage("Remember to be kind to yourself. Tomorrow is a new day.")
        break
    }
  }

  const toggleMoodTag = (tag: MoodTag) => {
    if (selectedMoodTags.includes(tag)) {
      setSelectedMoodTags(selectedMoodTags.filter((t) => t !== tag))
    } else {
      setSelectedMoodTags([...selectedMoodTags, tag])
    }
  }

  // Settings functions
  const toggleNotificationSetting = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    })
  }

  const updateAccessibilitySetting = (setting: keyof typeof accessibilitySettings, value: any) => {
    setAccessibilitySettings({
      ...accessibilitySettings,
      [setting]: value,
    })
  }

  // Helper functions
  const getCompanionName = (level: number) => {
    const names = ["Seedling", "Sprout", "Sapling", "Young Tree", "Mighty Oak"]
    return names[Math.min(level - 1, names.length - 1)]
  }

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem("focusflow-tasks", JSON.stringify(tasks))
  }, [tasks])

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("focusflow-tasks")
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks))
      } catch (e) {
        console.error("Failed to parse saved tasks", e)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/home" className="text-2xl font-bold tracking-tight">
            FOCUS FLOW
          </Link>
        </div>
        <Link href="/home">
          <Button variant="ghost" size="sm">
            Back to Home
          </Button>
        </Link>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tasks Section */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <ListTodo size={24} />
              <h1 className="text-2xl font-bold">Tasks & Mood</h1>
            </div>

            <p className="text-gray-400 mb-4">Track your progress and wellbeing</p>

            {/* Add Task Form */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                className="flex-1 p-2 bg-gray-800/70 rounded-md focus:outline-none border border-gray-700"
                placeholder="Enter a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <div className="relative">
                <select
                  className="h-full px-3 py-2 bg-gray-800/70 rounded-md focus:outline-none border border-gray-700 appearance-none pr-8"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={12} />
                </div>
              </div>
              <Button onClick={addTask}>
                <Plus size={16} />
              </Button>
            </div>

            {/* Task List */}
            <div className="space-y-1 mb-6">
              <h2 className="text-lg font-medium mb-2">Your Tasks</h2>

              {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
                <div className="text-center py-6 bg-gray-800/30 rounded-lg">
                  <ListTodo size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-gray-400">No tasks yet. Add one above!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {incompleteTasks.length > 0 && (
                    <div className="space-y-2">
                      {incompleteTasks.map((task) => (
                        <div key={task.id}>
                          <div
                            className={cn(
                              "flex items-center gap-2 p-3 rounded-lg",
                              task.priority === "high"
                                ? "bg-red-900/20"
                                : task.priority === "medium"
                                  ? "bg-yellow-900/20"
                                  : "bg-blue-900/20",
                            )}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={() => toggleTask(task.id)}
                            >
                              <div className="h-5 w-5 rounded-full border border-gray-500"></div>
                            </Button>
                            <span className="flex-1">{task.title}</span>

                            {task.subtasks && task.subtasks.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                                onClick={() => toggleExpandTask(task.id)}
                              >
                                {expandedTasks[task.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>

                          {/* Subtasks */}
                          {task.subtasks && task.subtasks.length > 0 && expandedTasks[task.id] && (
                            <div className="ml-8 mt-1 space-y-1">
                              {task.subtasks.map((subtask) => (
                                <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-800/30">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 rounded-full"
                                    onClick={() => toggleSubtask(task.id, subtask.id)}
                                  >
                                    {subtask.completed ? (
                                      <CheckCircle2 size={16} className="text-green-500" />
                                    ) : (
                                      <div className="h-4 w-4 rounded-full border border-gray-500"></div>
                                    )}
                                  </Button>
                                  <span
                                    className={cn("flex-1 text-sm", subtask.completed && "line-through text-gray-400")}
                                  >
                                    {subtask.title}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                    onClick={() => deleteSubtask(task.id, subtask.id)}
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {completedTasks.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2">Completed</h3>
                      <div className="space-y-2">
                        {completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center gap-2 p-3 bg-gray-800/30 rounded-lg opacity-70"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 rounded-full text-green-500"
                              onClick={() => toggleTask(task.id)}
                            >
                              <CheckCircle2 size={18} />
                            </Button>
                            <span className="flex-1 line-through">{task.title}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Task Breakdown Feature */}
            <div className="mt-6 bg-gray-800/30 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">Task Breakdown</h3>
              <p className="text-sm text-gray-400 mb-3">Break down complex tasks into smaller, manageable steps</p>

              {incompleteTasks.length > 0 ? (
                <div className="space-y-3">
                  <select
                    className="w-full p-2 bg-gray-800/70 rounded-md focus:outline-none border border-gray-700"
                    value={selectedTaskId || ""}
                    onChange={(e) => setSelectedTaskId(e.target.value || null)}
                  >
                    <option value="" disabled>
                      Select a task to break down...
                    </option>
                    {incompleteTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>

                  <div className="space-y-2 mt-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 p-2 bg-gray-800/70 rounded-md focus:outline-none border border-gray-700"
                        placeholder="Add a subtask..."
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                        disabled={!selectedTaskId}
                      />
                      <Button size="sm" onClick={addSubtask} disabled={!selectedTaskId}>
                        Add
                      </Button>
                    </div>

                    {selectedTask && selectedTask.subtasks && selectedTask.subtasks.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {selectedTask.subtasks.map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/30">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 rounded-full"
                              onClick={() => toggleSubtask(selectedTask.id, subtask.id)}
                            >
                              {subtask.completed ? (
                                <CheckCircle2 size={16} className="text-green-500" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-gray-500"></div>
                              )}
                            </Button>
                            <span className={cn("flex-1 text-sm", subtask.completed && "line-through text-gray-400")}>
                              {subtask.title}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              onClick={() => deleteSubtask(selectedTask.id, subtask.id)}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : selectedTaskId ? (
                      <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                        <p className="text-sm text-gray-400">No subtasks yet. Add one above.</p>
                      </div>
                    ) : (
                      <div className="bg-gray-700/30 rounded-lg p-3 text-center">
                        <p className="text-sm text-gray-400">Select a task to add subtasks</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-gray-400">Add tasks first to break them down</p>
                </div>
              )}
            </div>
          </div>

          {/* Mood Tracker */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-4">How are you feeling?</h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <Button
                  variant={currentMood === "great" ? "default" : "outline"}
                  className={cn(
                    "flex flex-col items-center p-3 h-auto",
                    currentMood === "great" ? "bg-yellow-600 hover:bg-yellow-700" : "",
                  )}
                  onClick={() => setMood("great")}
                >
                  <span className="text-2xl mb-1">😄</span>
                  <span className="text-xs">Great</span>
                </Button>

                <Button
                  variant={currentMood === "good" ? "default" : "outline"}
                  className={cn(
                    "flex flex-col items-center p-3 h-auto",
                    currentMood === "good" ? "bg-green-600 hover:bg-green-700" : "",
                  )}
                  onClick={() => setMood("good")}
                >
                  <span className="text-2xl mb-1">🙂</span>
                  <span className="text-xs">Good</span>
                </Button>

                <Button
                  variant={currentMood === "okay" ? "default" : "outline"}
                  className={cn(
                    "flex flex-col items-center p-3 h-auto",
                    currentMood === "okay" ? "bg-purple-600 hover:bg-purple-700" : "",
                  )}
                  onClick={() => setMood("okay")}
                >
                  <span className="text-2xl mb-1">😐</span>
                  <span className="text-xs">Okay</span>
                </Button>

                <Button
                  variant={currentMood === "bad" ? "default" : "outline"}
                  className={cn(
                    "flex flex-col items-center p-3 h-auto",
                    currentMood === "bad" ? "bg-blue-600 hover:bg-blue-700" : "",
                  )}
                  onClick={() => setMood("bad")}
                >
                  <span className="text-2xl mb-1">😔</span>
                  <span className="text-xs">Bad</span>
                </Button>

                <Button
                  variant={currentMood === "terrible" ? "default" : "outline"}
                  className={cn(
                    "flex flex-col items-center p-3 h-auto",
                    currentMood === "terrible" ? "bg-red-600 hover:bg-red-700" : "",
                  )}
                  onClick={() => setMood("terrible")}
                >
                  <span className="text-2xl mb-1">😞</span>
                  <span className="text-xs">Terrible</span>
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={selectedMoodTags.includes("lowEnergy") ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex items-center justify-center gap-2",
                      selectedMoodTags.includes("lowEnergy") ? "bg-blue-600/70" : "bg-opacity-20 hover:bg-opacity-30",
                    )}
                    onClick={() => toggleMoodTag("lowEnergy")}
                  >
                    <span>🔋</span> Low Energy
                  </Button>
                  <Button
                    variant={selectedMoodTags.includes("highEnergy") ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex items-center justify-center gap-2",
                      selectedMoodTags.includes("highEnergy")
                        ? "bg-yellow-600/70"
                        : "bg-opacity-20 hover:bg-opacity-30",
                    )}
                    onClick={() => toggleMoodTag("highEnergy")}
                  >
                    <span>⚡</span> High Energy
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={selectedMoodTags.includes("brainFog") ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex items-center justify-center gap-2",
                      selectedMoodTags.includes("brainFog") ? "bg-gray-600/70" : "bg-opacity-20 hover:bg-opacity-30",
                    )}
                    onClick={() => toggleMoodTag("brainFog")}
                  >
                    <span>🧠</span> Brain Fog
                  </Button>
                  <Button
                    variant={selectedMoodTags.includes("hyperfocus") ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex items-center justify-center gap-2",
                      selectedMoodTags.includes("hyperfocus")
                        ? "bg-purple-600/70"
                        : "bg-opacity-20 hover:bg-opacity-30",
                    )}
                    onClick={() => toggleMoodTag("hyperfocus")}
                  >
                    <span>🎯</span> Hyperfocus
                  </Button>
                </div>
              </div>

              <div className="text-center p-4 bg-gray-800/30 rounded-lg mt-4">
                <p>{moodMessage}</p>
              </div>
            </div>

            {/* Study Companion */}
            <div className="mt-8">
              <h2 className="text-lg font-medium mb-4">Study Companion</h2>
              <div className="bg-gray-800/30 rounded-lg p-4 text-center">
                <div className="mb-4">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto"
                  >
                    <path
                      d="M24 12C24 12 28 18 28 24C28 30 24 36 24 36"
                      stroke="#BBFF00"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M24 12C24 12 20 18 20 24C20 30 24 36 24 36"
                      stroke="#BBFF00"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="24" cy="38" r="4" fill="#FF6B00" />
                  </svg>
                </div>
                <p className="text-sm mb-2">
                  Level {companionLevel}: {companionName}
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-300 h-2 rounded-full"
                    style={{ width: `${companionProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">Complete tasks and focus sessions to help your buddy grow!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gamification & Rewards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Achievement System
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-purple-600/50 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-lg">🔥</span>
                  </div>
                  <div>
                    <div className="font-medium">3-Day Streak</div>
                    <div className="text-xs text-gray-400">Complete at least one task for 3 days in a row</div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-600/50 flex items-center justify-center text-xs">2/3</div>
              </div>

              <div className="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-blue-600/50 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-lg">⚡</span>
                  </div>
                  <div>
                    <div className="font-medium">Focus Master</div>
                    <div className="text-xs text-gray-400">Complete 5 Pomodoro sessions in one day</div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-600/50 flex items-center justify-center text-xs">2/5</div>
              </div>

              <div className="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-green-600/50 h-10 w-10 rounded-full flex items-center justify-center mr-3">
                    <span className="text-lg">✅</span>
                  </div>
                  <div>
                    <div className="font-medium">Task Champion</div>
                    <div className="text-xs text-gray-400">Complete 10 high-priority tasks</div>
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-600/50 flex items-center justify-center text-xs">4/10</div>
              </div>
            </div>
          </div>

          {/* Smart Suggestions */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Smart Suggestions
            </h3>

            <div className="space-y-3">
              <div className="bg-purple-600/20 border border-purple-600/30 p-3 rounded-lg">
                <div className="font-medium mb-1">Task Suggestion</div>
                <p className="text-sm text-gray-300 mb-2">
                  Based on your schedule, now would be a good time to work on:
                </p>
                <div className="bg-gray-700/50 p-2 rounded-lg flex justify-between items-center">
                  <span>Complete math homework</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Start Now
                  </Button>
                </div>
              </div>

              <div className="bg-blue-600/20 border border-blue-600/30 p-3 rounded-lg">
                <div className="font-medium mb-1">Focus Tip</div>
                <p className="text-sm text-gray-300">
                  You tend to focus better after taking a short walk. Consider a 5-minute movement break before your
                  next study session.
                </p>
              </div>

              <div className="bg-green-600/20 border border-green-600/30 p-3 rounded-lg">
                <div className="font-medium mb-1">Schedule Optimization</div>
                <p className="text-sm text-gray-300 mb-2">
                  Your most productive hours are in the morning. Consider scheduling high-priority tasks then.
                </p>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Optimize My Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Management & Study Resources */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              Notification Settings
            </h3>

            <div className="space-y-3">
              <div className="bg-gray-700/30 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-medium">Task Reminders</div>
                  <div className="text-xs text-gray-400">Get reminded of upcoming tasks</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationSettings.taskReminders}
                    onChange={() => toggleNotificationSetting("taskReminders")}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-medium">Focus Mode</div>
                  <div className="text-xs text-gray-400">Block distracting notifications during focus sessions</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationSettings.focusMode}
                    onChange={() => toggleNotificationSetting("focusMode")}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-medium">Break Reminders</div>
                  <div className="text-xs text-gray-400">Remind you to take breaks during long study sessions</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationSettings.breakReminders}
                    onChange={() => toggleNotificationSetting("breakReminders")}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-medium">Celebration Animations</div>
                  <div className="text-xs text-gray-400">Show animations when completing tasks</div>
                </div>
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={notificationSettings.celebrationAnimations}
                    onChange={() => toggleNotificationSetting("celebrationAnimations")}
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              ADHD Learning Resources
            </h3>

            <div className="space-y-3">
              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="font-medium mb-1">Study Techniques for ADHD</div>
                <p className="text-sm text-gray-300 mb-2">Learn strategies specifically designed for ADHD brains</p>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  View Resources
                </Button>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="font-medium mb-1">Understanding Executive Function</div>
                <p className="text-sm text-gray-300 mb-2">
                  Learn how ADHD affects planning, organization, and task completion
                </p>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Read Article
                </Button>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg">
                <div className="font-medium mb-1">Video: Motivation & ADHD</div>
                <p className="text-sm text-gray-300 mb-2">
                  Why traditional motivation techniques often don't work with ADHD
                </p>
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Watch Video
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Integrations & Accessibility */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 22v-5" />
                <path d="M9 8V2" />
                <path d="M15 8V2" />
                <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
                <path d="M19 8a7 7 0 1 0-14 0" />
              </svg>
              Integrations
            </h3>

            <div className="space-y-3">
              <div className="bg-gray-700/30 p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-blue-600/30 h-10 w-10 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Google Calendar</div>
                    <div className="text-xs text-gray-400">Sync your schedule</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  Connect
                </Button>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-purple-600/30 h-10 w-10 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Google Drive</div>
                    <div className="text-xs text-gray-400">Access your study materials</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  Connect
                </Button>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-green-600/30 h-10 w-10 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium">Discord</div>
                    <div className="text-xs text-gray-400">Join study communities</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs">
                  Connect
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Accessibility & Personalization
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/30 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Text & Display</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Font Size</span>
                    <select
                      className="bg-gray-600 rounded-md text-xs p-1 border-none focus:outline-none"
                      value={accessibilitySettings.fontSize}
                      onChange={(e) => updateAccessibilitySetting("fontSize", e.target.value)}
                    >
                      <option value="Small">Small</option>
                      <option value="Medium">Medium</option>
                      <option value="Large">Large</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Reduced Motion</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={accessibilitySettings.reducedMotion}
                        onChange={() =>
                          updateAccessibilitySetting("reducedMotion", !accessibilitySettings.reducedMotion)
                        }
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">High Contrast</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={accessibilitySettings.highContrast}
                        onChange={() => updateAccessibilitySetting("highContrast", !accessibilitySettings.highContrast)}
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Interface Style</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Color Theme</span>
                    <select
                      className="bg-gray-600 rounded-md text-xs p-1 border-none focus:outline-none"
                      value={accessibilitySettings.colorTheme}
                      onChange={(e) => updateAccessibilitySetting("colorTheme", e.target.value)}
                    >
                      <option value="Purple">Purple</option>
                      <option value="Blue">Blue</option>
                      <option value="Green">Green</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Simplified UI</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={accessibilitySettings.simplifiedUI}
                        onChange={() => updateAccessibilitySetting("simplifiedUI", !accessibilitySettings.simplifiedUI)}
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Dyslexia Font</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={accessibilitySettings.dyslexiaFont}
                        onChange={() => updateAccessibilitySetting("dyslexiaFont", !accessibilitySettings.dyslexiaFont)}
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/30 p-3 rounded-lg">
                <h4 className="font-medium mb-2">ADHD Support</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Task Complexity</span>
                    <select
                      className="bg-gray-600 rounded-md text-xs p-1 border-none focus:outline-none"
                      value={accessibilitySettings.taskComplexity}
                      onChange={(e) => updateAccessibilitySetting("taskComplexity", e.target.value)}
                    >
                      <option value="Simple">Simple</option>
                      <option value="Balanced">Balanced</option>
                      <option value="Detailed">Detailed</option>
                    </select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Extra Reminders</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={accessibilitySettings.extraReminders}
                        onChange={() =>
                          updateAccessibilitySetting("extraReminders", !accessibilitySettings.extraReminders)
                        }
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Focus Mode</span>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={accessibilitySettings.focusMode}
                        onChange={() => updateAccessibilitySetting("focusMode", !accessibilitySettings.focusMode)}
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
