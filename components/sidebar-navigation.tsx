"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FileText, Bot, Clock, CloudRain, CalendarDays, ListTodo, Menu, X } from "lucide-react"

export function SidebarNavigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "AI Helper", href: "/ai-helper", icon: Bot },
    { name: "Focus Timer", href: "/focus-timer", icon: Clock },
    { name: "Ambient", href: "/ambient", icon: CloudRain },
    { name: "Schedule", href: "/schedule", icon: CalendarDays },
    { name: "Tasks", href: "/tasks", icon: ListTodo },
  ]

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="block md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Sidebar - desktop always visible, mobile conditional */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-gray-900/80 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out",
          "md:w-64 md:translate-x-0",
          isMobileMenuOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full",
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="py-6 px-4">
            <Link href="/home" className="text-2xl font-bold tracking-tight">
              FOCUS FLOW
            </Link>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 space-y-2 mt-6">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start text-left",
                      isActive ? "bg-gray-800/60" : "hover:bg-gray-800/40",
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* App version */}
          <div className="py-4 px-2 text-xs text-gray-500">FOCUS FLOW v1.0</div>
        </div>
      </div>
    </>
  )
}
