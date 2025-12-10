import { X, Shapes } from 'lucide-react'
import type { HighlightEdgeSettings } from './types'

interface HighlightPanelProps {
  isOpen: boolean
  isTop: boolean
  onClose: () => void
  highlightEdgeSettings: HighlightEdgeSettings
  onSettingsChange: (settings: HighlightEdgeSettings) => void
  showHulls: boolean
  onShowHullsChange: (show: boolean) => void
}

export function HighlightPanel({
  isOpen,
  isTop,
  onClose,
  highlightEdgeSettings,
  onSettingsChange,
  showHulls,
  onShowHullsChange
}: HighlightPanelProps) {
  if (!isOpen) return null

  return (
    <aside className={`fixed right-0 top-0 h-screen w-96 bg-dark-secondary border-l border-dark flex flex-col ${isTop ? 'z-50' : 'z-40'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-dark bg-dark-tertiary flex-shrink-0">
        <div className="flex items-center gap-2">
          <Shapes className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-slate-100">Highlight & Visuals</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-dark-secondary text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="text-sm font-medium text-slate-300 mb-3">Highlight Edge Settings</div>

        {/* Edge Width */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Edge Width: {highlightEdgeSettings.width}px
          </label>
          <input
            type="range"
            min="2"
            max="20"
            step="1"
            value={highlightEdgeSettings.width}
            onChange={(e) => onSettingsChange({ ...highlightEdgeSettings, width: Number(e.target.value) })}
            className="w-full h-1 bg-dark rounded-lg appearance-none cursor-pointer accent-cyber-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Thickness of highlighted path edges
          </p>
        </div>

        {/* Edge Color */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Edge Color
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={highlightEdgeSettings.color}
              onChange={(e) => onSettingsChange({ ...highlightEdgeSettings, color: e.target.value })}
              className="w-12 h-8 bg-dark border border-dark rounded cursor-pointer"
            />
            <input
              type="text"
              value={highlightEdgeSettings.color}
              onChange={(e) => onSettingsChange({ ...highlightEdgeSettings, color: e.target.value })}
              className="flex-1 px-2 py-1 bg-dark border border-dark rounded text-xs text-slate-300"
              placeholder="#22d3ee"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Color of highlighted path edges
          </p>
        </div>

        {/* Color Fade Toggle */}
        <div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-slate-400">Color Fade</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={highlightEdgeSettings.colorFade}
                onChange={(e) => onSettingsChange({ ...highlightEdgeSettings, colorFade: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark rounded-full peer peer-checked:bg-cyber-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-slate-300 rounded-full peer-checked:translate-x-5 transition-transform"></div>
            </div>
          </label>
          <p className="text-xs text-slate-500 mt-1">
            Fade opacity with distance from selected node
          </p>
        </div>

        {/* Size Fade Toggle */}
        <div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-slate-400">Size Fade</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={highlightEdgeSettings.sizeFade}
                onChange={(e) => onSettingsChange({ ...highlightEdgeSettings, sizeFade: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark rounded-full peer peer-checked:bg-cyber-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-slate-300 rounded-full peer-checked:translate-x-5 transition-transform"></div>
            </div>
          </label>
          <p className="text-xs text-slate-500 mt-1">
            Taper edge width with distance (thick to thin)
          </p>
        </div>

        {/* Animation Toggle */}
        <div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs text-slate-400">Flow Animation</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={highlightEdgeSettings.animation}
                onChange={(e) => onSettingsChange({ ...highlightEdgeSettings, animation: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark rounded-full peer peer-checked:bg-cyber-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-slate-300 rounded-full peer-checked:translate-x-5 transition-transform"></div>
            </div>
          </label>
          <p className="text-xs text-slate-500 mt-1">
            Animated dashed line showing flow direction
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-dark my-4"></div>

        {/* Hull Outlines Toggle */}
        <div>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-slate-300">Show Cluster Hulls</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={showHulls}
                onChange={(e) => onShowHullsChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-dark rounded-full peer peer-checked:bg-purple-500 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-slate-300 rounded-full peer-checked:translate-x-5 transition-transform"></div>
            </div>
          </label>
          <p className="text-xs text-slate-500 mt-1">
            Display convex hulls around parent-leaf node clusters
          </p>
        </div>
      </div>
    </aside>
  )
}
