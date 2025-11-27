import { useState } from 'react'
import { X } from 'lucide-react'
import type { EdgeTemplate, EdgeLineType, ArrowPosition } from '@/types'

interface EdgeTemplateEditorProps {
  /** Template being edited (null for new) */
  template: EdgeTemplate | null
  /** Close editor */
  onClose: () => void
  /** Save callback */
  onSave: (template: EdgeTemplate) => void
}

const LINE_STYLES: Array<'solid' | 'dashed' | 'dotted'> = ['solid', 'dashed', 'dotted']
const LINE_TYPES: EdgeLineType[] = ['straight', 'curved', 'orthogonal']
const ARROW_TYPES: Array<'default' | 'triangle' | 'circle' | 'none'> = [
  'default',
  'triangle',
  'circle',
  'none',
]
const ARROW_POSITIONS: ArrowPosition[] = ['none', 'end', 'start', 'both']

const COLOR_PRESETS = [
  '#475569', // slate-600
  '#64748b', // slate-500
  '#0891b2', // cyan-600
  '#06b6d4', // cyan-500
  '#22d3ee', // cyan-400
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f43f5e', // rose-500
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
]

/**
 * Edge template editor component
 * CRUD interface for creating/editing edge templates
 */
export function EdgeTemplateEditor({ template, onClose, onSave }: EdgeTemplateEditorProps) {
  // Form state
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [color, setColor] = useState(template?.color || '#475569')
  const [width, setWidth] = useState(template?.width || 2)
  const [style, setStyle] = useState<'solid' | 'dashed' | 'dotted'>(
    template?.style || 'solid'
  )
  const [lineType, setLineType] = useState<EdgeLineType>(
    template?.lineType || 'straight'
  )
  const [arrowType, setArrowType] = useState<'default' | 'triangle' | 'circle' | 'none'>(
    template?.arrowType || 'default'
  )
  const [arrowPosition, setArrowPosition] = useState<ArrowPosition>(
    template?.arrowPosition || 'end'
  )
  const [label, setLabel] = useState(template?.label || '')
  const [opacity, setOpacity] = useState(template?.opacity ?? 1)

  const handleSave = () => {
    if (!name.trim()) {
      return
    }

    const newTemplate: EdgeTemplate = {
      id: template?.id || `edge-template-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      color,
      width,
      style,
      lineType,
      arrowType,
      arrowPosition,
      label: label.trim(),
      opacity,
      isDefault: template?.isDefault || false,
      createdAt: template?.createdAt || Date.now(),
    }

    onSave(newTemplate)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-secondary border border-dark rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark-secondary border-b border-dark p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200">
            {template ? 'Edit Edge Template' : 'Create Edge Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Template Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Primary Connection, Dashed Link"
                className="w-full px-3 py-2 bg-dark border border-dark-tertiary rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description..."
                rows={2}
                className="w-full px-3 py-2 bg-dark border border-dark-tertiary rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-500 resize-none"
              />
            </div>
          </div>

          {/* Visual Properties */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 border-b border-dark pb-2">
              Visual Properties
            </h3>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Line Color
              </label>
              <div className="flex gap-2 flex-wrap mb-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setColor(preset)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      color === preset ? 'border-cyber-500 scale-110' : 'border-dark-tertiary'
                    }`}
                    style={{ backgroundColor: preset }}
                    title={preset}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10 bg-dark border border-dark-tertiary rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#475569"
                  className="flex-1 px-3 py-2 bg-dark border border-dark-tertiary rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                />
              </div>
            </div>

            {/* Width */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Line Width: {width}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={width}
                onChange={(e) => setWidth(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Line Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LINE_STYLES.map((styleOption) => (
                  <button
                    key={styleOption}
                    onClick={() => setStyle(styleOption)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                      style === styleOption
                        ? 'border-cyber-500 bg-cyber-500/10 text-cyber-400'
                        : 'border-dark-tertiary bg-dark text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {styleOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Line Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LINE_TYPES.map((typeOption) => (
                  <button
                    key={typeOption}
                    onClick={() => setLineType(typeOption)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                      lineType === typeOption
                        ? 'border-cyber-500 bg-cyber-500/10 text-cyber-400'
                        : 'border-dark-tertiary bg-dark text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {typeOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Arrow Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ARROW_TYPES.map((arrowOption) => (
                  <button
                    key={arrowOption}
                    onClick={() => setArrowType(arrowOption)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                      arrowType === arrowOption
                        ? 'border-cyber-500 bg-cyber-500/10 text-cyber-400'
                        : 'border-dark-tertiary bg-dark text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {arrowOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Arrow Position */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Arrow Position
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ARROW_POSITIONS.map((posOption) => (
                  <button
                    key={posOption}
                    onClick={() => setArrowPosition(posOption)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                      arrowPosition === posOption
                        ? 'border-cyber-500 bg-cyber-500/10 text-cyber-400'
                        : 'border-dark-tertiary bg-dark text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {posOption}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Default Label (Optional)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., connects to, depends on"
                className="w-full px-3 py-2 bg-dark border border-dark-tertiary rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyber-500"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 border-b border-dark pb-2">
              Preview
            </h3>
            <div className="bg-dark border border-dark-tertiary rounded-lg p-8 flex items-center justify-center">
              <svg width="300" height="100" className="overflow-visible">
                {/* Edge line */}
                <line
                  x1="50"
                  y1="50"
                  x2="250"
                  y2="50"
                  stroke={color}
                  strokeWidth={width}
                  strokeDasharray={
                    style === 'dashed' ? '10,5' : style === 'dotted' ? '2,4' : undefined
                  }
                  opacity={opacity}
                />

                {/* Arrow */}
                {arrowType !== 'none' && (
                  <>
                    {arrowType === 'default' && (
                      <polygon
                        points="250,50 240,45 240,55"
                        fill={color}
                        opacity={opacity}
                      />
                    )}
                    {arrowType === 'triangle' && (
                      <polygon
                        points="250,50 235,42 235,58"
                        fill={color}
                        opacity={opacity}
                      />
                    )}
                    {arrowType === 'circle' && (
                      <circle
                        cx="250"
                        cy="50"
                        r="5"
                        fill={color}
                        opacity={opacity}
                      />
                    )}
                  </>
                )}

                {/* Label */}
                {label && (
                  <text
                    x="150"
                    y="42"
                    textAnchor="middle"
                    fill="#e2e8f0"
                    fontSize="12"
                    opacity={opacity}
                  >
                    {label}
                  </text>
                )}

                {/* Source and target circles */}
                <circle cx="50" cy="50" r="8" fill="#64748b" />
                <circle cx="250" cy="50" r="8" fill="#64748b" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-dark-secondary border-t border-dark p-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark border border-dark-tertiary rounded-lg text-slate-300 hover:bg-dark-tertiary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-cyber-500 hover:bg-cyber-600 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-white transition-colors font-medium"
          >
            {template ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  )
}
