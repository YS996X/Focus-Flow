"use client"

import { useEffect, useState } from 'react'

export default function WallpaperProvider() {
  const [isLoaded, setIsLoaded] = useState(false);

  // Optimized function to apply wallpaper with preloading
  const applyWallpaper = (wallpaperUrl: string, isVideo: boolean) => {
    // Remove any existing video backgrounds
    const existingVideos = document.querySelectorAll('.wallpaper-video');
    existingVideos.forEach(video => video.remove());
    
    if (isVideo) {
      // For video wallpapers, create a video element
      const videoElement = document.createElement('video');
      videoElement.src = wallpaperUrl;
      videoElement.className = 'wallpaper-video';
      videoElement.autoplay = true;
      videoElement.loop = true;
      videoElement.muted = true;
      videoElement.playsInline = true;
      videoElement.controls = false;
      
      // Add the video element first, so it's guaranteed to be in the DOM
      document.body.prepend(videoElement);
      
      // Force play with timeout to ensure it has time to load
      videoElement.onloadeddata = () => setIsLoaded(true);
      
      videoElement.play().catch(e => {
        console.error("Failed to autoplay video:", e);
        // Add a click handler to start playback on user interaction
        document.addEventListener('click', () => videoElement.play(), { once: true });
        // Still mark as loaded even if autoplay fails
        setIsLoaded(true);
      });
      
      // Remove image wallpaper if any
      document.body.classList.remove('with-wallpaper');
      document.documentElement.style.removeProperty('--wallpaper-url');
    } else {
      // For image wallpapers, preload the image first
      const img = new Image();
      img.onload = () => {
        // Apply wallpaper only after it's loaded
        document.body.classList.add('with-wallpaper');
        document.documentElement.style.setProperty('--wallpaper-url', `url("${wallpaperUrl}")`);
        setIsLoaded(true);
      };
      
      // Set a timeout to ensure wallpaper is applied even if image loading fails
      const timeoutId = setTimeout(() => {
        document.body.classList.add('with-wallpaper');
        document.documentElement.style.setProperty('--wallpaper-url', `url("${wallpaperUrl}")`);
        setIsLoaded(true);
      }, 1000);
      
      // Load the image
      img.src = wallpaperUrl;
      
      // If image is already cached, onload might not fire
      if (img.complete) {
        clearTimeout(timeoutId);
        document.body.classList.add('with-wallpaper');
        document.documentElement.style.setProperty('--wallpaper-url', `url("${wallpaperUrl}")`);
        setIsLoaded(true);
      }
    }
  };

  useEffect(() => {
    // Get the saved wallpaper or use default
    const savedWallpaper = localStorage.getItem('userWallpaper') || "/wallpapers/nature/wallpaper%231.jpg";
    const wallpaperType = localStorage.getItem('userWallpaperType') || "image";
    
    // Apply wallpaper immediately
    applyWallpaper(savedWallpaper, wallpaperType === 'video');
    
    // Clean up function
    return () => {
      // If we're navigating away, don't remove the wallpaper
      // We'll just let the next instance handle it
    };
  }, []);

  return null;
} 