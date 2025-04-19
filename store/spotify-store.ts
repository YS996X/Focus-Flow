import { create } from 'zustand'
import { StateCreator } from 'zustand'

interface SpotifyStore {
  playlistId: string | null
  isSelectingPlaylist: boolean
  isVisible: boolean
  setPlaylistId: (id: string | null) => void
  setIsSelectingPlaylist: (isSelecting: boolean) => void
  setIsVisible: (isVisible: boolean) => void
}

type SpotifyStoreCreator = StateCreator<SpotifyStore>

export const useSpotifyStore = create<SpotifyStore>((set: (fn: (state: SpotifyStore) => SpotifyStore) => void) => ({
  playlistId: null,
  isSelectingPlaylist: true,
  isVisible: false,
  setPlaylistId: (id: string | null) => set((state) => ({ ...state, playlistId: id })),
  setIsSelectingPlaylist: (isSelecting: boolean) => set((state) => ({ ...state, isSelectingPlaylist: isSelecting })),
  setIsVisible: (isVisible: boolean) => set((state) => ({ ...state, isVisible: isVisible })),
})) 