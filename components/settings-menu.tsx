"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { X } from 'lucide-react'

type WallpaperCategory = {
  title: string;
  wallpapers: string[];
}

const wallpaperCategories: WallpaperCategory[] = [
  {
    title: "Nature Wallpapers",
    wallpapers: [
      "/wallpapers/nature/wallpaper%231.jpg",
      "/wallpapers/nature/wallpaper%232.jpg",
      "/wallpapers/nature/wallpaper%233.jpg",
    ]
  },
  {
    title: "Live Wallpapers",
    wallpapers: [
      "/wallpapers/live/live-1.jpg",
      "/wallpapers/live/live-2.jpg",
      "/wallpapers/live/live-3.jpg",
    ]
  },
  {
    title: "Gradient Wallpapers",
    wallpapers: [
      "/wallpapers/gradient/gradient-1.jpg",
      "/wallpapers/gradient/gradient-2.jpg",
      "/wallpapers/gradient/gradient-3.jpg",
    ]
  }
]

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>("");

  // Load saved wallpaper on initial render
  useEffect(() => {
    const savedWallpaper = localStorage.getItem('userWallpaper');
    if (savedWallpaper) {
      setSelectedWallpaper(savedWallpaper);
      applyWallpaper(savedWallpaper);
    }
  }, []);

  const applyWallpaper = (wallpaperUrl: string) => {
    // Add the with-wallpaper class to the body
    document.body.classList.add('with-wallpaper');
    
    // Set the wallpaper URL as a CSS variable
    document.documentElement.style.setProperty('--wallpaper-url', `url("${wallpaperUrl}")`);
  };

  const handleWallpaperSelect = (wallpaperUrl: string) => {
    setSelectedWallpaper(wallpaperUrl);
    localStorage.setItem('userWallpaper', wallpaperUrl);
    applyWallpaper(wallpaperUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-[#04050C]/90 text-white p-6 shadow-lg transform transition-transform duration-300 ease-in-out overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Settings</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="space-y-8">
        {wallpaperCategories.map((category, index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-lg font-medium">{category.title}</h3>
            <div className="grid grid-cols-2 gap-3">
              {category.wallpapers.map((wallpaper, wallpaperIndex) => (
                <button
                  key={wallpaperIndex}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                    selectedWallpaper === wallpaper ? 'border-purple-500' : 'border-transparent'
                  } hover:border-purple-300`}
                  onClick={() => handleWallpaperSelect(wallpaper)}
                >
                  <img
                    src={wallpaper}
                    alt={`${category.title} ${wallpaperIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 