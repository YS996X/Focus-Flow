"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore"
import { format, isToday, parseISO, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, Plus, Clock, X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppHeader } from "@/components/app-header"
import WallpaperProvider from "@/components/wallpaper-provider"

type Event = {
  id: string
  title: string
  date: string
  time: string
  description?: string
  userId: string
  timestamp: Timestamp
}

export default function SchedulePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    time: "",
    description: ""
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/")
        return
      }
      fetchEvents(user.uid)
    })

    return () => unsubscribe()
  }, [router])

  const fetchEvents = async (userId: string) => {
    try {
      const eventsRef = collection(db, "events")
      const q = query(
        eventsRef,
        where("userId", "==", userId),
        orderBy("timestamp", "desc")
      )
      const querySnapshot = await getDocs(q)
      const fetchedEvents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Event[]
      setEvents(fetchedEvents)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const addEvent = async () => {
    if (!auth.currentUser || !newEvent.title || !newEvent.time) return

    try {
      const eventData = {
        title: newEvent.title,
        date: format(date, "yyyy-MM-dd"),
        time: newEvent.time,
        description: newEvent.description,
        userId: auth.currentUser.uid,
        timestamp: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, "events"), eventData)
      
      setEvents(prev => [{
        id: docRef.id,
        ...eventData
      } as Event, ...prev])

      setNewEvent({
        title: "",
        time: "",
        description: ""
      })
      setShowAddEvent(false)

      toast({
        title: "Success",
        description: "Event added successfully",
      })
    } catch (error) {
      console.error("Error adding event:", error)
      toast({
        title: "Error",
        description: "Failed to add event. Please try again.",
        variant: "destructive",
      })
    }
  }

  const deleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "events", eventId))
      setEvents(prev => prev.filter(event => event.id !== eventId))
      
      toast({
        title: "Success",
        description: "Event deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getDayEvents = (targetDate: Date) => {
    return events.filter(event => 
      isSameDay(parseISO(event.date), targetDate)
    ).sort((a, b) => a.time.localeCompare(b.time))
  }

  const formatEventTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(":")
      return new Date(0, 0, 0, parseInt(hours), parseInt(minutes))
        .toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch {
      return time
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 border-4 border-t-purple-500 border-white/20 rounded-full animate-spin mx-auto" />
          <div className="text-gray-400">Loading your schedule...</div>
        </div>
      </div>
    )
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

        <div className="relative z-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon size={24} className="text-purple-400" />
              <h1 className="text-2xl font-semibold">Schedule</h1>
            </div>
            <Button
              variant="outline"
              className="bg-[#232323]/50 border-white/5 hover:bg-white/5"
              onClick={() => setShowAddEvent(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Event
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Calendar */}
            <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                className="rounded-md border-white/5"
                classNames={{
                  day_selected: "bg-purple-600 text-white hover:bg-purple-700",
                  day_today: "bg-white/5 text-white",
                }}
                modifiers={{
                  booked: events.map(event => parseISO(event.date))
                }}
                modifiersStyles={{
                  booked: {
                    border: '2px solid rgba(139, 92, 246, 0.5)',
                    borderRadius: '4px'
                  }
                }}
              />
            </div>

            {/* Events List */}
            <div className="space-y-6">
              {/* Today's Events */}
              <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
                <h2 className="text-xl font-semibold mb-4">Today's Events</h2>
                <div className="space-y-4">
                  {getDayEvents(new Date()).length > 0 ? (
                    getDayEvents(new Date()).map(event => (
                      <div
                        key={event.id}
                        className="group bg-[#232323]/50 backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:border-purple-500/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center flex-shrink-0">
                            <Clock size={16} className="text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-sm text-purple-400">{formatEventTime(event.time)}</div>
                            </div>
                            {event.description && (
                              <div className="text-sm text-gray-400 mt-1 line-clamp-2">{event.description}</div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock size={32} className="mx-auto mb-3 text-gray-500" />
                      <p className="text-gray-400">No events scheduled for today</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Day Events */}
              {!isSameDay(date, new Date()) && (
                <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span>Events for {format(date, "MMMM d")}</span>
                    <ChevronRight size={20} className="text-gray-500" />
                  </h2>
                  <div className="space-y-4">
                    {getDayEvents(date).length > 0 ? (
                      getDayEvents(date).map(event => (
                        <div
                          key={event.id}
                          className="group bg-[#232323]/50 backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:border-purple-500/30 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-600/30 flex items-center justify-center flex-shrink-0">
                              <Clock size={16} className="text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-medium truncate">{event.title}</div>
                                <div className="text-sm text-purple-400">{formatEventTime(event.time)}</div>
                              </div>
                              {event.description && (
                                <div className="text-sm text-gray-400 mt-1 line-clamp-2">{event.description}</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                              onClick={() => deleteEvent(event.id)}
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Clock size={32} className="mx-auto mb-3 text-gray-500" />
                        <p className="text-gray-400">No events scheduled for this day</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add Event Modal */}
          {showAddEvent && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-[#1a1a1a] rounded-xl p-6 w-full max-w-md border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">Add New Event</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      For {format(date, "MMMM d, yyyy")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white"
                    onClick={() => setShowAddEvent(false)}
                  >
                    <X size={16} />
                  </Button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Title</label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="w-full bg-[#232323] rounded-lg border border-white/5 px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/30 transition-colors"
                      placeholder="Enter event title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time</label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      className="w-full bg-[#232323] rounded-lg border border-white/5 px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/30 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="w-full bg-[#232323] rounded-lg border border-white/5 px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/30 transition-colors h-24 resize-none"
                      placeholder="Add event details..."
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="bg-[#232323]/50 border-white/5 hover:bg-white/5"
                      onClick={() => setShowAddEvent(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={addEvent}
                      disabled={!newEvent.title || !newEvent.time}
                    >
                      Add Event
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
