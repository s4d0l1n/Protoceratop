/**
 * Card Template Editor
 * Full-featured editor for creating and modifying card templates
 */

import { useState } from 'react'
import { X, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Upload, Smile } from 'lucide-react'
import type { CardTemplate, AttributeDisplay, CardLayoutSettings, CardTextStyle, NodeVisualStyle, NodeShape } from '../types'
import { useAttributeTemplateStore } from '../stores/attributeTemplateStore'
import { IconPicker } from './IconPicker'

interface CardTemplateEditorProps {
  /** Existing template to edit (null for new template) */
  template: CardTemplate | null
  /** All available attribute names from the graph */
  availableAttributes: string[]
  /** Called when save is clicked */
  onSave: (template: CardTemplate) => void
  /** Called when cancel is clicked */
  onCancel: () => void
}

export function CardTemplateEditor({ template, availableAttributes, onSave, onCancel }: CardTemplateEditorProps) {
  const isEditing = !!template

  // Template basic info
  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>(template?.mergeMode || 'replace')

  // Layout settings
  const [layout, setLayout] = useState<CardLayoutSettings>(template?.layout || {
    maxWidth: 240,
    lineHeight: 1.2,
    padding: 4,
    showLabels: false,
    separator: '\n',
    textAlign: 'center',
  })

  // Text styling
  const [textStyle, setTextStyle] = useState<CardTextStyle>(template?.textStyle || {})

  // Node visual styling
  const [nodeStyle, setNodeStyle] = useState<NodeVisualStyle>(template?.nodeStyle || {})

  // Attribute displays
  const [attributeDisplays, setAttributeDisplays] = useState<AttributeDisplay[]>(
    template?.attributeDisplays || []
  )

  // UI state
  const [activeTab, setActiveTab] = useState<'attributes' | 'nodeStyle' | 'layout'>('attributes')

  // Add new attribute display
  const handleAddAttribute = (attribute: string) => {
    const exists = attributeDisplays.some(d => d.attribute === attribute)
    if (exists) return

    const newDisplay: AttributeDisplay = {
      attribute,
      visible: true,
      order: attributeDisplays.length,
    }
    setAttributeDisplays([...attributeDisplays, newDisplay])
  }

  // Remove attribute display
  const handleRemoveAttribute = (attribute: string) => {
    setAttributeDisplays(attributeDisplays.filter(d => d.attribute !== attribute))
  }

  // Update attribute display
  const handleUpdateAttribute = (attribute: string, updates: Partial<AttributeDisplay>) => {
    setAttributeDisplays(
      attributeDisplays.map(d => d.attribute === attribute ? { ...d, ...updates } : d)
    )
  }

  // Move attribute up/down
  const handleMoveAttribute = (index: number, direction: 'up' | 'down') => {
    const newDisplays = [...attributeDisplays]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newDisplays.length) return

    const temp = newDisplays[index]!
    newDisplays[index] = newDisplays[targetIndex]!
    newDisplays[targetIndex] = temp

    // Update order values
    newDisplays.forEach((d, i) => {
      d.order = i
    })

    setAttributeDisplays(newDisplays)
  }

  // Save template
  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a template name')
      return
    }

    const newTemplate: CardTemplate = {
      id: template?.id || `template-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      attributeDisplays,
      textStyle,
      nodeStyle,
      layout,
      mergeMode,
      isDefault: template?.isDefault || false,
    }

    onSave(newTemplate)
  }

  // Get attributes not yet added (include special __id__ attribute)
  const allAvailableAttributes = ['__id__', ...availableAttributes]
  const unusedAttributes = allAvailableAttributes.filter(
    attr => !attributeDisplays.some(d => d.attribute === attr)
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Template' : 'New Template'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configure how nodes appear on the canvas
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
                  placeholder="e.g., Network Devices, IP Addresses"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Merge Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="replace"
                      checked={mergeMode === 'replace'}
                      onChange={(e) => setMergeMode(e.target.value as 'replace')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Replace (override default template completely)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="merge"
                      checked={mergeMode === 'merge'}
                      onChange={(e) => setMergeMode(e.target.value as 'merge')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Merge (overlay on top of default template)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('attributes')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'attributes'
                      ? 'border-cyber-500 text-cyber-600 dark:text-cyber-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Attributes ({attributeDisplays.length})
                </button>
                <button
                  onClick={() => setActiveTab('nodeStyle')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'nodeStyle'
                      ? 'border-cyber-500 text-cyber-600 dark:text-cyber-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Node Style
                </button>
                <button
                  onClick={() => setActiveTab('layout')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === 'layout'
                      ? 'border-cyber-500 text-cyber-600 dark:text-cyber-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Layout
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === 'attributes' && (
                <AttributesTab
                  attributeDisplays={attributeDisplays}
                  unusedAttributes={unusedAttributes}
                  onAddAttribute={handleAddAttribute}
                  onRemoveAttribute={handleRemoveAttribute}
                  onUpdateAttribute={handleUpdateAttribute}
                  onMoveAttribute={handleMoveAttribute}
                />
              )}

              {activeTab === 'nodeStyle' && (
                <NodeStyleTab
                  nodeStyle={nodeStyle}
                  onUpdateNodeStyle={(updates) => setNodeStyle({ ...nodeStyle, ...updates })}
                />
              )}

              {activeTab === 'layout' && (
                <LayoutTab
                  layout={layout}
                  textStyle={textStyle}
                  onUpdateLayout={(updates) => setLayout({ ...layout, ...updates })}
                  onUpdateTextStyle={(updates) => setTextStyle({ ...textStyle, ...updates })}
                />
              )}
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

// ============================================================================
// ATTRIBUTES TAB
// ============================================================================

interface AttributesTabProps {
  attributeDisplays: AttributeDisplay[]
  unusedAttributes: string[]
  onAddAttribute: (attribute: string) => void
  onRemoveAttribute: (attribute: string) => void
  onUpdateAttribute: (attribute: string, updates: Partial<AttributeDisplay>) => void
  onMoveAttribute: (index: number, direction: 'up' | 'down') => void
}

function AttributesTab({
  attributeDisplays,
  unusedAttributes,
  onAddAttribute,
  onRemoveAttribute,
  onUpdateAttribute,
  onMoveAttribute,
}: AttributesTabProps) {
  return (
    <div className="space-y-4">
      {/* Add Attribute Dropdown */}
      {unusedAttributes.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add Attribute
          </label>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onAddAttribute(e.target.value)
                e.target.value = ''
              }
            }}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
          >
            <option value="">Select an attribute to add...</option>
            {unusedAttributes.map(attr => (
              <option key={attr} value={attr}>
                {attr === '__id__' ? 'Node ID (special)' : attr}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Attribute List */}
      {attributeDisplays.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No attributes added yet. Add attributes to configure how they appear on nodes.
        </div>
      ) : (
        <div className="space-y-2">
          {attributeDisplays.map((display, index) => (
            <AttributeDisplayCard
              key={display.attribute}
              display={display}
              index={index}
              totalCount={attributeDisplays.length}
              onUpdate={(updates) => onUpdateAttribute(display.attribute, updates)}
              onRemove={() => onRemoveAttribute(display.attribute)}
              onMove={(direction) => onMoveAttribute(index, direction)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// ATTRIBUTE DISPLAY CARD
// ============================================================================

interface AttributeDisplayCardProps {
  display: AttributeDisplay
  index: number
  totalCount: number
  onUpdate: (updates: Partial<AttributeDisplay>) => void
  onRemove: () => void
  onMove: (direction: 'up' | 'down') => void
}

function AttributeDisplayCard({
  display,
  index,
  totalCount,
  onUpdate,
  onRemove,
  onMove,
}: AttributeDisplayCardProps) {
  const [expanded, setExpanded] = useState(false)
  const { attributeTemplates } = useAttributeTemplateStore()

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onMove('up')}
            disabled={index === 0}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMove('down')}
            disabled={index === totalCount - 1}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={() => onUpdate({ visible: !display.visible })}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          {display.visible ? (
            <Eye className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </button>

        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {display.attribute}
          </div>
          {display.displayLabel && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Display as: {display.displayLabel}
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <button
          onClick={onRemove}
          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
        >
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Attribute Template
            </label>
            <select
              value={display.attributeTemplateId || ''}
              onChange={(e) => onUpdate({ attributeTemplateId: e.target.value || undefined })}
              className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded"
            >
              <option value="">Use default template</option>
              {attributeTemplates.filter(t => !t.isDefault).map(template => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All styling is managed via attribute templates. Create or edit templates in the Attribute Templates panel.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Label (optional)
            </label>
            <input
              type="text"
              value={display.displayLabel || ''}
              onChange={(e) => onUpdate({ displayLabel: e.target.value || undefined })}
              className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded"
              placeholder="Leave empty to use attribute name"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// NODE STYLE TAB
// ============================================================================

interface NodeStyleTabProps {
  nodeStyle: NodeVisualStyle
  onUpdateNodeStyle: (updates: Partial<NodeVisualStyle>) => void
}

function NodeStyleTab({ nodeStyle, onUpdateNodeStyle }: NodeStyleTabProps) {
  const [showIconPicker, setShowIconPicker] = useState(false)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      onUpdateNodeStyle({ imageUrl: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  const nodeShapes: NodeShape[] = [
    'ellipse',
    'triangle',
    'rectangle',
    'roundrectangle',
    'diamond',
    'pentagon',
    'hexagon',
    'octagon',
    'star',
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Configure the visual appearance of nodes. You can use shapes, icons, or custom images.
      </p>

      {/* Display Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Display Mode
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={!nodeStyle.icon && !nodeStyle.imageUrl}
              onChange={() => onUpdateNodeStyle({ icon: undefined, imageUrl: undefined })}
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Shape</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Use a geometric shape</div>
            </div>
          </label>

          <label className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={!!nodeStyle.icon}
              onChange={() => onUpdateNodeStyle({ icon: '📦', imageUrl: undefined })}
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Icon / Emoji</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Use an SVG icon or emoji</div>
            </div>
          </label>

          <label className="flex items-center gap-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={!!nodeStyle.imageUrl}
              onChange={() => {
                if (!nodeStyle.imageUrl) {
                  document.getElementById('image-upload')?.click()
                }
              }}
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">Custom Image</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Upload a PNG/JPG image</div>
            </div>
          </label>
        </div>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Shape Settings */}
      {!nodeStyle.icon && !nodeStyle.imageUrl && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Shape Settings</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Node Shape
            </label>
            <select
              value={nodeStyle.shape || 'ellipse'}
              onChange={(e) => onUpdateNodeStyle({ shape: e.target.value as NodeShape })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100"
            >
              {nodeShapes.map((shape) => (
                <option key={shape} value={shape}>
                  {shape.charAt(0).toUpperCase() + shape.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={nodeStyle.backgroundColor || '#3b82f6'}
                onChange={(e) => onUpdateNodeStyle({ backgroundColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Border Color
              </label>
              <input
                type="color"
                value={nodeStyle.borderColor || '#2563eb'}
                onChange={(e) => onUpdateNodeStyle({ borderColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Border Width (px)
              </label>
              <input
                type="number"
                value={nodeStyle.borderWidth || 2}
                onChange={(e) => onUpdateNodeStyle({ borderWidth: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100"
                min="0"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={nodeStyle.size || 1}
                onChange={(e) => onUpdateNodeStyle({ size: parseFloat(e.target.value) || 1 })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100"
                min="0.5"
                max="3"
              />
            </div>
          </div>
        </div>
      )}

      {/* Icon Settings */}
      {nodeStyle.icon && !nodeStyle.imageUrl && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Icon Settings</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon Type
            </label>

            {/* Show current icon */}
            {nodeStyle.icon.startsWith('/icons/') ? (
              <div className="mb-3 p-3 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg flex items-center gap-3">
                <img src={nodeStyle.icon} alt="Selected icon" className="w-12 h-12" />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">SVG Icon</span>
                <button
                  onClick={() => onUpdateNodeStyle({ icon: '' })}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="mb-3">
                <input
                  type="text"
                  value={nodeStyle.icon}
                  onChange={(e) => onUpdateNodeStyle({ icon: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100 text-2xl text-center"
                  placeholder="📦 🖥️ 🌐 ⚙️"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Emoji or unicode character
                </p>
              </div>
            )}

            {/* Browse SVG Icons button */}
            <button
              onClick={() => setShowIconPicker(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Smile className="w-4 h-4" />
              Browse SVG Icons
            </button>
          </div>

          {/* Icon Color (for SVG icons) */}
          {nodeStyle.icon.startsWith('/icons/') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon Color
              </label>
              <input
                type="color"
                value={nodeStyle.iconColor || '#000000'}
                onChange={(e) => onUpdateNodeStyle({ iconColor: e.target.value })}
                className="w-full h-10 rounded border border-gray-300 dark:border-gray-500 cursor-pointer"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Color for SVG icons (emojis use their default colors)
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Size Multiplier
            </label>
            <input
              type="number"
              step="0.1"
              value={nodeStyle.size || 2.5}
              onChange={(e) => onUpdateNodeStyle({ size: parseFloat(e.target.value) || 2.5 })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100"
              min="0.5"
              max="5"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Default: 2.5 (desktop icon size)
            </p>
          </div>
        </div>
      )}

      {/* Image Settings */}
      {nodeStyle.imageUrl && (
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Image Settings</h4>

          <div className="flex items-center gap-4">
            <img
              src={nodeStyle.imageUrl}
              alt="Node preview"
              className="w-24 h-24 object-contain border border-gray-300 dark:border-gray-500 rounded"
            />
            <div className="flex-1">
              <button
                onClick={() => document.getElementById('image-upload')?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-cyber-600 hover:bg-cyber-700 text-white rounded-lg transition-colors"
              >
                <Upload className="w-4 h-4" />
                Change Image
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Upload a PNG or JPG image
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Size Multiplier
            </label>
            <input
              type="number"
              step="0.1"
              value={nodeStyle.size || 1}
              onChange={(e) => onUpdateNodeStyle({ size: parseFloat(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-gray-100"
              min="0.5"
              max="3"
            />
          </div>
        </div>
      )}

      {/* Common Settings */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">Common Settings</h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Opacity: {(nodeStyle.opacity ?? 1).toFixed(2)}
          </label>
          <input
            type="range"
            value={nodeStyle.opacity ?? 1}
            onChange={(e) => onUpdateNodeStyle({ opacity: parseFloat(e.target.value) })}
            className="w-full"
            min="0"
            max="1"
            step="0.05"
          />
        </div>
      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          currentIcon={nodeStyle.icon}
          onSelect={(iconPath) => {
            onUpdateNodeStyle({ icon: iconPath })
            setShowIconPicker(false)
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  )
}

// ============================================================================
// LAYOUT TAB
// ============================================================================

interface LayoutTabProps {
  layout: CardLayoutSettings
  textStyle: CardTextStyle
  onUpdateLayout: (updates: Partial<CardLayoutSettings>) => void
  onUpdateTextStyle: (updates: Partial<CardTextStyle>) => void
}

function LayoutTab({ layout, textStyle, onUpdateLayout, onUpdateTextStyle }: LayoutTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Width (px)
          </label>
          <input
            type="number"
            value={layout.maxWidth || 240}
            onChange={(e) => onUpdateLayout({ maxWidth: parseInt(e.target.value) || 240 })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
            min="100"
            max="500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Line Height
          </label>
          <input
            type="number"
            step="0.1"
            value={layout.lineHeight || 1.2}
            onChange={(e) => onUpdateLayout({ lineHeight: parseFloat(e.target.value) || 1.2 })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
            min="1.0"
            max="2.0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Padding (px)
          </label>
          <input
            type="number"
            value={layout.padding || 4}
            onChange={(e) => onUpdateLayout({ padding: parseInt(e.target.value) || 4 })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
            min="0"
            max="20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Text Alignment
          </label>
          <select
            value={layout.textAlign || 'center'}
            onChange={(e) => onUpdateLayout({ textAlign: e.target.value as 'left' | 'center' | 'right' })}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Separator
        </label>
        <select
          value={layout.separator === '\n' ? 'newline' : 'custom'}
          onChange={(e) => {
            if (e.target.value === 'newline') {
              onUpdateLayout({ separator: '\n' })
            }
          }}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
        >
          <option value="newline">New line</option>
          <option value="custom">Custom</option>
        </select>
        {layout.separator !== '\n' && (
          <input
            type="text"
            value={layout.separator || ', '}
            onChange={(e) => onUpdateLayout({ separator: e.target.value })}
            className="w-full px-3 py-2 mt-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
            placeholder="e.g., ', ' or ' | '"
          />
        )}
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={layout.showLabels || false}
            onChange={(e) => onUpdateLayout({ showLabels: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show attribute labels (name: value) instead of just values
          </span>
        </label>
      </div>

      {/* Text Style & Effects */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Text Style & Effects
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Size (px)
            </label>
            <input
              type="number"
              value={textStyle.fontSize || 11}
              onChange={(e) => onUpdateTextStyle({ fontSize: parseInt(e.target.value) || 11 })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              min="8"
              max="32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Family
            </label>
            <select
              value={textStyle.fontFamily || 'inherit'}
              onChange={(e) => onUpdateTextStyle({ fontFamily: e.target.value === 'inherit' ? undefined : e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
            >
              <option value="inherit">Default</option>
              <option value="Arial, sans-serif">Arial</option>
              <option value="'Courier New', monospace">Courier New</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Times New Roman', serif">Times New Roman</option>
              <option value="Verdana, sans-serif">Verdana</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Color
            </label>
            <input
              type="color"
              value={textStyle.color || '#1f2937'}
              onChange={(e) => onUpdateTextStyle({ color: e.target.value })}
              className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Weight
            </label>
            <select
              value={textStyle.fontWeight || 'normal'}
              onChange={(e) => onUpdateTextStyle({ fontWeight: e.target.value as 'normal' | 'bold' })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Style
            </label>
            <select
              value={textStyle.fontStyle || 'normal'}
              onChange={(e) => onUpdateTextStyle({ fontStyle: e.target.value as 'normal' | 'italic' })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Decoration
            </label>
            <select
              value={textStyle.textDecoration || 'none'}
              onChange={(e) => onUpdateTextStyle({ textDecoration: e.target.value as 'none' | 'underline' | 'line-through' })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
            >
              <option value="none">None</option>
              <option value="underline">Underline</option>
              <option value="line-through">Line Through</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Text Shadow / Glow
          </label>
          <input
            type="text"
            value={textStyle.textShadow || ''}
            onChange={(e) => onUpdateTextStyle({ textShadow: e.target.value || undefined })}
            placeholder="e.g., 0 0 5px #00ff00"
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            CSS text-shadow syntax: horizontal vertical blur color
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Outline Width (px)
            </label>
            <input
              type="number"
              value={textStyle.textOutlineWidth || 0}
              onChange={(e) => onUpdateTextStyle({ textOutlineWidth: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              min="0"
              max="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Outline Color
            </label>
            <input
              type="color"
              value={textStyle.textOutlineColor || '#ffffff'}
              onChange={(e) => onUpdateTextStyle({ textOutlineColor: e.target.value })}
              className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
