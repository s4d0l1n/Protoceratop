/**
 * Edge Template Editor
 * Editor for creating and modifying edge/line templates
 */

import { useState } from 'react'
import { X } from 'lucide-react'
import type { EdgeTemplate } from '../types'

interface EdgeTemplateEditorProps {
  /** Existing template to edit (null for new template) */
  template: EdgeTemplate | null
  /** Called when save is clicked */
  onSave: (template: EdgeTemplate) => void
  /** Called when cancel is clicked */
  onCancel: () => void
}

export function EdgeTemplateEditor({ template, onSave, onCancel }: EdgeTemplateEditorProps) {
  const isEditing = !!template

  // Template basic info
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')

  // Line styling
  const [lineColor, setLineColor] = useState(template?.lineColor || '#999999')
  const [lineWidth, setLineWidth] = useState(template?.lineWidth || 2)
  const [lineStyle, setLineStyle] = useState<'solid' | 'dotted' | 'dashed'>(template?.lineStyle || 'solid')
  const [arrowShape, setArrowShape] = useState<'triangle' | 'triangle-tee' | 'circle-triangle' | 'triangle-cross' | 'chevron' | 'none'>(
    template?.arrowShape || 'triangle'
  )
  const [opacity, setOpacity] = useState(template?.opacity ?? 1)

  // Label styling
  const [label, setLabel] = useState(template?.label || '')
  const [labelFontSize, setLabelFontSize] = useState(template?.labelFontSize || 12)
  const [labelColor, setLabelColor] = useState(template?.labelColor || '#666666')
  const [labelBackgroundColor, setLabelBackgroundColor] = useState(template?.labelBackgroundColor || '#ffffff')

  // Save template
  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a template name')
      return
    }

    const newTemplate: EdgeTemplate = {
      id: template?.id || `edge-template-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      lineColor,
      lineWidth,
      lineStyle,
      arrowShape,
      opacity,
      label: label.trim() || undefined,
      labelFontSize,
      labelColor,
      labelBackgroundColor,
      isDefault: template?.isDefault || false,
    }

    onSave(newTemplate)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Edge Template' : 'New Edge Template'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure how edges/lines appear between nodes
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyber-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="e.g., Thick Red Line, Dotted Connection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyber-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="Optional description of when to use this template"
                />
              </div>
            </div>

            {/* Line Styling */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Line Style
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Line Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={lineColor}
                      onChange={(e) => setLineColor(e.target.value)}
                      className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={lineColor}
                      onChange={(e) => setLineColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                      placeholder="#999999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Line Width (px)
                  </label>
                  <input
                    type="number"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                    min="1"
                    max="20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Line Style
                  </label>
                  <select
                    value={lineStyle}
                    onChange={(e) => setLineStyle(e.target.value as 'solid' | 'dotted' | 'dashed')}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                  >
                    <option value="solid">Solid</option>
                    <option value="dotted">Dotted</option>
                    <option value="dashed">Dashed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Arrow Shape
                  </label>
                  <select
                    value={arrowShape}
                    onChange={(e) => setArrowShape(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                  >
                    <option value="triangle">Triangle</option>
                    <option value="triangle-tee">Triangle with Tee</option>
                    <option value="circle-triangle">Circle Triangle</option>
                    <option value="triangle-cross">Triangle Cross</option>
                    <option value="chevron">Chevron</option>
                    <option value="none">None</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Opacity: {opacity.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full"
                    min="0"
                    max="1"
                    step="0.05"
                  />
                </div>
              </div>
            </div>

            {/* Label Styling */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Edge Label (Optional)
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Label Text
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                    placeholder="e.g., connects to, links, requires"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty for no label
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Label Font Size
                    </label>
                    <input
                      type="number"
                      value={labelFontSize}
                      onChange={(e) => setLabelFontSize(parseInt(e.target.value) || 12)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                      min="8"
                      max="24"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Label Color
                    </label>
                    <input
                      type="color"
                      value={labelColor}
                      onChange={(e) => setLabelColor(e.target.value)}
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Label Background
                    </label>
                    <input
                      type="color"
                      value={labelBackgroundColor}
                      onChange={(e) => setLabelBackgroundColor(e.target.value)}
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-cyber-600 hover:bg-cyber-700 text-white rounded-lg transition-colors font-medium"
          >
            {isEditing ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  )
}
