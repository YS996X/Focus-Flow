import type React from "react"
import "@/app/globals.css"
import { Inter, Anton } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })
const anton = Anton({ weight: "400", subsets: ["latin"] })

export const metadata = {
  title: "FOCUS FLOW",
  description: "A minimalist focus timer to boost your productivity"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'