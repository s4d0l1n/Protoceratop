import { X, Zap, Play } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import type { LayoutType } from '@/components/ui/LayoutSwitcher'

interface LayoutPanelProps {
  currentLayout?: LayoutType
  onLayoutChange?: (layout: LayoutType) => void
  onAutoLayout?: () => void
}

interface LayoutInfo {
  id: LayoutType
  name: string
  description: string
  icon: string
}

const LAYOUTS: LayoutInfo[] = [
  { id: 'bigbang', name: 'Big Bang', description: 'Physics-based force layout with dynamic interactions', icon: '💥' },
]

/**
 * Layout selector panel
 * Select and apply layout algorithms to the graph
 */
export function LayoutPanel({ currentLayout = 'grid', onLayoutChange, onAutoLayout }: LayoutPanelProps = {}) {
  const { activePanel, setActivePanel } = useUIStore()

  const isOpen = activePanel === 'layout'

  if (!isOpen) return null

  const handleClose = () => {
    setActivePanel(null)
  }

  const handleLayoutSelect = (layout: LayoutType) => {
    if (onLayoutChange) {
      onLayoutChange(layout)
    }
  }

  const handleApplyLayout = () => {
    // Layout is already applied when selected, so just close the panel
    handleClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-dark-secondary border border-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark">
          <h2 className="text-xl font-bold text-slate-100">Choose Layout</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-dark rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Auto Layout Button */}
          {onAutoLayout && (
            <div>
              <button
                onClick={onAutoLayout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors font-medium"
              >
                <Zap className="w-5 h-5" />
                <span>Auto-Select Layout</span>
              </button>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Automatically choose the best layout based on graph structure
              </p>
            </div>
          )}

          {/* Layout Selection */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3">Select Layout</h3>
            <div className="grid grid-cols-1 gap-2">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => handleLayoutSelect(layout.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    layout.id === currentLayout
                      ? 'bg-cyber-500/20 border-2 border-cyber-500'
                      : 'bg-dark hover:bg-dark-tertiary border-2 border-transparent'
                  }`}
                >
                  <span className="text-2xl">{layout.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200 truncate">{layout.name}</div>
                    <div className="text-xs text-slate-400 truncate">{layout.description}</div>
                  </div>
                  {layout.id === currentLayout && (
                    <div className="w-2 h-2 rounded-full bg-cyber-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Apply Button */}
        <div className="px-6 py-4 border-t border-dark bg-dark-tertiary">
          <button
            onClick={handleApplyLayout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyber-500 hover:bg-cyber-600 text-white rounded-lg transition-colors font-medium"
          >
            <Play className="w-5 h-5" />
            <span>Apply Layout</span>
          </button>
        </div>
      </div>
    </div>
  )
}
