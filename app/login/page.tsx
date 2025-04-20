"use client"

import { useState } from "react"
import { Anton } from "next/font/google"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithPopup } from "firebase/auth"
import { AnimatedBackground } from "@/components/animated-background"
import Image from "next/image"

const anton = Anton({ weight: "400", subsets: ["latin"] })

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError("")

      const result = await signInWithPopup(auth, googleProvider)
      
      // Store user info in localStorage
      localStorage.setItem("focusUserName", result.user.displayName || "User")
      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("userEmail", result.user.email || "")
      localStorage.setItem("userId", result.user.uid)
      
      // Navigate to home page
      router.push("/home")
    } catch (error: any) {
      console.error("Error signing in with Google:", error)
      setError(error.message || "Failed to sign in with Google. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-black text-white">
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-12 text-center backdrop-blur-lg bg-black/30 p-8 rounded-2xl border border-white/10">
          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-6">
            <Image 
              src="/logo.png" 
              alt="Focus Flow Logo" 
              width={64} 
              height={64} 
              className="object-contain"
            />
            <h1 className={`${anton.className} text-6xl md:text-7xl tracking-tight text-white`}>
              WELCOME TO FOCUS FLOW
            </h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
              {error}
            </div>
          )}

          {/* Login Button */}
          <div>
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-6 bg-white hover:bg-gray-100 text-black flex items-center justify-center gap-3 rounded-lg transition-all"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full" />
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
