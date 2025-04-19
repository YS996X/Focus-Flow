"use client"

import { useState, useRef, useEffect } from "react"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Message = {
  role: "user" | "assistant"
  content: string
}

export default function AIHelperPage() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi there! I'm your AI study assistant. Ask me any questions about your studies." },
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

  const handleSend = () => {
    if (!input.trim()) return

    setMessages([...messages, { role: "user", content: input }])

    setTimeout(() => {
      let response = "I AM MUSIC "

      const lowercaseInput = input.toLowerCase()

      if (lowercaseInput.includes("math") || lowercaseInput.includes("calculus")) {
        response =
          "For math problems, I recommend breaking them down into smaller steps. Would you like me to help with a specific math concept or problem?"
      } else if (lowercaseInput.includes("essay") || lowercaseInput.includes("writing")) {
        response =
          "When writing essays, start with a clear outline. Introduction with thesis, body paragraphs with evidence, and a conclusion that restates your main points. Would you like tips on a specific part of the writing process?"
      } else if (
        lowercaseInput.includes("study") &&
        (lowercaseInput.includes("tip") || lowercaseInput.includes("advice"))
      ) {
        response =
          "Some effective study techniques include: 1) Spaced repetition, 2) Active recall through practice questions, 3) Teaching concepts to others, 4) Taking regular breaks with the Pomodoro technique, and 5) Creating mind maps for complex topics."
      } else if (lowercaseInput.includes("focus") || lowercaseInput.includes("concentrate")) {
        response =
          "To improve focus, try: 1) Using the Pomodoro technique (25 min work, 5 min break), 2) Removing distractions like phones, 3) Having a dedicated study space, 4) Setting clear, achievable goals for each session, and 5) Getting enough sleep and exercise."
      } else if (lowercaseInput.includes("motivat")) {
        response =
          "Finding motivation can be challenging. Try setting small, achievable goals, rewarding yourself after study sessions, connecting your studies to your long-term aspirations, studying with friends, or changing your environment. Remember why you started this journey!"
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }])
    }, 1000)

    setInput("")
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
          <h1 className="text-2xl font-bold">AI Study Helper</h1>
        </div>

        <p className="text-gray-400 mb-6">Ask questions about your studies</p>

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
            />
            <Button onClick={handleSend} className="bg-purple-600 hover:bg-purple-700">
              Send
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
