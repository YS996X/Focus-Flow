"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { auth, db } from "@/lib/firebase"
import { collection, addDoc, deleteDoc, doc, query, where, getDocs, orderBy } from "firebase/firestore"
import { format, isToday, parseISO } from "date-fns"
import { Calendar as CalendarIcon, Plus, CalendarDays } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AppHeader } from "@/components/app-header"

type Event = {
  id: string
  title: string
  date: string
  time: string
  location?: string
  description?: string
  userId: string
}

export default function SchedulePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState<Omit<Event, "id" | "userId">>({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    location: "",
    description: "",
  })

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login")
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
        orderBy("date", "asc"),
        orderBy("time", "asc")
      )
      const querySnapshot = await getDocs(q)
      const fetchedEvents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Event[]
      setEvents(fetchedEvents)
    } catch (error) {
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: "Failed to fetch events. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addEvent = async () => {
    if (!auth.currentUser) return

    try {
      const eventsRef = collection(db, "events")
      await addDoc(eventsRef, {
        ...newEvent,
        userId: auth.currentUser.uid,
      })

      setNewEvent({
        title: "",
        date: format(new Date(), "yyyy-MM-dd"),
        time: "09:00",
        location: "",
        description: "",
      })
      setShowAddEvent(false)
      fetchEvents(auth.currentUser.uid)

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

  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, "events", id))
      fetchEvents(auth.currentUser?.uid || "")
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

  const getTodaysEvents = () => {
    return events.filter(event => isToday(parseISO(event.date)))
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <AppHeader />

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Events Section */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays size={24} />
              <h1 className="text-2xl font-bold">Schedule</h1>
            </div>

            <Button 
              onClick={() => setShowAddEvent(!showAddEvent)}
              className="w-full mb-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>

            {showAddEvent && (
              <div className="space-y-4 bg-gray-800/50 rounded-lg p-4 mb-6">
                <Input
                  placeholder="Event Title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="bg-gray-700/50 border-gray-600"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="bg-gray-700/50 border-gray-600"
                  />
                  <Input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    className="bg-gray-700/50 border-gray-600"
                  />
                </div>
                <Input
                  placeholder="Location (optional)"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="bg-gray-700/50 border-gray-600"
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="bg-gray-700/50 border-gray-600"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowAddEvent(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addEvent}>Save Event</Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4">Today's Events</h2>
                <div className="space-y-3">
                  {getTodaysEvents().map((event) => (
                    <div
                      key={event.id}
                      className="bg-gray-700/50 rounded-lg p-3 flex justify-between items-start"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-blue-400" />
                          <span className="font-medium">{event.title}</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {event.time}
                          {event.location && ` • ${event.location}`}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                  {getTodaysEvents().length === 0 && (
                    <p className="text-gray-400 text-center py-4">No events scheduled for today</p>
                  )}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4">All Events</h2>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="bg-gray-700/50 rounded-lg p-3 flex justify-between items-start"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-blue-400" />
                          <span className="font-medium">{event.title}</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {format(parseISO(event.date), "MMM d, yyyy")} • {event.time}
                          {event.location && ` • ${event.location}`}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-400 mt-1">{event.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEvent(event.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No events scheduled</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border border-gray-700 bg-gray-800/50"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
