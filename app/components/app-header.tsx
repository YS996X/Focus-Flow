"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Book, Tag, Clock, Calendar, Bot, Settings } from "lucide-react"

const navigation = [
  { name: "Notes", href: "/notes", icon: Book },
  { name: "Tasks", href: "/tasks", icon: Tag },
  { name: "Focus Timer", href: "/focus-timer", icon: Clock },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "AI Helper", href: "/ai-helper", icon: Bot },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function AppHeader() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-black/20 backdrop-blur-lg">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-center">
        <nav className="flex items-center justify-center space-x-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-all",
                  isActive
                    ? "text-purple-400"
                    : "text-white/60 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5" strokeWidth={2} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
} 