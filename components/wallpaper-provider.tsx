"use client"

import { useEffect } from 'react'

export default function WallpaperProvider() {
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
      setTimeout(() => {
        videoElement.play().catch(e => {
          console.error("Failed to autoplay video:", e);
          // Add a click handler to start playback on user interaction
          document.addEventListener('click', () => videoElement.play(), { once: true });
        });
      }, 100);
      
      // Remove image wallpaper if any
      document.body.classList.remove('with-wallpaper');
      document.documentElement.style.removeProperty('--wallpaper-url');
    } else {
      // For image wallpapers
      document.body.classList.add('with-wallpaper');
      document.documentElement.style.setProperty('--wallpaper-url', `url("${wallpaperUrl}")`);
    }
  };

  useEffect(() => {
    const savedWallpaper = localStorage.getItem('userWallpaper') || "/wallpapers/nature/wallpaper%231.jpg";
    const wallpaperType = localStorage.getItem('userWallpaperType') || "image";
    
    applyWallpaper(savedWallpaper, wallpaperType === 'video');
  }, []);

  return null;
} 