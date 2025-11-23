/**
 * Edge Template Panel
 * Manages edge templates for line styling
 */

import { useState } from 'react'
import { Plus, Edit2, Trash2, Star, X } from 'lucide-react'
import { useEdgeTemplateStore } from '../stores/edgeTemplateStore'
import { useUIStore } from '../stores/uiStore'
import { EdgeTemplateEditor } from './EdgeTemplateEditor'
import type { EdgeTemplate } from '../types'

export function EdgeTemplatePanel() {
  const { edgeTemplates, addEdgeTemplate, updateEdgeTemplate, removeEdgeTemplate, setDefaultTemplate } = useEdgeTemplateStore()
  const { closePanel } = useUIStore()
  const [editingTemplate, setEditingTemplate] = useState<EdgeTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleSave = (template: EdgeTemplate) => {
    if (editingTemplate) {
      updateEdgeTemplate(template.id, template)
    } else {
      addEdgeTemplate(template)
    }
    setEditingTemplate(null)
    setIsCreating(false)
  }

  const handleDelete = (id: string) => {
    const template = edgeTemplates.find(t => t.id === id)
    if (template?.isDefault) {
      alert('Cannot delete the default template')
      return
    }
    if (confirm('Are you sure you want to delete this edge template?')) {
      removeEdgeTemplate(id)
    }
  }

  const handleSetDefault = (id: string) => {
    setDefaultTemplate(id)
  }

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-1/2 bg-white dark:bg-gray-900 shadow-2xl z-40 flex flex-col border-l border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Edge Templates
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {edgeTemplates.length} templates • Define reusable styles for edges/lines
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => closePanel('edgeTemplatePanel')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {edgeTemplates.map((template) => (
              <EdgeTemplateCard
                key={template.id}
                template={template}
                onEdit={() => setEditingTemplate(template)}
                onDelete={() => handleDelete(template.id)}
                onSetDefault={() => handleSetDefault(template.id)}
              />
            ))}
            <button
              onClick={() => setIsCreating(true)}
              className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-cyber-500 dark:hover:border-cyber-500 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-cyber-600 dark:hover:text-cyber-400"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Edge Template
            </button>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {(isCreating || editingTemplate) && (
        <EdgeTemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onCancel={() => {
            setIsCreating(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </>
  )
}

// ============================================================================
// EDGE TEMPLATE CARD
// ============================================================================

interface EdgeTemplateCardProps {
  template: EdgeTemplate
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}

function EdgeTemplateCard({ template, onEdit, onDelete, onSetDefault }: EdgeTemplateCardProps) {
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
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Delete template"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          )}
        </div>
      </div>

      {/* Visual Preview */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-12 h-0.5"
                style={{
                  backgroundColor: template.lineColor,
                  borderStyle: template.lineStyle,
                  borderWidth: template.lineStyle !== 'solid' ? '1px 0 0 0' : '0',
                  height: template.lineStyle === 'solid' ? `${template.lineWidth}px` : '0',
                  paddingTop: template.lineStyle !== 'solid' ? `${template.lineWidth}px` : '0',
                  opacity: template.opacity,
                }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {template.lineWidth}px {template.lineStyle}
              </span>
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              Arrow: {template.arrowShape}
            </span>
          </div>
          {template.label && (
            <span className="text-gray-600 dark:text-gray-400">
              Label: "{template.label}"
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
