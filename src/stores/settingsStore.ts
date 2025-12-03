import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  useWebGL: boolean
  setUseWebGL: (value: boolean) => void
}

/**
 * Settings store for application configuration
 * Persisted to localStorage
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      useWebGL: false, // Default to Canvas 2D
      setUseWebGL: (value) => set({ useWebGL: value }),
    }),
    {
      name: 'raptorgraph-settings',
    }
  )
)
