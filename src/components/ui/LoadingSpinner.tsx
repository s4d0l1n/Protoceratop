import { Loader2 } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'

/**
 * Global loading spinner overlay
 * Shows when isLoading is true in UIStore
 */
export function LoadingSpinner() {
  const { isLoading, loadingMessage } = useUIStore()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
      <div className="bg-dark-secondary border border-dark rounded-lg p-8 flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-cyber-500 animate-spin" />
        {loadingMessage && (
          <div className="text-slate-300 text-center">{loadingMessage}</div>
        )}
      </div>
    </div>
  )
}
