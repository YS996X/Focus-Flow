"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import WallpaperProvider from '@/components/wallpaper-provider'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

export default function LoginLoading() {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Initializing your workspace...')
  
  // Helper function to preload images
  const preloadImage = (src: string) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = resolve
      img.onerror = resolve // Resolve even on error to avoid blocking
      img.src = src
    })
  }

  useEffect(() => {
    // Check Firebase auth state first
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/')
        return
      }

      try {
        // List of pages to preload
        const pagesToPreload = [
          '/home',
          '/notes', 
          '/focus-timer', 
          '/ai-helper', 
          '/ambient', 
          '/schedule',
          '/tasks'
        ]
        
        // Start with higher initial progress for better perceived performance
        setProgress(20)
        
        // Preload all pages in parallel immediately
        setStatus('Loading your workspace...')
        
        // Create an array of promises for all preloading operations
        const preloadPromises = []
        
        // 1. Preload the most important page - home (highest priority)
        preloadPromises.push(
          new Promise<void>(resolve => {
            router.prefetch('/home')
            // Resolve immediately since we don't need to wait
            resolve()
          })
        )
        
        // 2. Preload wallpaper in parallel (high priority)
        const savedWallpaper = localStorage.getItem('userWallpaper') || "/wallpapers/nature/wallpaper%231.jpg"
        preloadPromises.push(
          preloadImage(savedWallpaper).then(() => {
            setProgress(prev => Math.min(prev + 20, 60))
          })
        )
        
        // 3. Prefetch all other pages in parallel (medium priority)
        pagesToPreload.slice(1).forEach(page => {
          preloadPromises.push(
            new Promise<void>(resolve => {
              router.prefetch(page)
              resolve()
            })
          )
        })
        
        // 4. Add a link preload for faster resource loading
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = savedWallpaper
        document.head.appendChild(link)
        
        // Use Promise.all to wait for critical resources
        await Promise.all(preloadPromises)
        
        // Update progress to nearly complete
        setProgress(90)
        setStatus('Ready!')
        
        // Final progress - no delay needed
        setProgress(100)
        
        // Go to home immediately - no artificial delay
        router.push('/home')
      } catch (error) {
        console.error('Error during preloading:', error)
        // Fallback to home in case of errors
        router.push('/home')
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [router])
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ensure wallpaper is applied */}
      <WallpaperProvider />
      
      {/* Background overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1526]/80 via-[#0a1526]/70 to-[#0a1526]/80 mix-blend-multiply z-10" />
      <div className="absolute inset-0 bg-gradient-radial from-[#995c1d]/10 via-transparent to-transparent z-10 opacity-40" />
      <div className="absolute inset-0 shadow-[inset_0_0_150px_30px_rgba(0,0,0,0.8)] z-10 pointer-events-none" />

      {/* Loading UI */}
      <div className="relative z-20 flex flex-col items-center px-4 max-w-md w-full">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Focus Flow</h1>
        <p className="text-xl font-medium text-white/90 mb-12 text-center">{status}</p>
        
        <div className="w-full bg-gray-800/50 rounded-full h-3 mb-8 overflow-hidden backdrop-blur-md border border-white/10">
          <div 
            className="bg-white h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="animate-pulse text-white/70 text-center text-sm">
          {progress < 100 ? "Almost there..." : "Ready!"}
        </div>
      </div>
    </div>
  )
} 