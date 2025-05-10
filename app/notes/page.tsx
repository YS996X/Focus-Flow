"use client"

import { useState, useEffect } from "react"
import { FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, query, where } from "firebase/firestore"
import { app } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { AppHeader } from "@/components/app-header"
import { cn } from "@/lib/utils"
import WallpaperProvider from "@/components/wallpaper-provider"

// Initialize Firestore
const db = getFirestore(app)

interface Note {
  id: string
  title: string
  content: string
  createdAt: number
}

export default function NotesPage() {
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Check login status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
      } else {
    // Redirect to login if not logged in
      router.push("/")
    }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // Fetch user's notes
  useEffect(() => {
    const fetchNotes = async () => {
      if (!userId) return

      try {
        console.log("Attempting to fetch notes for user:", userId);
        const q = query(collection(db, "notes"), where("userId", "==", userId))
        const querySnapshot = await getDocs(q)
        
        const fetchedNotes: Note[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          fetchedNotes.push({
            id: doc.id,
            title: data.title,
            content: data.content,
            createdAt: data.createdAt
          })
        })
        
        console.log(`Successfully fetched ${fetchedNotes.length} notes`);
        
        // Sort notes by creation date (newest first)
        fetchedNotes.sort((a, b) => b.createdAt - a.createdAt)
        setNotes(fetchedNotes)
      } catch (error) {
        console.error("Error fetching notes:", error)
        alert("There was an error connecting to the database. Please check if Firestore is properly set up.")
      }
    }

    if (userId) {
      fetchNotes()
    }
  }, [userId])

  const createNewNote = () => {
    setCurrentNote({
      id: "",
      title: "",
      content: "",
      createdAt: Date.now()
    })
  }

  const saveNote = async () => {
    if (!userId || !currentNote) return
    
    try {
      console.log("Attempting to save note:", currentNote.title);
      
      // Validate title
      if (!currentNote.title.trim()) {
        alert("Please enter a title for your note")
        return
      }
      
      if (currentNote.id) {
        // Update existing note
        await updateDoc(doc(db, "notes", currentNote.id), {
          title: currentNote.title,
          content: currentNote.content,
          updatedAt: Date.now()
        })
        console.log("Note updated successfully");
      } else {
        // Create new note
        const noteData = {
          userId: userId,
          title: currentNote.title,
          content: currentNote.content,
          createdAt: Date.now()
        };
        console.log("Saving new note:", noteData);
        
        const docRef = await addDoc(collection(db, "notes"), noteData)
        
        console.log("Note created with ID:", docRef.id);
        
        setCurrentNote({
          ...currentNote,
          id: docRef.id
        })
      }
      
      // Refresh notes list
      const q = query(collection(db, "notes"), where("userId", "==", userId))
      const querySnapshot = await getDocs(q)
      
      const updatedNotes: Note[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        updatedNotes.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          createdAt: data.createdAt
        })
      })
      
      // Sort notes by creation date (newest first)
      updatedNotes.sort((a, b) => b.createdAt - a.createdAt)
      setNotes(updatedNotes)
    } catch (error) {
      console.error("Error saving note:", error)
      alert("Failed to save note. Please check if Firestore is properly set up.")
    }
  }

  const deleteNote = async (noteId: string) => {
    if (!userId) return
    
    try {
      await deleteDoc(doc(db, "notes", noteId))
      
      // Remove from local state
      setNotes(notes.filter(note => note.id !== noteId))
      
      // Reset current note if it was deleted
      if (currentNote?.id === noteId) {
        setCurrentNote(null)
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      alert("Failed to delete note. Please try again.")
    }
  }

  const openNote = (note: Note) => {
    setCurrentNote(note)
  }

  if (loading) {
    return <div className="min-h-screen bg-transparent text-white flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <WallpaperProvider />
      <AppHeader />

      <main className="flex-1 flex relative">
        {/* Background overlays - matching home page style */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1526]/80 via-[#0a1526]/70 to-[#0a1526]/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-radial from-[#995c1d]/10 via-transparent to-transparent opacity-40" />
        <div className="absolute inset-0 shadow-[inset_0_0_150px_30px_rgba(0,0,0,0.8)] pointer-events-none" />

        {/* Notes List */}
        {notes.length > 0 && (
          <div className="w-2/5 border-r border-white/10 p-6 overflow-y-auto relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Previous Notes</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={createNewNote}
                className="border-white/10 hover:bg-white/5"
              >
                New Note
              </Button>
            </div>
            <div className="space-y-3">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className={cn(
                    "p-4 rounded-xl backdrop-blur-lg border border-white/5 cursor-pointer transition-all duration-200",
                    currentNote?.id === note.id 
                      ? 'bg-[#1a1a1a]/60 border-purple-500/30' 
                      : 'bg-[#1a1a1a]/40 hover:bg-[#1a1a1a]/50'
                  )}
                  onClick={() => openNote(note)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">{note.title || "Untitled Note"}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-gray-400 hover:text-red-400 transition-colors -mr-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                    {note.content.substring(0, 100)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note Editor */}
        <div className={cn(
          "p-6 flex flex-col relative z-10",
          notes.length > 0 ? 'w-3/5' : 'w-full'
        )}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText size={24} className="text-purple-400" />
              <h1 className="text-2xl font-semibold">Notes</h1>
            </div>
            {currentNote && (
              <Button
                variant="outline"
                size="sm"
                onClick={saveNote}
                className="border-white/10 hover:bg-white/5"
              >
                Save Changes
              </Button>
            )}
          </div>

          {currentNote ? (
            <div className="flex flex-col flex-1">
              <input
                type="text"
                className="w-full bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl px-4 py-3 text-xl font-medium mb-4 focus:outline-none border border-white/5 focus:border-purple-500/30 transition-colors"
                placeholder="Note Title"
                value={currentNote.title}
                onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
              />
              <div className="flex-1 bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl border border-white/5 overflow-hidden">
                <textarea
                  className="w-full h-full min-h-[400px] bg-transparent p-4 focus:outline-none resize-none text-gray-100"
                  placeholder="Start typing your note..."
                  value={currentNote.content}
                  onChange={(e) => setCurrentNote({...currentNote, content: e.target.value})}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-8 border border-white/5 text-center">
                <FileText size={48} className="mx-auto mb-4 text-purple-400/60" />
                <p className="text-gray-300 mb-6">Select a note to view or create a new one</p>
                <Button
                  variant="outline"
                  onClick={createNewNote}
                  className="border-white/10 hover:bg-white/5"
                >
                  Create New Note
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
