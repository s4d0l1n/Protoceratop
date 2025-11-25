import { useState } from 'react'
import { X, Plus, Edit, Trash2, GripVertical, Power, PowerOff } from 'lucide-react'
import { useUIStore } from '@/stores/uiStore'
import { useRulesStore } from '@/stores/rulesStore'
import { RuleEditor } from './RuleEditor'
import { toast } from './Toast'
import type { StyleRule } from '@/types'

/**
 * Style rules management panel
 * List view with drag-to-reorder and CRUD operations
 */
export function RulesPanel() {
  const { activePanel, setActivePanel } = useUIStore()
  const {
    styleRules,
    addRule,
    updateRule,
    removeRule,
    toggleRuleEnabled,
    reorderRules,
  } = useRulesStore()

  const [editingRule, setEditingRule] = useState<StyleRule | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const isOpen = activePanel === 'styles'

  // Sort rules by order
  const sortedRules = [...styleRules].sort((a, b) => a.order - b.order)

  if (!isOpen) return null

  const handleClose = () => {
    setActivePanel(null)
  }

  const handleNewRule = () => {
    setEditingRule(null)
    setShowEditor(true)
  }

  const handleEditRule = (rule: StyleRule) => {
    setEditingRule(rule)
    setShowEditor(true)
  }

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      removeRule(ruleId)
      toast.success('Rule deleted')
    }
  }

  const handleToggleEnabled = (ruleId: string) => {
    toggleRuleEnabled(ruleId)
  }

  const handleSaveRule = (rule: StyleRule) => {
    if (editingRule) {
      updateRule(rule.id, rule)
      toast.success('Rule updated')
    } else {
      addRule(rule)
      toast.success('Rule created')
    }
    setShowEditor(false)
    setEditingRule(null)
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Reorder rules
    const newRules = [...sortedRules]
    const [draggedItem] = newRules.splice(draggedIndex, 1)
    newRules.splice(index, 0, draggedItem)

    reorderRules(newRules)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const getRuleActionLabel = (rule: StyleRule): string => {
    switch (rule.action) {
      case 'apply_card_template':
        return `Apply template: ${rule.actionParams.templateId || 'None'}`
      case 'apply_edge_template':
        return `Apply edge template: ${rule.actionParams.templateId || 'None'}`
      case 'add_tag':
        return `Add tag: ${rule.actionParams.tagName || 'None'}`
      default:
        return 'Unknown action'
    }
  }

  const getRuleConditionLabel = (rule: StyleRule): string => {
    const { attribute, operator, value } = rule.condition
    let operatorLabel = operator.replace(/_/g, ' ')
    operatorLabel = operatorLabel.charAt(0).toUpperCase() + operatorLabel.slice(1)

    if (value) {
      return `${attribute} ${operatorLabel} "${value}"`
    }
    return `${attribute} ${operatorLabel}`
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
        <div className="bg-dark-secondary border border-dark rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Style Rules</h2>
              <p className="text-sm text-slate-400 mt-1">
                Conditional styling with priority ordering (drag to reorder)
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
            {/* New Rule Button */}
            <button
              onClick={handleNewRule}
              className="w-full p-4 bg-dark hover:bg-dark-secondary border-2 border-dashed border-dark hover:border-cyber-500 rounded-lg transition-colors flex items-center justify-center gap-2 text-slate-400 hover:text-cyber-500 mb-4"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create New Rule</span>
            </button>

            {/* Rules List */}
            {sortedRules.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-2">No rules yet</div>
                <div className="text-sm text-slate-500">
                  Create your first rule to conditionally style nodes and edges
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 bg-dark border rounded-lg transition-all cursor-move ${
                      draggedIndex === index
                        ? 'border-cyber-500 opacity-50'
                        : rule.enabled
                        ? 'border-dark hover:border-slate-600'
                        : 'border-dark opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Drag Handle */}
                      <div className="flex-shrink-0 pt-1 cursor-move">
                        <GripVertical className="w-5 h-5 text-slate-500" />
                      </div>

                      {/* Order Badge */}
                      <div className="flex-shrink-0 w-8 h-8 bg-dark-secondary rounded flex items-center justify-center text-sm font-medium text-slate-400">
                        {index + 1}
                      </div>

                      {/* Rule Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-100 truncate">
                            {rule.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 text-xs rounded ${
                              rule.target === 'nodes'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}
                          >
                            {rule.target}
                          </span>
                        </div>
                        <div className="text-sm text-slate-400 mb-1">
                          <span className="font-medium">When:</span>{' '}
                          {getRuleConditionLabel(rule)}
                        </div>
                        <div className="text-sm text-slate-400">
                          <span className="font-medium">Then:</span> {getRuleActionLabel(rule)}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleEnabled(rule.id)}
                          className={`p-2 rounded transition-colors ${
                            rule.enabled
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
                          }`}
                          title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                        >
                          {rule.enabled ? (
                            <Power className="w-4 h-4" />
                          ) : (
                            <PowerOff className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="p-2 bg-dark-secondary hover:bg-dark text-slate-300 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-2 bg-dark-secondary hover:bg-red-500/20 text-red-400 rounded transition-colors"
                          title="Delete"
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

          {/* Footer */}
          <div className="p-4 border-t border-dark bg-dark">
            <div className="text-sm text-slate-400">
              <span className="font-medium">{sortedRules.length}</span> rule
              {sortedRules.length !== 1 ? 's' : ''} •{' '}
              <span className="font-medium">
                {sortedRules.filter((r) => r.enabled).length}
              </span>{' '}
              enabled • Rules are evaluated in order (top to bottom)
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <RuleEditor
          rule={editingRule}
          onClose={() => {
            setShowEditor(false)
            setEditingRule(null)
          }}
          onSave={handleSaveRule}
        />
      )}
    </>
  )
}
