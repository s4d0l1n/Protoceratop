import { useState, useMemo } from 'react'
import { X, Circle, Grid3x3, Target, Clock, GitBranch, Radio, Network } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useProjectStore } from '@/stores/projectStore'
import { useGraphStore } from '@/stores/graphStore'
import { toast } from './Toast'
import type { LayoutType, TimelineSortOrder, HierarchicalDirection, TimelineSpacingMode } from '@/types'

interface LayoutOption {
  type: LayoutType
  label: string
  description: string
  icon: React.ReactNode
}

/**
 * Layout selector panel
 * UI for choosing graph layout algorithm
 */
export function LayoutPanel() {
  const { activePanel, setActivePanel } = useUIStore()
  const { layoutConfig, setLayoutConfig } = useProjectStore()
  const { nodes } = useGraphStore()

  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(layoutConfig.type)
  const [swimlaneAttribute, setSwimlaneAttribute] = useState(
    layoutConfig.timelineSwimlaneAttribute || ''
  )
  const [verticalSpacing, setVerticalSpacing] = useState(
    layoutConfig.timelineVerticalSpacing || 120
  )
  const [xSpacingMultiplier, setXSpacingMultiplier] = useState(
    layoutConfig.timelineXSpacingMultiplier || 1.0
  )
  const [ySpacingMultiplier, setYSpacingMultiplier] = useState(
    layoutConfig.timelineYSpacingMultiplier || 1.0
  )
  const [swimlaneSort, setSwimlaneSort] = useState<TimelineSortOrder>(
    layoutConfig.timelineSwimlaneSort || 'alphabetical'
  )
  const [spacingMode, setSpacingMode] = useState<TimelineSpacingMode>(
    layoutConfig.timelineSpacingMode || 'relative'
  )
  const [hierarchicalDirection, setHierarchicalDirection] = useState<HierarchicalDirection>(
    layoutConfig.hierarchicalDirection || 'top-bottom'
  )
  const [levelSeparation, setLevelSeparation] = useState(
    layoutConfig.hierarchicalLevelSeparation || 100
  )
  const [nodeSeparation, setNodeSeparation] = useState(
    layoutConfig.hierarchicalNodeSeparation || 80
  )

  const isOpen = activePanel === 'layout'

  // Get available attributes for swimlane grouping
  const availableAttributes = useMemo(() => {
    const attrSet = new Set<string>()
    nodes.forEach((node) => {
      Object.keys(node.attributes).forEach((key) => attrSet.add(key))
    })
    return Array.from(attrSet).sort()
  }, [nodes])

  const layouts: LayoutOption[] = [
    {
      type: 'force',
      label: 'Force-Directed',
      description: 'Organic layout with minimal clustering using physics simulation',
      icon: <Network className="w-6 h-6" />,
    },
    {
      type: 'hierarchical',
      label: 'Hierarchical',
      description: 'Tree structure with configurable direction and spacing',
      icon: <GitBranch className="w-6 h-6" />,
    },
    {
      type: 'radial',
      label: 'Radial',
      description: 'Hub nodes in center with connections radiating outward',
      icon: <Radio className="w-6 h-6" />,
    },
    {
      type: 'timeline',
      label: 'Timeline',
      description: 'Nodes positioned by timestamp with optional swimlanes',
      icon: <Clock className="w-6 h-6" />,
    },
    {
      type: 'concentric',
      label: 'Concentric',
      description: 'Nodes in concentric circles based on degree',
      icon: <Target className="w-6 h-6" />,
    },
    {
      type: 'circle',
      label: 'Circle',
      description: 'Nodes arranged in a circular pattern',
      icon: <Circle className="w-6 h-6" />,
    },
    {
      type: 'grid',
      label: 'Grid',
      description: 'Nodes arranged in a uniform grid pattern',
      icon: <Grid3x3 className="w-6 h-6" />,
    },
    {
      type: 'fruchterman',
      label: 'Fruchterman-Reingold',
      description: 'Force-directed with balanced edge lengths',
      icon: <Network className="w-6 h-6" />,
    },
    {
      type: 'kamada-kawai',
      label: 'Kamada-Kawai',
      description: 'Spring-based layout minimizing energy',
      icon: <Network className="w-6 h-6" />,
    },
    {
      type: 'spectral',
      label: 'Spectral',
      description: 'Eigenvalue-based mathematical layout',
      icon: <Network className="w-6 h-6" />,
    },
  ]

  if (!isOpen) return null

  const handleClose = () => {
    setActivePanel(null)
  }

  const handleApplyLayout = () => {
    setLayoutConfig({
      type: selectedLayout,
      timelineSwimlaneAttribute: selectedLayout === 'timeline' ? swimlaneAttribute : undefined,
      timelineVerticalSpacing: selectedLayout === 'timeline' ? verticalSpacing : undefined,
      timelineXSpacingMultiplier: selectedLayout === 'timeline' ? xSpacingMultiplier : undefined,
      timelineYSpacingMultiplier: selectedLayout === 'timeline' ? ySpacingMultiplier : undefined,
      timelineSwimlaneSort: selectedLayout === 'timeline' ? swimlaneSort : undefined,
      timelineSpacingMode: selectedLayout === 'timeline' ? spacingMode : undefined,
      hierarchicalDirection: selectedLayout === 'hierarchical' ? hierarchicalDirection : undefined,
      hierarchicalLevelSeparation: selectedLayout === 'hierarchical' ? levelSeparation : undefined,
      hierarchicalNodeSeparation: selectedLayout === 'hierarchical' ? nodeSeparation : undefined,
    })
    toast.success(`Applied ${layouts.find((l) => l.type === selectedLayout)?.label} layout`)
  }

  const currentLayoutOption = layouts.find((l) => l.type === selectedLayout)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
      <div className="bg-dark-secondary border border-dark rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Graph Layout</h2>
            <p className="text-sm text-slate-400 mt-1">
              Choose how nodes are positioned in the graph
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-dark rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Layout Options */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Layout Algorithm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {layouts.map((layout) => (
                <button
                  key={layout.type}
                  onClick={() => setSelectedLayout(layout.type)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedLayout === layout.type
                      ? 'border-cyber-500 bg-cyber-500/10'
                      : 'border-dark bg-dark hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 ${
                        selectedLayout === layout.type ? 'text-cyber-400' : 'text-slate-400'
                      }`}
                    >
                      {layout.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-100 mb-1">{layout.label}</div>
                      <div className="text-sm text-slate-400">{layout.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Timeline-specific options */}
          {selectedLayout === 'timeline' && (
            <section className="p-4 bg-dark border border-dark rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">Timeline Options</h3>

              {/* Spacing Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  X-Axis Spacing Mode
                </label>
                <select
                  value={spacingMode}
                  onChange={(e) => setSpacingMode(e.target.value as TimelineSpacingMode)}
                  className="w-full px-3 py-2 bg-dark-secondary border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                >
                  <option value="relative">Relative to Time (Family Tree)</option>
                  <option value="equal">Equal Spacing (Sorted by Time)</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Relative: nodes positioned proportionally to their timestamp. Equal: nodes evenly spaced, sorted by time.
                </p>
              </div>

              {/* Swimlane Attribute */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Swimlane Attribute (Optional)
                </label>
                <select
                  value={swimlaneAttribute}
                  onChange={(e) => setSwimlaneAttribute(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-secondary border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                >
                  <option value="">No swimlanes (Y-axis jitter)</option>
                  {availableAttributes.map((attr) => (
                    <option key={attr} value={attr}>
                      {attr}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Group nodes into horizontal swimlanes by attribute value
                </p>
              </div>

              {/* Swimlane Sort Order */}
              {swimlaneAttribute && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Swimlane Sort Order
                  </label>
                  <select
                    value={swimlaneSort}
                    onChange={(e) => setSwimlaneSort(e.target.value as TimelineSortOrder)}
                    className="w-full px-3 py-2 bg-dark-secondary border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                  >
                    <option value="alphabetical">Alphabetical (A-Z)</option>
                    <option value="count">By Node Count (Most First)</option>
                    <option value="custom">Custom (Original Order)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    How swimlanes are ordered vertically
                  </p>
                </div>
              )}

              {/* Vertical Spacing Control */}
              {swimlaneAttribute && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Vertical Spacing
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="500"
                    step="10"
                    value={verticalSpacing}
                    onChange={(e) => setVerticalSpacing(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-dark-secondary border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Minimum spacing between swimlanes (px)
                  </p>
                </div>
              )}

              {/* X-Axis Spacing Multiplier */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  X-Axis Spacing Multiplier
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={xSpacingMultiplier}
                  onChange={(e) => setXSpacingMultiplier(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-dark-secondary border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Horizontal time spacing (1.0 = default, increase to spread nodes apart)
                </p>
              </div>

              {/* Y-Axis Spacing Multiplier */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Y-Axis Spacing Multiplier
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="5.0"
                  step="0.1"
                  value={ySpacingMultiplier}
                  onChange={(e) => setYSpacingMultiplier(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-dark-secondary border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Vertical spacing within swimlanes (1.0 = default, increase to avoid overlaps)
                </p>
              </div>
            </section>
          )}

          {/* Hierarchical-specific options */}
          {selectedLayout === 'hierarchical' && (
            <section className="p-4 bg-dark border border-dark rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">Hierarchical Options</h3>

              {/* Direction */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Layout Direction
                </label>
                <select
                  value={hierarchicalDirection}
                  onChange={(e) => setHierarchicalDirection(e.target.value as HierarchicalDirection)}
                  className="w-full px-3 py-2 bg-dark-secondary border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                >
                  <option value="top-bottom">Top to Bottom</option>
                  <option value="bottom-top">Bottom to Top</option>
                  <option value="left-right">Left to Right</option>
                  <option value="right-left">Right to Left</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Direction of the hierarchical flow
                </p>
              </div>

              {/* Level Separation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Level Separation: {levelSeparation}px
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={levelSeparation}
                  onChange={(e) => setLevelSeparation(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Spacing between hierarchical levels
                </p>
              </div>

              {/* Node Separation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Node Separation: {nodeSeparation}px
                </label>
                <input
                  type="range"
                  min="40"
                  max="200"
                  step="10"
                  value={nodeSeparation}
                  onChange={(e) => setNodeSeparation(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Spacing between nodes on the same level
                </p>
              </div>
            </section>
          )}

          {/* Current Layout Info */}
          <section className="mt-6 p-4 bg-dark-tertiary border border-dark rounded-lg">
            <div className="text-sm text-slate-400">
              <span className="font-medium">Current Layout:</span>{' '}
              {layouts.find((l) => l.type === layoutConfig.type)?.label || 'Circle'}
            </div>
            {layoutConfig.type === 'timeline' && layoutConfig.timelineSwimlaneAttribute && (
              <div className="text-sm text-slate-400 mt-1">
                <span className="font-medium">Swimlane Attribute:</span>{' '}
                {layoutConfig.timelineSwimlaneAttribute}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-dark">
          <div className="text-sm text-slate-400">
            {currentLayoutOption && (
              <span>
                Selected: <span className="font-medium">{currentLayoutOption.label}</span>
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-dark hover:bg-dark-secondary text-slate-300 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyLayout}
              className="px-4 py-2 bg-cyber-500 hover:bg-cyber-600 text-white rounded transition-colors"
            >
              Apply Layout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
