/**
 * Card Template Panel
 * Manage card templates for node display customization
 */

import { useState } from 'react'
import { X, Plus, Edit2, Trash2, Star } from 'lucide-react'
import { useCardTemplateStore } from '../stores/cardTemplateStore'
import { useGraphStore } from '../stores/graphStore'
import { useUIStore } from '../stores/uiStore'
import { CardTemplateEditor } from './CardTemplateEditor'
import type { CardTemplate } from '../types'

export function CardTemplatePanel() {
  const { cardTemplates, addCardTemplate, updateCardTemplate, removeCardTemplate, setDefaultTemplate } = useCardTemplateStore()
  const { getAllAttributeNames } = useGraphStore()
  const { closePanel } = useUIStore()
  const [editingTemplate, setEditingTemplate] = useState<CardTemplate | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const allAttributes = getAllAttributeNames()

  // Handle saving a new template
  const handleSaveNew = (template: CardTemplate) => {
    addCardTemplate(template)
    setShowAddForm(false)
  }

  // Handle updating an existing template
  const handleSaveEdit = (template: CardTemplate) => {
    updateCardTemplate(template.id, template)
    setEditingTemplate(null)
  }

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-white dark:bg-gray-900 shadow-2xl z-40 flex flex-col border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Card Templates
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {cardTemplates.length} templates • {cardTemplates.filter((t) => t.isDefault).length} default
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => closePanel('cardTemplatePanel')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {cardTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => setEditingTemplate(template)}
              onDelete={() => removeCardTemplate(template.id)}
              onSetDefault={() => setDefaultTemplate(template.id)}
            />
          ))}
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-cyber-500 dark:hover:border-cyber-500 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-cyber-600 dark:hover:text-cyber-400"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Card Template
          </button>
        </div>
      </div>

      {/* Add/Edit Form Modals */}
      {showAddForm && (
        <CardTemplateEditor
          template={null}
          availableAttributes={allAttributes}
          onSave={handleSaveNew}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingTemplate && (
        <CardTemplateEditor
          template={editingTemplate}
          availableAttributes={allAttributes}
          onSave={handleSaveEdit}
          onCancel={() => setEditingTemplate(null)}
        />
      )}
    </div>
  )
}

interface TemplateCardProps {
  template: CardTemplate
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
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {template.attributeDisplays.filter(d => d.visible).length} visible attributes • {template.mergeMode} mode
          </p>
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

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Layout:</span>
          <p className="text-xs mt-1">
            {template.layout.showLabels ? 'With labels' : 'Values only'} • {template.layout.textAlign}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Groups:</span>
          <p className="text-xs mt-1">
            {template.attributeGroups?.length || 0} attribute groups
          </p>
        </div>
      </div>
    </div>
  )
}
