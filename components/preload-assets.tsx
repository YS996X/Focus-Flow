"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Component that preloads critical assets in the background
 * This helps improve performance when navigating between pages
 */
export function PreloadAssets() {
  const router = useRouter()

  useEffect(() => {
    // Immediately preload all main application pages
    const pagesToPreload = [
      '/home',
      '/notes', 
      '/focus-timer', 
      '/ai-helper', 
      '/ambient', 
      '/schedule',
      '/tasks'
    ]
    
    // Preload all pages using Next.js router
    pagesToPreload.forEach(page => {
      router.prefetch(page)
    })
    
    // Preload common images
    const imagesToPreload = [
      "/wallpapers/nature/wallpaper%231.jpg",
      "/wallpapers/nature/wallpaper%232.jpg",
      "/wallpapers/nature/wallpaper%233.jpg",
      "/wallpapers/abstract/wallpaper%231.jpg",
      "/wallpapers/abstract/wallpaper%232.jpg"
    ]
    
    // Preload images in the background with high priority
    imagesToPreload.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
      
      // Also create an image object to ensure it's in browser cache
      const img = new Image()
      img.src = src
    })
    
    // Use requestIdleCallback to preload additional assets when browser is idle
    if ('requestIdleCallback' in window) {
      // @ts-ignore - TypeScript may not recognize requestIdleCallback
      window.requestIdleCallback(() => {
        // Preload common icons and UI elements
        const secondaryAssets: string[] = [
          // Add paths to common icons and UI elements
        ]
        
        secondaryAssets.forEach(src => {
          const img = new Image()
          img.src = src
        })
      })
    }
  }, [router])
  
  // This component doesn't render anything
  return null
} 