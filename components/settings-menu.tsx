"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { X, Play } from 'lucide-react'

type WallpaperType = 'image' | 'video';

type Wallpaper = {
  path: string;
  type: WallpaperType;
}

type WallpaperCategory = {
  title: string;
  wallpapers: Wallpaper[];
}

const wallpaperCategories: WallpaperCategory[] = [
  {
    title: "Nature Wallpapers",
    wallpapers: [
      { path: "/wallpapers/nature/wallpaper%231.jpg", type: 'image' },
      { path: "/wallpapers/nature/wallpaper%232.jpg", type: 'image' },
      { path: "/wallpapers/nature/wallpaper%233.jpg", type: 'image' },
    ]
  },
  {
    title: "Live Wallpapers",
    wallpapers: [
      { path: "/wallpapers/live/livewallpaper1.mp4", type: 'video' },
      { path: "/wallpapers/live/livewallpaper2.mp4", type: 'video' },
    ]
  },
  {
    title: "Gradient Wallpapers",
    wallpapers: [
      { path: "/wallpapers/gradient/gradient-1.jpg", type: 'image' },
      { path: "/wallpapers/gradient/gradient-2.jpg", type: 'image' },
      { path: "/wallpapers/gradient/gradient-3.jpg", type: 'image' },
    ]
  }
]

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>("");
  const [isVideoWallpaper, setIsVideoWallpaper] = useState<boolean>(false);

  // Load saved wallpaper on initial render
  useEffect(() => {
    const savedWallpaper = localStorage.getItem('userWallpaper');
    const wallpaperType = localStorage.getItem('userWallpaperType');
    
    if (savedWallpaper) {
      setSelectedWallpaper(savedWallpaper);
      setIsVideoWallpaper(wallpaperType === 'video');
      applyWallpaper(savedWallpaper, wallpaperType === 'video');
    }
  }, []);

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

  const handleWallpaperSelect = (wallpaper: Wallpaper) => {
    setSelectedWallpaper(wallpaper.path);
    setIsVideoWallpaper(wallpaper.type === 'video');
    localStorage.setItem('userWallpaper', wallpaper.path);
    localStorage.setItem('userWallpaperType', wallpaper.type);
    applyWallpaper(wallpaper.path, wallpaper.type === 'video');
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
                    selectedWallpaper === wallpaper.path ? 'border-purple-500' : 'border-transparent'
                  } hover:border-purple-300`}
                  onClick={() => handleWallpaperSelect(wallpaper)}
                >
                  {wallpaper.type === 'image' ? (
                    <img
                      src={wallpaper.path}
                      alt={`${category.title} ${wallpaperIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative w-full h-full bg-black/50">
                      <video 
                        src={wallpaper.path} 
                        className="w-full h-full object-cover" 
                        muted 
                        loop
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play className="w-10 h-10 text-white/70" />
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 