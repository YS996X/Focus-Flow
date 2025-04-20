"use client"

import { useEffect } from 'react'

export default function WallpaperProvider() {
  const applyWallpaper = (wallpaperUrl: string) => {
    console.log("Applying wallpaper:", wallpaperUrl);
    document.body.style.background = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${wallpaperUrl})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  };

  useEffect(() => {
    const savedWallpaper = localStorage.getItem('userWallpaper') || "/wallpapers/nature/wallpaper%231.jpg";
    console.log("WallpaperProvider: savedWallpaper", savedWallpaper);
    applyWallpaper(savedWallpaper);
  }, []);

  return null;
} 