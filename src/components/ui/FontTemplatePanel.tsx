import { useState } from 'react'
import { X, Plus, Edit, Trash2, Star } from 'lucide-react'
import { useTemplateStore } from '@/stores/templateStore'
import { useUIStore } from '@/stores/uiStore'
import { FontTemplateEditor } from './FontTemplateEditor'
import type { FontTemplate } from '@/types'

/**
 * Font template management panel
 * List, create, edit, delete font templates
 */
export function FontTemplatePanel() {
  const { activePanel, setActivePanel } = useUIStore()
  const {
    fontTemplates,
    addFontTemplate,
    updateFontTemplate,
    removeFontTemplate,
    setDefaultFontTemplate,
  } = useTemplateStore()

  const [editingTemplate, setEditingTemplate] = useState<FontTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const isOpen = activePanel === 'font-templates'

  if (!isOpen) return null

  const handleCreate = () => {
    setEditingTemplate(null)
    setShowEditor(true)
  }

  const handleEdit = (template: FontTemplate) => {
    setEditingTemplate(template)
    setShowEditor(true)
  }

  const handleSave = (template: FontTemplate) => {
    if (editingTemplate) {
      updateFontTemplate(template.id, template)
    } else {
      addFontTemplate(template)
    }
    setShowEditor(false)
    setEditingTemplate(null)
  }

  const handleDelete = (templateId: string) => {
    if (confirm('Are you sure you want to delete this font template?')) {
      removeFontTemplate(templateId)
    }
  }

  const handleSetDefault = (templateId: string) => {
    setDefaultFontTemplate(templateId)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setActivePanel(null)}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 left-0 w-[500px] bg-dark-secondary border-r border-dark z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Font Templates</h2>
            <p className="text-sm text-slate-400">
              Style text with custom fonts and effects
            </p>
          </div>
          <button
            onClick={() => setActivePanel(null)}
            className="p-2 rounded-lg hover:bg-dark transition-colors text-slate-400 hover:text-slate-200"
            title="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyber-500 hover:bg-cyber-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>

        {/* Template List */}
        {fontTemplates.length === 0 ? (
          <div className="text-center py-12 bg-dark-secondary border border-dark rounded-lg">
            <p className="text-slate-400 mb-4">No font templates yet</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-cyber-500 hover:bg-cyber-600 text-white rounded-lg transition-colors"
            >
              Create Your First Template
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {fontTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 bg-dark-secondary border border-dark rounded-lg hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-100">
                        {template.name}
                      </h3>
                      {template.isDefault && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-slate-400 mb-3">
                        {template.description}
                      </p>
                    )}

                    {/* Preview */}
                    <div className="p-3 bg-dark border border-dark rounded">
                      <div
                        style={{
                          fontFamily: template.fontFamily,
                          fontSize: `${template.fontSize}rem`,
                          fontWeight: template.fontWeight,
                          fontStyle: template.fontStyle,
                          color: template.color,
                          backgroundColor: template.backgroundColor || 'transparent',
                          textDecoration: template.textDecoration,
                          textTransform: template.textTransform,
                          textShadow: template.textShadow?.enabled
                            ? `${template.textShadow.offsetX}px ${template.textShadow.offsetY}px ${template.textShadow.blur}px ${template.textShadow.color}`
                            : 'none',
                          padding: template.backgroundColor ? '0.25rem 0.5rem' : '0',
                          borderRadius: template.backgroundColor ? '0.25rem' : '0',
                          display: 'inline-block',
                        }}
                      >
                        Sample Text
                      </div>
                    </div>

                    {/* Properties Summary */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-dark rounded text-xs text-slate-400">
                        {template.fontFamily}
                      </span>
                      <span className="px-2 py-1 bg-dark rounded text-xs text-slate-400">
                        {template.fontSize}x
                      </span>
                      <span className="px-2 py-1 bg-dark rounded text-xs text-slate-400">
                        {template.fontWeight}
                      </span>
                      {template.fontStyle !== 'normal' && (
                        <span className="px-2 py-1 bg-dark rounded text-xs text-slate-400">
                          {template.fontStyle}
                        </span>
                      )}
                      {template.textDecoration !== 'none' && (
                        <span className="px-2 py-1 bg-dark rounded text-xs text-slate-400">
                          {template.textDecoration}
                        </span>
                      )}
                      {template.textTransform !== 'none' && (
                        <span className="px-2 py-1 bg-dark rounded text-xs text-slate-400">
                          {template.textTransform}
                        </span>
                      )}
                      {template.textShadow?.enabled && (
                        <span className="px-2 py-1 bg-dark rounded text-xs text-cyan-400">
                          shadow
                        </span>
                      )}
                      {template.effects?.glow?.enabled && (
                        <span className="px-2 py-1 bg-dark rounded text-xs text-cyan-400">
                          glow
                        </span>
                      )}
                      {template.effects?.gradient?.enabled && (
                        <span className="px-2 py-1 bg-dark rounded text-xs text-cyan-400">
                          gradient
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    {!template.isDefault && (
                      <button
                        onClick={() => handleSetDefault(template.id)}
                        className="p-2 rounded-lg hover:bg-dark transition-colors text-slate-400 hover:text-yellow-500"
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 rounded-lg hover:bg-dark transition-colors text-slate-400 hover:text-slate-200"
                      title="Edit template"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 rounded-lg hover:bg-dark transition-colors text-slate-400 hover:text-red-500"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <FontTemplateEditor
          template={editingTemplate}
          onClose={() => {
            setShowEditor(false)
            setEditingTemplate(null)
          }}
          onSave={handleSave}
        />
      )}
    </>
  )
}
