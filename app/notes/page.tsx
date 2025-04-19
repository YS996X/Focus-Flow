"use client"

import { useState, useEffect } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function NotesPage() {
  const router = useRouter()

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"

    // Redirect to login if not logged in
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  const [noteContent, setNoteContent] = useState("")

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <FileText size={24} />
          <h1 className="text-2xl font-bold">Notes</h1>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-4 min-h-[400px]">
          <textarea
            className="w-full h-[400px] bg-transparent border-none focus:outline-none resize-none"
            placeholder="Type your notes here..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
          />
        </div>

        <div className="flex justify-between mt-4">
          <Button variant="outline" size="sm">
            New Note
          </Button>
          <Button variant="outline" size="sm">
            Save
          </Button>
        </div>
      </main>
    </div>
  )
}
