"use client"

import React, { useState, useRef, useEffect } from "react"
import type { JSX } from 'react'
import { Bot, Sparkles, Brain, Book, Send, RefreshCw, Download, Trash2, Lightbulb, Image, Search, BrainCircuit, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getMagnoliaResponse as getGeminiResponse } from "@/lib/gemini"
import { getMagnoliaResponse as getGemmaResponse } from "@/lib/gemma"
import { AppHeader } from "@/components/app-header"
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: number
  files?: {
    type: string
    name: string
    content: string
  }[]
}

type SuggestedPrompt = {
  title: string
  prompt: string
  icon: JSX.Element
}

type FeatureType = 'research' | 'advanced-research' | null

const suggestedPrompts: SuggestedPrompt[] = [
  {
    title: "Study Strategy",
    prompt: "Can you help me create an effective study strategy for my upcoming exams?",
    icon: <Brain className="w-4 h-4" />
  },
  {
    title: "Explain Topic",
    prompt: "Can you explain this topic in a simple way that's easy to understand?",
    icon: <Book className="w-4 h-4" />
  },
  {
    title: "Memory Tips",
    prompt: "What are some memory techniques I can use to remember this information better?",
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    title: "Quick Tips",
    prompt: "Give me some quick study tips for better focus and productivity.",
    icon: <Lightbulb className="w-4 h-4" />
  }
]

export default function AIHelperPage(): JSX.Element {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Hi there! I'm Magnolia, your learning companion. How can I help you with your studies today?",
      timestamp: Date.now()
    },
  ])
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [selectedFeature, setSelectedFeature] = useState<FeatureType>(null)
  const [files, setFiles] = useState<File[]>([])
  const [premiumRequests, setPremiumRequests] = useState(0)
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null)
  const [cooldown, setCooldown] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check login status and fetch user data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid)
        fetchUserData(user.uid)
      } else {
        router.push("/")
      }
    })

    return () => unsubscribe()
  }, [router])

  const fetchUserData = async (uid: string) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const q = query(
        collection(db, "aiRequests"),
        where("userId", "==", uid),
        where("date", "==", today)
      )
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        setPremiumRequests(doc.data().count)
        setLastRequestTime(doc.data().lastRequestTime)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  // Handle cooldown timer
  useEffect(() => {
    if (lastRequestTime) {
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime
      const cooldownTime = 3000 // 3 seconds

      if (timeSinceLastRequest < cooldownTime) {
        setCooldown(true)
        const timer = setTimeout(() => {
          setCooldown(false)
        }, cooldownTime - timeSinceLastRequest)
        return () => clearTimeout(timer)
      }
    }
  }, [lastRequestTime])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async (messageText: string = input) => {
    if (!messageText.trim() || isLoading || cooldown) return

    // Add user message
    const newMessage: Message = { 
      role: "user", 
      content: messageText, 
      timestamp: Date.now(),
      files: files.map(file => ({
        type: file.type,
        name: file.name,
        content: URL.createObjectURL(file)
      }))
    }
    setMessages(prev => [...prev, newMessage])
    setInput("")
    setShowSuggestions(false)
    setIsLoading(true)
    setLastRequestTime(Date.now())

    try {
      let response: string
      if (premiumRequests < 20) {
        // Use premium API
        response = await getGeminiResponse(messageText, selectedFeature, newMessage.files)
        setPremiumRequests(prev => prev + 1)
        
        // Update Firebase
        if (userId) {
          const today = new Date().toISOString().split('T')[0]
          const q = query(
            collection(db, "aiRequests"),
            where("userId", "==", userId),
            where("date", "==", today)
          )
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]
            await addDoc(collection(db, "aiRequests"), {
              userId,
              date: today,
              count: premiumRequests + 1,
              lastRequestTime: Date.now()
            })
          } else {
            await addDoc(collection(db, "aiRequests"), {
              userId,
              date: today,
              count: 1,
              lastRequestTime: Date.now()
            })
          }
        }
      } else {
        // Use normal API
        response = await getGemmaResponse(messageText)
      }
      
      // Add assistant message
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response,
        timestamp: Date.now()
      }])
    } catch (error) {
      console.error("Error getting AI response:", error)
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: Date.now()
      }])
    } finally {
      setIsLoading(false)
      setFiles([])
      setSelectedFeature(null)
    }
  }

  const clearChat = () => {
    setMessages([{ 
      role: "assistant", 
      content: "Hi there! I'm Magnolia, your learning companion. How can I help you with your studies today?",
      timestamp: Date.now()
    }])
    setShowSuggestions(true)
    setFiles([])
    setSelectedFeature(null)
  }

  const downloadChat = () => {
    const chatContent = messages
      .map(msg => `${msg.role.toUpperCase()} (${new Date(msg.timestamp).toLocaleString()})\n${msg.content}\n`)
      .join("\n")
    
    const blob = new Blob([chatContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "study-chat.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <AppHeader />

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bot size={24} />
            <h1 className="text-2xl font-bold">Magnolia - Your Learning Companion</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadChat}
              className="text-gray-400 hover:text-white"
              title="Download chat"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-gray-400 hover:text-white"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-xl p-6 flex-1 flex flex-col">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto mb-4 space-y-4 pr-4 custom-scrollbar"
          >
            {messages.map((message, index) => (
              <div key={index} className={`flex gap-2 ${message.role === "user" ? "justify-end" : ""}`}>
                {message.role === "assistant" && (
                  <div className="bg-purple-600/30 p-2 rounded-lg">
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`flex flex-col space-y-2 p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-100 ml-auto'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="text-sm mb-1 text-gray-400">
                    {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : 'Just now'}
                  </div>
                  {message.content}
                  {message.files && message.files.length > 0 && (
                    <div className="mt-2">
                      {message.files.map((file, index) => (
                        <div key={index} className="text-sm text-gray-600">
                          Attached: {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {showSuggestions && messages.length === 1 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(prompt.prompt)}
                  className="flex items-center gap-2 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="bg-purple-600/30 p-2 rounded-lg">
                    {prompt.icon}
                  </div>
                  <div>
                    <div className="font-medium">{prompt.title}</div>
                    <div className="text-sm text-gray-400 line-clamp-1">{prompt.prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4 mt-auto">
            {premiumRequests < 20 && (
              <div className="flex gap-2">
                <Button
                  variant={selectedFeature === 'research' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFeature(selectedFeature === 'research' ? null : 'research')}
                  className="flex-1"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Research
                </Button>
                <Button
                  variant={selectedFeature === 'advanced-research' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFeature(selectedFeature === 'advanced-research' ? null : 'advanced-research')}
                  className="flex-1"
                >
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  Advanced Research
                </Button>
              </div>
            )}

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {premiumRequests < 20 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gray-800/70 hover:bg-gray-700/70"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Attach Files
                </Button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.js,.ts,.py,.java,.cpp,.cs"
                multiple
              />
              <input
                type="text"
                className="flex-1 bg-gray-800/70 rounded-lg p-3 focus:outline-none border border-gray-700 focus:border-purple-500 transition-colors"
                placeholder="Ask me about your studies..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={isLoading || cooldown}
              />
              <Button 
                onClick={() => handleSend()} 
                className="bg-purple-600 hover:bg-purple-700 transition-colors"
                disabled={isLoading || cooldown}
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <div>
                {premiumRequests < 20 ? (
                  <span>Premium requests remaining: {20 - premiumRequests}</span>
                ) : (
                  <span>Using standard AI model</span>
                )}
              </div>
              {cooldown && (
                <span>Please wait before sending another message...</span>
              )}
            </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  )
}

