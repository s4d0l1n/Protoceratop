import { X } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useGraphStore } from '@/stores/graphStore'

/**
 * Physics Controls Panel - Real-time physics modifiers
 */
export function LayoutPanel() {
  const { activePanel, setActivePanel } = useUIStore()
  const { physicsModifiers, setPhysicsModifiers } = useGraphStore()

  const isOpen = activePanel === 'layout'

  if (!isOpen) return null

  const handleClose = () => {
    setActivePanel(null)
  }

  const handleReset = () => {
    setPhysicsModifiers({
      centerGravity: 0,
      springStrength: 0,
      edgeLength: 0
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-dark-secondary border border-dark rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-100">Physics Controls</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-dark rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Center Gravity Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Center Gravity
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {physicsModifiers.centerGravity > 0 ? '+' : ''}{physicsModifiers.centerGravity}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={physicsModifiers.centerGravity}
              onChange={(e) => setPhysicsModifiers({
                ...physicsModifiers,
                centerGravity: Number(e.target.value)
              })}
              className="w-full h-2 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Repulsion</span>
              <span>Off</span>
              <span>Attraction</span>
            </div>
          </div>

          {/* Spring Strength Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Spring Strength
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {physicsModifiers.springStrength > 0 ? '+' : ''}{physicsModifiers.springStrength}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={physicsModifiers.springStrength}
              onChange={(e) => setPhysicsModifiers({
                ...physicsModifiers,
                springStrength: Number(e.target.value)
              })}
              className="w-full h-2 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Weak</span>
              <span>Default</span>
              <span>Strong</span>
            </div>
          </div>

          {/* Edge Length Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">
                Edge Length
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {physicsModifiers.edgeLength > 0 ? '+' : ''}{physicsModifiers.edgeLength}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              value={physicsModifiers.edgeLength}
              onChange={(e) => setPhysicsModifiers({
                ...physicsModifiers,
                edgeLength: Number(e.target.value)
              })}
              className="w-full h-2 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Short</span>
              <span>Default</span>
              <span>Long</span>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full px-4 py-2 bg-dark hover:bg-dark-secondary border border-dark rounded-lg text-sm text-slate-300 transition-colors"
          >
            Reset to Defaults
          </button>

          {/* Info */}
          <p className="text-xs text-slate-500">
            Adjust these sliders in real-time to modify the graph physics. Changes apply immediately to node positions.
          </p>
        </div>
      </div>
    </div>
  )
}
