import { X, Settings, RotateCcw } from 'lucide-react'
import type { PhysicsParams } from './types'

interface PhysicsPanelProps {
  isOpen: boolean
  isTop: boolean
  onClose: () => void
  physicsEnabled: boolean
  onPhysicsEnabledChange: (enabled: boolean) => void
  physicsParams: PhysicsParams
  onPhysicsParamsChange: (params: PhysicsParams) => void
  defaultPhysicsParams: PhysicsParams
  iterationCount: number
  maxIterations: number
  onRerunLayout: () => void
  onContinuePhysics: () => void
}

export function PhysicsPanel({
  isOpen,
  isTop,
  onClose,
  physicsEnabled,
  onPhysicsEnabledChange,
  physicsParams,
  onPhysicsParamsChange,
  defaultPhysicsParams,
  iterationCount,
  maxIterations,
  onRerunLayout,
  onContinuePhysics
}: PhysicsPanelProps) {
  if (!isOpen) return null

  return (
    <aside className={`fixed right-0 top-0 h-screen w-96 bg-dark-secondary border-l border-dark flex flex-col ${isTop ? 'z-50' : 'z-40'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark bg-dark-tertiary flex-shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyber-400" />
          <h2 className="text-lg font-bold text-slate-100">Physics Parameters</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-dark-secondary text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Physics Enabled Toggle */}
        <div className="pb-3 border-b border-dark">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-slate-300">Physics Enabled</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={physicsEnabled}
                onChange={(e) => onPhysicsEnabledChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-slate-300 rounded-full peer-checked:translate-x-5 transition-transform"></div>
            </div>
          </label>
          <p className="text-xs text-slate-500 mt-1">
            Enable/disable physics simulation. When disabled, you can move nodes without physics affecting other nodes.
          </p>
        </div>

        {/* Repulsion Strength */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Repulsion Force: {(physicsParams.repulsionStrength / 1000).toFixed(1)}k
          </label>
          <input
            type="range"
            min="1000"
            max="50000"
            step="500"
            value={physicsParams.repulsionStrength}
            onChange={(e) => onPhysicsParamsChange({ ...physicsParams, repulsionStrength: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            How strongly nodes push away from each other
          </p>
        </div>

        {/* Attraction Strength */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Spring Strength: {physicsParams.attractionStrength.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.01"
            max="5.0"
            step="0.05"
            value={physicsParams.attractionStrength}
            onChange={(e) => onPhysicsParamsChange({ ...physicsParams, attractionStrength: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            How tightly edges pull connected nodes together
          </p>
        </div>

        {/* Leaf Spring Strength */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Leaf Tightness: {physicsParams.leafSpringStrength.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="10.0"
            step="0.1"
            value={physicsParams.leafSpringStrength}
            onChange={(e) => onPhysicsParamsChange({ ...physicsParams, leafSpringStrength: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            How closely leaf nodes orbit their parent nodes
          </p>
        </div>

        {/* Damping */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Damping: {(physicsParams.damping * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="0.99"
            step="0.01"
            value={physicsParams.damping}
            onChange={(e) => onPhysicsParamsChange({ ...physicsParams, damping: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Energy loss per frame - higher values slow movement
          </p>
        </div>

        {/* Node Chaos */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Node Chaos: {physicsParams.nodeChaosFactor.toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={physicsParams.nodeChaosFactor}
            onChange={(e) => onPhysicsParamsChange({ ...physicsParams, nodeChaosFactor: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Randomizes physics per node for organic layouts
          </p>
        </div>

        {/* Center Gravity */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Center Gravity: {physicsParams.centerGravity.toFixed(4)}
          </label>
          <input
            type="range"
            min="-0.02"
            max="0.02"
            step="0.0001"
            value={physicsParams.centerGravity}
            onChange={(e) => onPhysicsParamsChange({ ...physicsParams, centerGravity: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Positive pulls toward center, negative pushes away
          </p>
        </div>

        {/* Repulsion Radius */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Repulsion Radius: {physicsParams.repulsionRadius}px
          </label>
          <input
            type="range"
            min="500"
            max="5000"
            step="100"
            value={physicsParams.repulsionRadius}
            onChange={(e) => onPhysicsParamsChange({ ...physicsParams, repulsionRadius: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            How far nodes can push each other (500=close, 5000=far islands)
          </p>
        </div>

        {/* Hub Edge Strength */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Hub Edge Strength: {physicsParams.hubEdgeStrength.toFixed(3)}
          </label>
          <input
            type="range"
            min="0"
            max="0.2"
            step="0.001"
            value={physicsParams.hubEdgeStrength}
            onChange={(e) => onPhysicsParamsChange({ ...physicsParams, hubEdgeStrength: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Hub-to-hub edge pull (0=payout/stretch freely, 0.2=strong pull)
          </p>
        </div>

        {/* Hub Repulsion Boost */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Hub Repulsion Boost: {physicsParams.hubRepulsionBoost.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2.0"
            step="0.1"
            value={physicsParams.hubRepulsionBoost}
            onChange={(e) => onPhysicsParamsChange({ ...physicsParams, hubRepulsionBoost: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Extra repulsion for high-degree nodes (0=none, 2=very strong)
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t border-dark">
          {/* Reset button */}
          <button
            onClick={() => onPhysicsParamsChange(defaultPhysicsParams)}
            className="flex-1 px-3 py-2 bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/50 rounded-lg text-sm text-slate-400 hover:text-slate-300 transition-colors flex items-center justify-center gap-2"
            title="Reset to default values"
          >
            <span>Reset</span>
          </button>

          {/* Rerun button */}
          <button
            onClick={onRerunLayout}
            className="flex-1 px-3 py-2 bg-cyber-500/20 hover:bg-cyber-500/30 border border-cyber-500/50 rounded-lg text-sm text-cyber-400 hover:text-cyber-300 transition-colors flex items-center justify-center gap-2"
            title="Rerun physics simulation with current parameters"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rerun</span>
          </button>
        </div>

        {/* Continue Physics button */}
        <div className="flex gap-2">
          <button
            onClick={onContinuePhysics}
            className="flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-sm text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-2"
            title="Continue physics from current positions"
          >
            <span>Continue Physics</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
