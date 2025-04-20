"use client"

import { useState, useRef, useEffect } from "react"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getMagnoliaResponse } from "@/lib/groq"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function AIHelperPage() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi there! I'm Magnolia, your learning companion. How can I help you with your studies today?" },
  ])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"

    // Redirect to login if not logged in
    if (!loggedIn) {
      router.push("/")
    }
  }, [router])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // Add user message
    setMessages(prev => [...prev, { role: "user", content: input }])
    setIsLoading(true)

    try {
      // Get response from Magnolia
      const response = await getMagnoliaResponse(input)
      
      // Add assistant message
      setMessages(prev => [...prev, { role: "assistant", content: response }])
    } catch (error) {
      console.error("Error getting AI response:", error)
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment." 
      }])
    } finally {
      setIsLoading(false)
      setInput("")
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-8 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Bot size={24} />
          <h1 className="text-2xl font-bold">Magnolia - Your Learning Companion</h1>
        </div>

        <p className="text-gray-400 mb-6">Let's work together to understand your studies better. I'm here to guide and support you.</p>

        <div className="bg-gray-900/50 rounded-xl p-6 flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
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
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2 mt-auto">
            <input
              type="text"
              className="flex-1 bg-gray-800/70 rounded-lg p-3 focus:outline-none border border-gray-700"
              placeholder="Ask me about your studies..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSend} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
