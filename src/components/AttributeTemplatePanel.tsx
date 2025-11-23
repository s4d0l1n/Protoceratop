/**
 * Attribute Template Panel
 * Manage reusable styling templates for attributes
 */

import { useState } from 'react'
import { X, Plus, Edit2, Trash2, Star } from 'lucide-react'
import { useAttributeTemplateStore } from '../stores/attributeTemplateStore'
import { useUIStore } from '../stores/uiStore'
import type { AttributeTemplate } from '../types'

export function AttributeTemplatePanel() {
  const { attributeTemplates, addAttributeTemplate, updateAttributeTemplate, removeAttributeTemplate, setDefaultTemplate } = useAttributeTemplateStore()
  const { closePanel } = useUIStore()
  const [editingTemplate, setEditingTemplate] = useState<AttributeTemplate | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  // Handle saving templates
  const handleSave = (template: AttributeTemplate) => {
    if (template.id && attributeTemplates.some(t => t.id === template.id)) {
      updateAttributeTemplate(template.id, template)
    } else {
      addAttributeTemplate(template)
    }
    setEditingTemplate(null)
    setShowAddForm(false)
  }

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-white dark:bg-gray-900 shadow-2xl z-40 flex flex-col border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Attribute Templates
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {attributeTemplates.length} templates • {attributeTemplates.filter((t) => t.isDefault).length} default
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => closePanel('attributeTemplatePanel')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {attributeTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => setEditingTemplate(template)}
              onDelete={() => removeAttributeTemplate(template.id)}
              onSetDefault={() => setDefaultTemplate(template.id)}
            />
          ))}
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-cyber-500 dark:hover:border-cyber-500 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-cyber-600 dark:hover:text-cyber-400"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Attribute Template
          </button>
        </div>
      </div>

      {/* Editor Modal */}
      {(showAddForm || editingTemplate) && (
        <AttributeTemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onCancel={() => {
            setShowAddForm(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: AttributeTemplate
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}

function TemplateCard({ template, onEdit, onDelete, onSetDefault }: TemplateCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {template.name}
            </h4>
            {template.isDefault && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                <Star className="w-3 h-3" />
                Default
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {template.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!template.isDefault && (
            <button
              onClick={onSetDefault}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Set as default"
            >
              <Star className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Edit template"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {!template.isDefault && (
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Delete template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Font:</span>
          <p className="mt-0.5">{template.fontSize || 12}px {template.fontFamily || 'default'}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Color:</span>
          <div className="flex items-center gap-1 mt-0.5">
            <div
              className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: template.color || '#ffffff' }}
            />
            <span>{template.color || 'default'}</span>
          </div>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Effects:</span>
          <p className="mt-0.5">
            {template.textShadow ? 'Shadow' : 'None'}
            {template.textOutlineWidth ? ' + Outline' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

// AttributeTemplateEditor will be very similar to the styling section in CardTemplateEditor
// For now, I'll create a placeholder that we'll expand
interface AttributeTemplateEditorProps {
  template: AttributeTemplate | null
  onSave: (template: AttributeTemplate) => void
  onCancel: () => void
}

function AttributeTemplateEditor({ template, onSave, onCancel }: AttributeTemplateEditorProps) {
  const isEditing = !!template

  const [name, setName] = useState(template?.name || '')
  const [description, setDescription] = useState(template?.description || '')

  // All styling properties
  const [labelPrefix, setLabelPrefix] = useState(template?.labelPrefix || '')
  const [labelSuffix, setLabelSuffix] = useState(template?.labelSuffix || '')
  const [fontSize, setFontSize] = useState(template?.fontSize || 12)
  const [fontFamily, setFontFamily] = useState(template?.fontFamily || '')
  const [color, setColor] = useState(template?.color || '#ffffff')
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>(template?.fontWeight || 'normal')
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>(template?.fontStyle || 'normal')
  const [textDecoration, setTextDecoration] = useState<'none' | 'underline' | 'line-through'>(template?.textDecoration || 'none')
  const [textShadow, setTextShadow] = useState(template?.textShadow || '')
  const [textOutlineWidth, setTextOutlineWidth] = useState(template?.textOutlineWidth || 0)
  const [textOutlineColor, setTextOutlineColor] = useState(template?.textOutlineColor || '#000000')
  const [backgroundColor, setBackgroundColor] = useState(template?.backgroundColor || '')
  const [backgroundPadding, setBackgroundPadding] = useState(template?.backgroundPadding || 0)
  const [borderRadius, setBorderRadius] = useState(template?.borderRadius || 0)

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a template name')
      return
    }

    const newTemplate: AttributeTemplate = {
      id: template?.id || `attr-template-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      isDefault: template?.isDefault || false,
      labelPrefix: labelPrefix || undefined,
      labelSuffix: labelSuffix || undefined,
      fontSize: fontSize || undefined,
      fontFamily: fontFamily || undefined,
      color: color || undefined,
      fontWeight,
      fontStyle,
      textDecoration,
      textShadow: textShadow || undefined,
      textOutlineWidth: textOutlineWidth || undefined,
      textOutlineColor: textOutlineColor || undefined,
      backgroundColor: backgroundColor || undefined,
      backgroundPadding: backgroundPadding || undefined,
      borderRadius: borderRadius || undefined,
    }

    onSave(newTemplate)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isEditing ? 'Edit Attribute Template' : 'New Attribute Template'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Create reusable styling that can be applied to any attribute
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyber-500 focus:border-transparent text-gray-900 dark:text-gray-100"
              placeholder="e.g., IP Address Style, Timestamp Style"
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
              placeholder="Optional description of this template"
            />
          </div>

          {/* Label Prefix/Suffix */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Label Prefix
              </label>
              <input
                type="text"
                value={labelPrefix}
                onChange={(e) => setLabelPrefix(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                placeholder="e.g., 📍, →"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Label Suffix
              </label>
              <input
                type="text"
                value={labelSuffix}
                onChange={(e) => setLabelSuffix(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                placeholder="e.g., :, *"
              />
            </div>
          </div>

          {/* Font Settings */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size (px)
              </label>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
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
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="">Default</option>
                <option value="monospace">Monospace</option>
                <option value="serif">Serif</option>
                <option value="sans-serif">Sans Serif</option>
                <option value="cursive">Cursive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Font Style */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Weight
              </label>
              <select
                value={fontWeight}
                onChange={(e) => setFontWeight(e.target.value as 'normal' | 'bold')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Style
              </label>
              <select
                value={fontStyle}
                onChange={(e) => setFontStyle(e.target.value as 'normal' | 'italic')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="normal">Normal</option>
                <option value="italic">Italic</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Decoration
              </label>
              <select
                value={textDecoration}
                onChange={(e) => setTextDecoration(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="line-through">Strike</option>
              </select>
            </div>
          </div>

          {/* Text Effects - Simplified with presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Shadow / Glow
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => setTextShadow('0 0 10px #00ff00, 0 0 20px #00ff00')}
                className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                Green Glow
              </button>
              <button
                type="button"
                onClick={() => setTextShadow('0 0 10px #00ffff, 0 0 20px #00ffff')}
                className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                Cyan Glow
              </button>
              <button
                type="button"
                onClick={() => setTextShadow('2px 2px 4px rgba(0,0,0,0.8)')}
                className="px-3 py-2 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                Drop Shadow
              </button>
            </div>
            <input
              type="text"
              value={textShadow}
              onChange={(e) => setTextShadow(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
              placeholder="Custom CSS or use presets above"
            />
          </div>

          {/* Text Outline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Outline Width
              </label>
              <input
                type="number"
                value={textOutlineWidth}
                onChange={(e) => setTextOutlineWidth(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                min="0"
                max="5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Outline Color
              </label>
              <input
                type="color"
                value={textOutlineColor}
                onChange={(e) => setTextOutlineColor(e.target.value)}
                className="w-full h-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Background */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Background Color
              </label>
              <input
                type="color"
                value={backgroundColor || '#000000'}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-10 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Padding
              </label>
              <input
                type="number"
                value={backgroundPadding}
                onChange={(e) => setBackgroundPadding(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                min="0"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Border Radius
              </label>
              <input
                type="number"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
                min="0"
                max="20"
              />
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
