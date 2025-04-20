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
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
  }

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

      <main className="flex-1 flex">
        {notes.length > 0 && (
          <div className="w-2/5 border-r border-gray-800 p-4 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Previous Notes</h2>
            <div className="space-y-3">
              {notes.map((note) => (
                <div 
                  key={note.id} 
                  className={`p-3 rounded-lg cursor-pointer ${currentNote?.id === note.id ? 'bg-gray-800' : 'bg-gray-800/30 hover:bg-gray-800/50'}`}
                  onClick={() => openNote(note)}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">{note.title}</h3>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                    {note.content.substring(0, 100)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`${notes.length > 0 ? 'w-3/5' : 'w-full'} p-4 flex flex-col`}>
          <div className="flex items-center gap-2 mb-6">
            <FileText size={24} />
            <h1 className="text-2xl font-bold">Notes</h1>
          </div>

          {currentNote ? (
            <>
              <input
                type="text"
                className="w-full bg-transparent border-none text-xl font-medium mb-4 focus:outline-none"
                placeholder="Title"
                value={currentNote.title}
                onChange={(e) => setCurrentNote({...currentNote, title: e.target.value})}
              />
              <div className="bg-gray-800/30 rounded-lg p-4 flex-1 mb-4">
                <textarea
                  className="w-full h-full min-h-[400px] bg-transparent border-none focus:outline-none resize-none"
                  placeholder="Type your notes here..."
                  value={currentNote.content}
                  onChange={(e) => setCurrentNote({...currentNote, content: e.target.value})}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={createNewNote}>
                  New Note
                </Button>
                <Button variant="outline" size="sm" onClick={saveNote}>
                  Save
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1">
              <p className="text-gray-400 mb-4">Select a note to view or create a new one</p>
              <Button variant="outline" onClick={createNewNote}>
                New Note
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
