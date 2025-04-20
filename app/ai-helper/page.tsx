"use client"

import React, { useState, useRef, useEffect } from "react"
import type { JSX } from 'react'
import { Bot, Sparkles, Brain, Book, Send, RefreshCw, Download, Trash2, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getMagnoliaResponse } from "@/lib/groq"
import { AppHeader } from "@/components/app-header"

type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

type SuggestedPrompt = {
  title: string
  prompt: string
  icon: JSX.Element
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  const handleSend = async (messageText: string = input) => {
    if (!messageText.trim() || isLoading) return

    // Add user message
    const newMessage = { role: "user" as const, content: messageText, timestamp: Date.now() }
    setMessages(prev => [...prev, newMessage])
    setInput("")
    setShowSuggestions(false)
    setIsLoading(true)

    try {
      // Get response from Magnolia
      const response = await getMagnoliaResponse(messageText)
      
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
    }
  }

  const clearChat = () => {
    setMessages([{ 
      role: "assistant", 
      content: "Hi there! I'm Magnolia, your learning companion. How can I help you with your studies today?",
      timestamp: Date.now()
    }])
    setShowSuggestions(true)
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
                  className={`p-3 rounded-lg max-w-[80%] ${
                    message.role === "user" ? "bg-gray-700/50 text-right ml-auto" : "bg-gray-800/50"
                  }`}
                >
                  <div className="text-sm mb-1 text-gray-400">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                  {message.content}
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

          <div className="flex gap-2 mt-auto">
            <input
              type="text"
              className="flex-1 bg-gray-800/70 rounded-lg p-3 focus:outline-none border border-gray-700 focus:border-purple-500 transition-colors"
              placeholder="Ask me about your studies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isLoading}
            />
            <Button 
              onClick={() => handleSend()} 
              className="bg-purple-600 hover:bg-purple-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
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

