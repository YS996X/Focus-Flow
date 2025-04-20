"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

type Event = {
  id: string
  title: string
  date: string
  time: string
  location?: string
  description?: string
}

export default function SchedulePage() {
  const router = useRouter()

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"

    // Redirect to login if not logged in
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  const [events, setEvents] = useState<Event[]>([
    {
      id: "1",
      title: "English Presentation",
      date: new Date().toISOString().split("T")[0],
      time: "09:00",
      location: "Main Auditorium",
      description: "Present research findings to the class",
    },
    {
      id: "2",
      title: "Biology Lab Report Due",
      date: new Date().toISOString().split("T")[0],
      time: "13:00",
      location: "Submit online",
      description: "Final report on experiment results",
    },
    {
      id: "3",
      title: "Math Study Group",
      date: new Date().toISOString().split("T")[0],
      time: "16:30",
      location: "Library, Room 204",
      description: "Prepare for upcoming calculus exam",
    },
    {
      id: "4",
      title: "Project Meeting",
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0], // Tomorrow
      time: "10:00",
      location: "Zoom Call",
      description: "Weekly team sync",
    },
  ])

  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState<Omit<Event, "id">>({
    title: "",
    date: "",
    time: "",
    location: "",
    description: "",
  })
  const [today, setToday] = useState("")

  useEffect(() => {
    const date = new Date()
    const formattedDate = date.toISOString().split("T")[0]
    setToday(formattedDate)
  }, [])

  const addEvent = () => {
    if (newEvent.title && newEvent.date && newEvent.time) {
      const event: Event = {
        ...newEvent,
        id: Date.now().toString(),
      }
      setEvents([...events, event])
      setNewEvent({
        title: "",
        date: "",
        time: "",
        location: "",
        description: "",
      })
      setShowAddEvent(false)
    }
  }

  const deleteEvent = (id: string) => {
    setEvents(events.filter((event) => event.id !== id))
  }

  // Get today's events
  const todaysEvents = events.filter((event) => event.date === today).sort((a, b) => a.time.localeCompare(b.time))

  // Group events by date
  const eventsByDate = events.reduce(
    (acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = []
      }
      acc[event.date].push(event)
      return acc
    },
    {} as Record<string, Event[]>,
  )

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort()

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
          {/* Today's Schedule */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <CalendarDays size={24} />
              <h1 className="text-2xl font-bold">Today's Schedule</h1>
            </div>

            <p className="text-gray-400 mb-4">Your upcoming events</p>

            {todaysEvents.length === 0 ? (
              <div className="text-center py-8 bg-gray-800/30 rounded-lg">
                <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-gray-400">No events scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysEvents.map((event) => (
                  <div key={event.id} className="bg-gray-800/50 rounded-lg p-4 flex">
                    <div
                      className={cn(
                        "w-16 h-16 rounded-lg flex flex-col items-center justify-center mr-4",
                        event.time.startsWith("0") || Number.parseInt(event.time) < 12
                          ? "bg-purple-600/70"
                          : "bg-green-600/70",
                      )}
                    >
                      <span className="text-lg font-bold">{event.time.substring(0, 5)}</span>
                      <span className="text-xs">{Number.parseInt(event.time) < 12 ? "AM" : "PM"}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{event.title}</h3>
                      <p className="text-gray-400 text-sm">{event.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              <Button variant="outline" className="w-full" onClick={() => setShowAddEvent(true)}>
                <Plus size={16} className="mr-2" />
                Add Event
              </Button>
            </div>
          </div>

          {/* All Events */}
          <div className="bg-gray-900/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar size={24} />
                <h1 className="text-2xl font-bold">All Events</h1>
              </div>
            </div>

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
              {sortedDates.length === 0 ? (
                <div className="text-center py-8 bg-gray-800/30 rounded-lg">
                  <Calendar size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-gray-400">No events scheduled</p>
                </div>
              ) : (
                sortedDates.map((date) => {
                  const formattedDate = new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })

                  return (
                    <div key={date}>
                      <h2 className="text-lg font-medium mb-3 border-b border-gray-700 pb-2">{formattedDate}</h2>
                      <div className="space-y-3">
                        {eventsByDate[date]
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((event) => (
                            <div
                              key={event.id}
                              className="bg-gray-800/30 rounded-lg p-3 flex justify-between items-start"
                            >
                              <div className="flex items-start gap-3">
                                <div className="text-sm text-gray-400 mt-1 w-12">
                                  {new Date(`2000-01-01T${event.time}`).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </div>
                                <div>
                                  <h3 className="font-medium">{event.title}</h3>
                                  <p className="text-sm text-gray-400">{event.location}</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white"
                                onClick={() => deleteEvent(event.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Add Event Modal */}
        {showAddEvent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Add New Event</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-gray-800 rounded-md focus:outline-none border border-gray-700"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      className="w-full p-2 bg-gray-800 rounded-md focus:outline-none border border-gray-700"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Time</label>
                    <input
                      type="time"
                      className="w-full p-2 bg-gray-800 rounded-md focus:outline-none border border-gray-700"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    className="w-full p-2 bg-gray-800 rounded-md focus:outline-none border border-gray-700"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Location (optional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <textarea
                    className="w-full p-2 bg-gray-800 rounded-md focus:outline-none border border-gray-700 h-20 resize-none"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Add details about this event"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setShowAddEvent(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addEvent}>Save Event</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
