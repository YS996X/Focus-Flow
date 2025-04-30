import type React from "react"
import "@/app/globals.css"
import { Inter, Anton } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AudioProvider } from "@/components/audio-provider"

const inter = Inter({ subsets: ["latin"] })
const anton = Anton({ weight: "400", subsets: ["latin"] })

export const metadata = {
  title: "Focus Flow - AI-Powered Study & Productivity App",
  description: "Enhance your productivity with Focus Flow, an AI-powered study companion featuring a Pomodoro timer, ambient sounds, Spotify integration, and ADHD-friendly focus tools. Designed for students and professionals seeking optimal concentration.",
  keywords: [
    "Focus Flow", "Focus", "Study", "AI", "RexGroup", "Rexlabs", "Floucs", 
    "Study Timer", "Lockin", "Boost Focus", "Productivity", "Pomodoro Timer",
    "ADHD Focus", "Study Companion", "AI Assistant", "Focus Timer", "Study Tools",
    "Productivity App", "Time Management", "Study Music", "Ambient Sounds",
    "Body Doubling", "Study Groups", "Focus Sessions", "Study Motivation"
  ].join(", "),
  authors: [
    { name: "Yuvraj Singh" },
    { name: "Om Dwivedi" },
    { name: "Aditya Singh" }
  ],
  creator: "RexGroup",
  publisher: "Rexlabs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://myfocusflow.xyz'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Focus Flow - AI-Powered Study & Productivity App",
    description: "Enhance your productivity with Focus Flow, an AI-powered study companion featuring a Pomodoro timer, ambient sounds, Spotify integration, and ADHD-friendly focus tools. Designed for students and professionals seeking optimal concentration.",
    url: 'https://myfocusflow.xyz',
    siteName: 'Focus Flow',
    locale: 'en_US',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="msapplication-TileColor" content="#000000" />
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
