"use client"

import { useState, useEffect } from "react"
import { ListTodo, Plus, CheckCircle2, X, ChevronDown, ChevronUp, Trash2, Calendar, Tag, Sparkles, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { format, isToday, isPast, addDays, parseISO } from "date-fns"
import { AppHeader } from "@/components/app-header"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, deleteDoc, doc, updateDoc, query, where, getDocs, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import WallpaperProvider from "@/components/wallpaper-provider"

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
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [dueDate, setDueDate] = useState<string>("")
  const [selectedFilter, setSelectedFilter] = useState<"all" | "today" | "overdue" | "upcoming">("all")
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)

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

  const deleteCategory = async (categoryId: string) => {
    if (!userId) return
    
    try {
      await deleteDoc(doc(db, "categories", categoryId))
      setCategories(categories.filter(c => c.id !== categoryId))
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Failed to delete category. Please try again.")
    }
  }

  // Update the due today count to handle undefined dates
  const dueTodayCount = incompleteTasks.filter(t => {
    if (!t.dueDate) return false
    return isToday(parseISO(t.dueDate))
  }).length

  if (loading) {
    return <div className="min-h-screen bg-transparent text-white flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <WallpaperProvider />
      <AppHeader />

      <main className="flex-1 px-8 py-8 relative overflow-hidden">
        {/* Background overlays - matching home page style */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1526]/80 via-[#0a1526]/70 to-[#0a1526]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-radial from-[#995c1d]/10 via-transparent to-transparent opacity-40" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_30px_rgba(0,0,0,0.8)] pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Tasks Section */}
          <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ListTodo size={24} className="text-purple-400" />
                <h1 className="text-2xl font-semibold">Tasks</h1>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTask(true)}
                className="border-white/10 hover:bg-white/5"
              >
                Add Task
              </Button>
            </div>

            {/* Task Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            <Button
                variant={selectedFilter === "all" ? "default" : "ghost"}
                              size="sm"
                onClick={() => setSelectedFilter("all")}
                className={cn(
                  "rounded-full transition-colors",
                  selectedFilter === "all" 
                    ? "bg-purple-600 hover:bg-purple-700" 
                    : "hover:bg-white/10"
                )}
                            >
                All
                            </Button>
                              <Button
                variant={selectedFilter === "today" ? "default" : "ghost"}
                                size="sm"
                onClick={() => setSelectedFilter("today")}
                className={cn(
                  "rounded-full transition-colors",
                  selectedFilter === "today" 
                    ? "bg-purple-600 hover:bg-purple-700" 
                    : "hover:bg-white/10"
                )}
                              >
                Due Today
                              </Button>
                            <Button
                variant={selectedFilter === "overdue" ? "default" : "ghost"}
                              size="sm"
                onClick={() => setSelectedFilter("overdue")}
                className={cn(
                  "rounded-full transition-colors",
                  selectedFilter === "overdue" 
                    ? "bg-purple-600 hover:bg-purple-700" 
                    : "hover:bg-white/10"
                )}
                            >
                Overdue
                            </Button>
                                  <Button
                variant={selectedFilter === "upcoming" ? "default" : "ghost"}
                                    size="sm"
                onClick={() => setSelectedFilter("upcoming")}
                className={cn(
                  "rounded-full transition-colors",
                  selectedFilter === "upcoming" 
                    ? "bg-purple-600 hover:bg-purple-700" 
                    : "hover:bg-white/10"
                )}
              >
                Upcoming
                                  </Button>
                                </div>

            {/* Task List */}
            <div className="space-y-3">
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-[#232323]/50 backdrop-blur-sm rounded-xl p-4 border border-white/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                  className={cn(
                          "h-5 w-5 rounded-full border",
                          task.completed 
                            ? "bg-purple-600 border-purple-600" 
                            : "border-white/20 hover:border-purple-500/50"
                        )}
                        onClick={() => toggleTask(task.id)}
                      >
                        {task.completed && <Check size={12} />}
                      </Button>
                    </div>
                      <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          task.completed ? "line-through text-gray-500" : "text-gray-100"
                        )}>
                            {task.title}
                          </span>
                          {task.category && (
                            <span 
                            className="text-xs px-2 py-1 rounded-full"
                              style={{ 
                                backgroundColor: categories.find(c => c.id === task.category)?.color + "33",
                                color: categories.find(c => c.id === task.category)?.color 
                              }}
                            >
                              {categories.find(c => c.id === task.category)?.name}
                            </span>
                          )}
                          <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                            task.priority === "high" ? "bg-red-500/20 text-red-300" :
                            task.priority === "medium" ? "bg-yellow-500/20 text-yellow-300" :
                            "bg-green-500/20 text-green-300"
                          )}>
                            {task.priority}
                          </span>
                        </div>
                        {task.dueDate && (
                        <div className="flex items-center gap-1 text-sm text-gray-400 mt-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(parseISO(task.dueDate), "MMM d, yyyy")}</span>
                            {isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) && (
                              <span className="text-red-400">(Overdue)</span>
                            )}
              </div>
                        )}
                </div>
                  <Button
                        variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-400 transition-colors"
                      onClick={() => deleteTask(task.id)}
                    >
                      <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              ))}

              {incompleteTasks.length === 0 && (
                <div className="text-center py-8">
                  <ListTodo size={48} className="mx-auto mb-4 text-purple-400/60" />
                  <p className="text-gray-400">No tasks found. Add some tasks to get started!</p>
                </div>
              )}
            </div>
          </div>

          {/* Categories Section */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Tag size={24} className="text-purple-400" />
                  <h2 className="text-xl font-semibold">Categories</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCategory(true)}
                  className="border-white/10 hover:bg-white/5"
                >
                  Add Category
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-[#232323]/50 backdrop-blur-sm rounded-xl p-4 border border-white/5"
                    style={{ borderColor: category.color + "33" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                </div>
                          <Button
                            variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-400 transition-colors"
                        onClick={() => deleteCategory(category.id)}
                      >
                        <Trash2 size={16} />
                </Button>
              </div>
              </div>
              ))}
            </div>
          </div>

            {/* Task Stats */}
            <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-6">Task Overview</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#232323]/50 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-3xl font-bold text-purple-400">
                    {Math.round((completedTasks.length / (incompleteTasks.length + completedTasks.length)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-300 mt-1">Completion Rate</div>
                </div>
                <div className="bg-[#232323]/50 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-3xl font-bold text-purple-400">
                    {dueTodayCount}
                  </div>
                  <div className="text-sm text-gray-300 mt-1">Due Today</div>
                </div>
              </div>
          </div>
          </div>
        </div>
      </main>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
            {/* ... existing modal content ... */}
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-semibold mb-4">Add New Category</h2>
            {/* ... existing modal content ... */}
          </div>
        </div>
      )}
    </div>
  )
}
