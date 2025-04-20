"use client"

import { useState, useEffect } from "react"
import { ListTodo, Plus, CheckCircle2, X, ChevronDown, ChevronUp, Trash2, Calendar, Tag, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { format, isToday, isPast, addDays, parseISO } from "date-fns"
import { AppHeader } from "@/components/app-header"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, deleteDoc, doc, updateDoc, query, where, getDocs, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"

type Category = {
  id: string
  name: string
  color: string
}

type Task = {
  id: string
  title: string
  completed: boolean
  priority: "low" | "medium" | "high"
  category: string
  dueDate?: string
  subtasks: { id: string; title: string; completed: boolean }[]
  estimatedTime?: number
  userId: string
  createdAt: number
}

type Subtask = {
  id: string
  title: string
  completed: boolean
}

const defaultCategories: Category[] = [
  { id: "study", name: "Study", color: "#8B5CF6" },
  { id: "work", name: "Work", color: "#EC4899" },
  { id: "personal", name: "Personal", color: "#10B981" },
  { id: "health", name: "Health", color: "#F59E0B" }
]

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [newSubtask, setNewSubtask] = useState("")
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})
  const [categories] = useState<Category[]>(defaultCategories)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [dueDate, setDueDate] = useState<string>("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "today" | "overdue" | "upcoming">("all")
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication and fetch tasks
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
        fetchTasks(user.uid)
      } else {
        router.push("/")
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // Fetch tasks from Firebase
  const fetchTasks = async (uid: string) => {
    try {
      const q = query(
        collection(db, "tasks"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      )
      const querySnapshot = await getDocs(q)
      const fetchedTasks: Task[] = []
      querySnapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task)
      })
      setTasks(fetchedTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  // Get tasks based on filter
  const filterTasks = (tasks: Task[]) => {
    const incomplete = tasks.filter(task => !task.completed)
    
    switch (selectedFilter) {
      case "today":
        return incomplete.filter(task => task.dueDate && isToday(parseISO(task.dueDate)))
      case "overdue":
        return incomplete.filter(task => task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)))
      case "upcoming":
        return incomplete.filter(task => task.dueDate && !isPast(parseISO(task.dueDate)))
      default:
        return incomplete
    }
  }

  const incompleteTasks = filterTasks(tasks)
  const completedTasks = tasks.filter((task) => task.completed)
  const selectedTask = tasks.find((task) => task.id === selectedTaskId)

  // Calculate task progress
  const getTaskProgress = (task: Task) => {
    if (!task.subtasks?.length) return task.completed ? 100 : 0
    const completed = task.subtasks.filter(subtask => subtask.completed).length
    return Math.round((completed / task.subtasks.length) * 100)
  }

  // Task management functions
  const addTask = async () => {
    if (!newTask.trim() || !userId) return

    try {
      const task: Omit<Task, "id"> = {
        title: newTask,
        completed: false,
        priority,
        category: selectedCategory,
        dueDate: dueDate || undefined,
        subtasks: [],
        estimatedTime: 0,
        userId,
        createdAt: Date.now()
      }

      const docRef = await addDoc(collection(db, "tasks"), task)
      const newTaskWithId = { ...task, id: docRef.id }
      setTasks(prev => [newTaskWithId, ...prev])
      setNewTask("")
      setSelectedCategory("")
      setDueDate("")
    } catch (error) {
      console.error("Error adding task:", error)
    }
  }

  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      await updateDoc(doc(db, "tasks", taskId), {
        completed: !task.completed
      })

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      )
    } catch (error) {
      console.error("Error toggling task:", error)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId))
      setTasks(prev => prev.filter(task => task.id !== taskId))
      if (selectedTaskId === taskId) {
      setSelectedTaskId(null)
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const toggleExpandTask = (id: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const addSubtask = async () => {
    if (!selectedTaskId || !newSubtask.trim()) return

    try {
      const task = tasks.find(t => t.id === selectedTaskId)
      if (!task) return

      const newSubtaskObj = {
        id: Date.now().toString(),
        title: newSubtask,
        completed: false,
      }

      const updatedSubtasks = [...(task.subtasks || []), newSubtaskObj]
      
      await updateDoc(doc(db, "tasks", selectedTaskId), {
        subtasks: updatedSubtasks
      })

      setTasks(prev =>
        prev.map(task =>
          task.id === selectedTaskId
            ? { ...task, subtasks: updatedSubtasks }
            : task
        )
      )
      setNewSubtask("")
    } catch (error) {
      console.error("Error adding subtask:", error)
    }
  }

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const updatedSubtasks = task.subtasks.map(subtask =>
        subtask.id === subtaskId
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      )

      await updateDoc(doc(db, "tasks", taskId), {
        subtasks: updatedSubtasks
      })

      setTasks(prev =>
        prev.map(task =>
        task.id === taskId
            ? { ...task, subtasks: updatedSubtasks }
            : task
        )
      )
    } catch (error) {
      console.error("Error toggling subtask:", error)
    }
  }

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const updatedSubtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId)

      await updateDoc(doc(db, "tasks", taskId), {
        subtasks: updatedSubtasks
      })

      setTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? { ...task, subtasks: updatedSubtasks }
            : task
        )
      )
    } catch (error) {
      console.error("Error deleting subtask:", error)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-transparent text-white flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <AppHeader />

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tasks Section */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <ListTodo size={24} />
              <h1 className="text-2xl font-bold">Tasks</h1>
            </div>

            {/* Task Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            <Button
                variant={selectedFilter === "all" ? "default" : "ghost"}
                              size="sm"
                onClick={() => setSelectedFilter("all")}
                            >
                All
                            </Button>
                              <Button
                variant={selectedFilter === "today" ? "default" : "ghost"}
                                size="sm"
                onClick={() => setSelectedFilter("today")}
                              >
                Due Today
                              </Button>
                            <Button
                variant={selectedFilter === "overdue" ? "default" : "ghost"}
                              size="sm"
                onClick={() => setSelectedFilter("overdue")}
                            >
                Overdue
                            </Button>
                                  <Button
                variant={selectedFilter === "upcoming" ? "default" : "ghost"}
                                    size="sm"
                onClick={() => setSelectedFilter("upcoming")}
              >
                Upcoming
                                  </Button>
                                </div>

            {/* Add Task Form */}
            <div className="mb-6">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 bg-gray-800/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                            <Button
                  variant="outline"
                  onClick={addTask}
                  disabled={!newTask.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white border-none"
                >
                  Add Task
                            </Button>
            </div>

              {/* Task Options */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                  <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-gray-800/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                      </option>
                    ))}
                  </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                  className="bg-gray-800/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-gray-800/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Task Breakdown Helper */}
              <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  ADHD Task Breakdown
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Break your task into smaller, manageable steps. This helps make big tasks feel less overwhelming!
                </p>
                {selectedTask && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        placeholder="Add a small step..."
                        className="flex-1 bg-gray-800/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <Button
                        variant="outline"
                        onClick={addSubtask}
                        disabled={!newSubtask.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-none"
                      >
                        Add Step
                      </Button>
                    </div>

                    {/* Progress Bar */}
                    {selectedTask.subtasks.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{getTaskProgress(selectedTask)}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 transition-all duration-300"
                            style={{ width: `${getTaskProgress(selectedTask)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Subtasks List */}
                    <div className="space-y-2">
                      {selectedTask.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-2">
                          <input
                            type="checkbox"
                            checked={subtask.completed}
                            onChange={() => toggleSubtask(selectedTask.id, subtask.id)}
                            className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                          />
                          <span className={subtask.completed ? "line-through text-gray-500" : ""}>
                              {subtask.title}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteSubtask(selectedTask.id, subtask.id)}
                            className="ml-auto"
                            >
                            <X className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        ))}
                      </div>
                </div>
              )}
            </div>
          </div>

            <div className="space-y-3">
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg ${
                    task.category ? `border-l-4 border-${categories.find(c => c.id === task.category)?.color || 'gray'}-500` : ''
                  } bg-gray-800/50`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTask(task.id)
                        }}
                  className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                          task.completed ? "bg-green-500 border-green-500" : "border-gray-500"
                        )}
                      >
                        {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={task.completed ? "line-through text-gray-500" : ""}>
                            {task.title}
                          </span>
                          {task.category && (
                            <span 
                              className="text-xs px-2 py-1 rounded"
                              style={{ 
                                backgroundColor: categories.find(c => c.id === task.category)?.color + "33",
                                color: categories.find(c => c.id === task.category)?.color 
                              }}
                            >
                              {categories.find(c => c.id === task.category)?.name}
                            </span>
                          )}
                          <span className={cn(
                            "text-xs px-2 py-1 rounded",
                            task.priority === "high" ? "bg-red-500/20 text-red-300" :
                            task.priority === "medium" ? "bg-yellow-500/20 text-yellow-300" :
                            "bg-green-500/20 text-green-300"
                          )}>
                            {task.priority}
                          </span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                            <Calendar className="w-4 h-4" />
                            <span>{format(parseISO(task.dueDate), "MMM d, yyyy")}</span>
                            {isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && (
                              <span className="text-red-400">(Overdue)</span>
                            )}
              </div>
                        )}
                </div>
                    </div>
                    <div className="flex items-center gap-2">
                  <Button
                        variant="ghost"
                    size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpandTask(task.id)
                        }}
                      >
                        {expandedTasks[task.id] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                  </Button>
                  <Button
                        variant="ghost"
                    size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTask(task.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>

                  {/* Progress Bar */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${getTaskProgress(task)}%` }}
                        />
                </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Progress: {getTaskProgress(task)}%
                </div>
              </div>
                  )}

                  {/* Subtasks */}
                  {expandedTasks[task.id] && task.subtasks && (
                    <div className="mt-3 pl-7 space-y-2">
                      {task.subtasks.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSubtask(task.id, subtask.id)
                              }}
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                subtask.completed ? "bg-green-500 border-green-500" : "border-gray-500"
                              )}
                            >
                              {subtask.completed && (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              )}
                            </button>
                            <span
                              className={subtask.completed ? "line-through text-gray-500" : ""}
                            >
                              {subtask.title}
                            </span>
                </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSubtask(task.id, subtask.id)
                            }}
                          >
                            <X className="w-4 h-4 text-red-400" />
                </Button>
              </div>
                      ))}
              </div>
                  )}
              </div>
              ))}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <CheckCircle2 size={24} />
              <h1 className="text-2xl font-bold">Completed</h1>
        </div>

            <div className="space-y-3">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-800/30 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="w-5 h-5 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </button>
                  <div>
                      <span className="line-through text-gray-500">{task.title}</span>
                      {task.category && (
                        <span 
                          className="ml-2 text-xs px-2 py-1 rounded opacity-50"
                          style={{ 
                            backgroundColor: categories.find(c => c.id === task.category)?.color + "33",
                            color: categories.find(c => c.id === task.category)?.color 
                          }}
                        >
                          {categories.find(c => c.id === task.category)?.name}
                        </span>
                      )}
                  </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
              ))}
              {completedTasks.length === 0 && (
                <div className="text-center py-8 bg-gray-800/30 rounded-lg">
                  <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-gray-400">No completed tasks</p>
            </div>
              )}
          </div>
          </div>
        </div>
      </main>
    </div>
  )
}
