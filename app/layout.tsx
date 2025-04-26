import type React from "react"
import "@/app/globals.css"
import { Inter, Anton } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AudioProvider } from "@/components/audio-provider"

const inter = Inter({ subsets: ["latin"] })
const anton = Anton({ weight: "400", subsets: ["latin"] })

export const metadata = {
  title: "FOCUS FLOW",
  description: "A minimalist focus timer to boost your productivity",
  verification: {
    google: 'v3GwX1LDdY7TOMgUMP6S_mdce6FwCQ7SMiEhQ9tSgrM',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="v3GwX1LDdY7TOMgUMP6S_mdce6FwCQ7SMiEhQ9tSgrM" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AudioProvider>
            {children}
          </AudioProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

import './globals.css'
