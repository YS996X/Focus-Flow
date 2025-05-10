"use client"

import { useState, useRef } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Bot, Send, Sparkles, Brain, Lightbulb } from "lucide-react"
import WallpaperProvider from "@/components/wallpaper-provider"

type Message = {
  id: string
  content: string
  role: "user" | "assistant"
}

export default function AIHelperPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      content: input.trim(),
      role: "user"
    }

    try {
      setSending(true)
      setMessages(prev => [...prev, userMessage])
      setInput("")
      scrollToBottom()

      // Simulate AI response (replace with actual AI integration)
      const aiResponse: Message = {
        id: Math.random().toString(36).substr(2, 9),
        content: "I'm here to help! This is a placeholder response. The actual AI integration will be implemented soon.",
        role: "assistant"
      }
      
      setMessages(prev => [...prev, aiResponse])
      scrollToBottom()
      setSending(false)
    } catch (error) {
      console.error("Error:", error)
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
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

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat Section */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-12rem)]">
            <div className="flex items-center gap-2 mb-6">
              <Bot size={24} className="text-purple-400" />
              <h1 className="text-2xl font-semibold">AI Helper</h1>
        </div>

            {/* Messages */}
            <div className="flex-1 bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl border border-white/5 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot size={32} className="mx-auto mb-3 text-gray-500" />
                    <p className="text-gray-400">No messages yet. Start a conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.role === "assistant" ? "flex-row" : "flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "assistant"
                            ? "bg-purple-600/20 border border-purple-600/30"
                            : "bg-blue-600/20 border border-blue-600/30"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <Bot size={16} className="text-purple-400" />
                        ) : (
                          <Sparkles size={16} className="text-blue-400" />
                        )}
                      </div>
                      <div
                        className={`rounded-xl px-4 py-2.5 max-w-[80%] ${
                          message.role === "assistant"
                            ? "bg-[#232323]/50 border border-white/5"
                            : "bg-purple-600/20 border border-purple-500/30"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
                  </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="w-full bg-[#232323] rounded-xl border border-white/5 pl-4 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/30 transition-colors resize-none"
                    rows={1}
                    style={{
                      minHeight: "44px",
                      maxHeight: "120px"
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent hover:bg-white/5"
                    disabled={!input.trim() || sending}
                  >
                    <Send size={16} className="text-purple-400" />
                  </Button>
                </div>
              </form>
              </div>
          </div>

          {/* Features Section */}
          <div className="space-y-6">
            <div className="bg-[#1a1a1a]/40 backdrop-blur-lg rounded-xl p-6 border border-white/5">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Brain size={20} className="text-purple-400" />
                <span>AI Features</span>
              </h2>
              <div className="space-y-4">
                <div className="bg-[#232323]/50 rounded-lg p-4 border border-white/5">
                  <h3 className="font-medium flex items-center gap-2">
                    <Lightbulb size={16} className="text-yellow-400" />
                    Task Suggestions
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Get personalized suggestions for tasks and schedules based on your habits and goals.
                  </p>
                </div>
                <div className="bg-[#232323]/50 rounded-lg p-4 border border-white/5">
                  <h3 className="font-medium flex items-center gap-2">
                    <Bot size={16} className="text-blue-400" />
                    Smart Assistance
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Ask questions, get help with planning, or receive guidance on productivity techniques.
                  </p>
                  </div>
                  </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

