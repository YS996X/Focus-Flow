"use client"

import { Music, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAudio } from "@/components/audio-provider"

interface AppHeaderProps {
  showBackButton?: boolean
}

export function AppHeader({ showBackButton = true }: AppHeaderProps) {
  const { isAmbientPlaying, ambientSound } = useAudio()

  return null;
} 