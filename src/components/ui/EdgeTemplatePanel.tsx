import { useState } from 'react'
import { X, Plus, Edit, Trash2, Star, Copy } from 'lucide-react'
import { useTemplateStore } from '@/stores/templateStore'
import { useGraphStore } from '@/stores/graphStore'
import { useUIStore } from '@/stores/uiStore'
import { EdgeTemplateEditor } from './EdgeTemplateEditor'
import { toast } from './Toast'
import type { EdgeTemplate } from '@/types'

/**
 * Edge template management panel
 * List view with CRUD operations
 */
export function EdgeTemplatePanel() {
  const { activePanel, setActivePanel } = useUIStore()
  const {
    edgeTemplates,
    addEdgeTemplate,
    updateEdgeTemplate,
    removeEdgeTemplate,
    setDefaultEdgeTemplate,
  } = useTemplateStore()
  const { edges } = useGraphStore()

  const [editingTemplate, setEditingTemplate] = useState<EdgeTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const isOpen = activePanel === 'edge-templates'

  if (!isOpen) return null

  const handleClose = () => {
    setActivePanel(null)
  }

  const handleNewTemplate = () => {
    setEditingTemplate(null)
    setShowEditor(true)
  }

  const handleEditTemplate = (template: EdgeTemplate) => {
    setEditingTemplate(template)
    setShowEditor(true)
  }

  const handleDuplicateTemplate = (template: EdgeTemplate) => {
    const newTemplate: EdgeTemplate = {
      ...template,
      id: `edge-template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdAt: Date.now(),
    }
    addEdgeTemplate(newTemplate)
    toast.success('Template duplicated')
  }

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      removeEdgeTemplate(templateId)
      toast.success('Template deleted')
    }
  }

  const handleSetDefault = (templateId: string) => {
    setDefaultEdgeTemplate(templateId)
    toast.success('Default template updated')
  }

  const handleSaveTemplate = (template: EdgeTemplate) => {
    if (editingTemplate) {
      updateEdgeTemplate(template.id, template)
      toast.success('Template updated')
    } else {
      addEdgeTemplate(template)
      toast.success('Template created')
    }
    setShowEditor(false)
    setEditingTemplate(null)
  }

  const renderLineStylePreview = (template: EdgeTemplate) => {
    return (
      <svg width="80" height="40" className="mx-auto">
        <line
          x1="10"
          y1="20"
          x2="70"
          y2="20"
          stroke={template.color}
          strokeWidth={template.width}
          strokeDasharray={
            template.style === 'dashed' ? '6,3' : template.style === 'dotted' ? '2,3' : undefined
          }
          opacity={template.opacity}
        />
        {/* Arrow */}
        {template.arrowType !== 'none' && (
          <>
            {template.arrowType === 'default' && (
              <polygon points="70,20 62,17 62,23" fill={template.color} opacity={template.opacity} />
            )}
            {template.arrowType === 'triangle' && (
              <polygon points="70,20 58,15 58,25" fill={template.color} opacity={template.opacity} />
            )}
            {template.arrowType === 'circle' && (
              <circle cx="70" cy="20" r="3" fill={template.color} opacity={template.opacity} />
            )}
          </>
        )}
      </svg>
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
        <div className="bg-dark-secondary border border-dark rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Edge Templates</h2>
              <p className="text-sm text-slate-400 mt-1">
                Create and manage visual styles for your edges
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
            {/* New Template Button */}
            <button
              onClick={handleNewTemplate}
              className="w-full p-4 bg-dark hover:bg-dark-secondary border-2 border-dashed border-dark hover:border-cyber-500 rounded-lg transition-colors flex items-center justify-center gap-2 text-slate-400 hover:text-cyber-500 mb-4"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create New Edge Template</span>
            </button>

            {/* Template List */}
            {edgeTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-2">No edge templates yet</div>
                <div className="text-sm text-slate-500">
                  Create your first template to customize edge appearance
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {edgeTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 bg-dark border border-dark rounded-lg hover:border-slate-600 transition-colors"
                  >
                    {/* Template Preview */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-100 truncate flex-1">
                          {template.name}
                        </h3>
                        {template.isDefault && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                        )}
                      </div>

                      {/* Visual Preview */}
                      <div className="bg-dark-secondary rounded p-3 mb-2">
                        {renderLineStylePreview(template)}
                      </div>

                      {/* Description */}
                      {template.description && (
                        <p className="text-sm text-slate-400 line-clamp-2 mb-2">
                          {template.description}
                        </p>
                      )}

                      {/* Properties */}
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>Style: {template.style} • Width: {template.width}px</div>
                        <div>Arrow: {template.arrowType} • Opacity: {Math.round(template.opacity * 100)}%</div>
                        {template.label && <div>Label: "{template.label}"</div>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="flex-1 px-3 py-1.5 bg-dark-secondary hover:bg-dark text-slate-300 rounded text-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="flex-1 px-3 py-1.5 bg-dark-secondary hover:bg-dark text-slate-300 rounded text-sm transition-colors flex items-center justify-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Duplicate
                      </button>
                      {!template.isDefault && (
                        <button
                          onClick={() => handleSetDefault(template.id)}
                          className="px-3 py-1.5 bg-dark-secondary hover:bg-dark text-slate-300 rounded text-sm transition-colors"
                          title="Set as default"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="px-3 py-1.5 bg-dark-secondary hover:bg-red-500/20 text-red-400 rounded text-sm transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-dark bg-dark">
            <div className="text-sm text-slate-400">
              <span className="font-medium">{edgeTemplates.length}</span> edge template
              {edgeTemplates.length !== 1 ? 's' : ''} •{' '}
              <span className="font-medium">{edges.length}</span> edge
              {edges.length !== 1 ? 's' : ''} in graph
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <EdgeTemplateEditor
          template={editingTemplate}
          onClose={() => {
            setShowEditor(false)
            setEditingTemplate(null)
          }}
          onSave={handleSaveTemplate}
        />
      )}
    </>
  )
}
