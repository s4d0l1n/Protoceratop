import { useState, useMemo } from 'react'
import { X } from 'lucide-react'
import { useGraphStore } from '@/stores/graphStore'
import { useTemplateStore } from '@/stores/templateStore'
import { getConditionOperators } from '@/lib/styleEvaluator'
import type { StyleRule, RuleAction, ConditionOperator } from '@/types'

interface RuleEditorProps {
  rule: StyleRule | null
  onClose: () => void
  onSave: (rule: StyleRule) => void
}

/**
 * Rule editor component
 * UI for creating/editing conditional style rules
 */
export function RuleEditor({ rule, onClose, onSave }: RuleEditorProps) {
  const { nodes } = useGraphStore()
  const { cardTemplates, edgeTemplates, fontTemplates } = useTemplateStore()

  const operators = getConditionOperators()

  // Form state
  const [name, setName] = useState(rule?.name || '')
  const [enabled, setEnabled] = useState(rule?.enabled ?? true)
  const [target, setTarget] = useState<'nodes' | 'edges'>(rule?.target || 'nodes')
  const [attribute, setAttribute] = useState(rule?.condition.attribute || '')
  const [operator, setOperator] = useState<ConditionOperator>(
    rule?.condition.operator || 'equals'
  )
  const [value, setValue] = useState(rule?.condition.value || '')
  const [action, setAction] = useState<RuleAction>(rule?.action || 'apply_card_template')
  const [templateId, setTemplateId] = useState(rule?.actionParams.templateId || '')
  const [tagName, setTagName] = useState(rule?.actionParams.tagName || '')

  // Get available attributes
  const availableAttributes = useMemo(() => {
    const attrSet = new Set<string>()
    if (target === 'nodes') {
      nodes.forEach((node) => {
        Object.keys(node.attributes).forEach((key) => attrSet.add(key))
      })
    } else {
      // For edges, add source/target/label
      attrSet.add('source')
      attrSet.add('target')
      attrSet.add('label')
    }
    return Array.from(attrSet).sort()
  }, [nodes, target])

  // Get current operator config
  const currentOperator = operators.find((op) => op.value === operator)

  const handleSave = () => {
    if (!name.trim()) {
      return
    }

    if (!attribute) {
      return
    }

    // Validate action params
    if (action === 'apply_card_template' || action === 'apply_edge_template' || action === 'apply_font_template') {
      if (!templateId) {
        return
      }
    } else if (action === 'add_tag') {
      if (!tagName.trim()) {
        return
      }
    }

    const newRule: StyleRule = {
      id: rule?.id || `rule-${Date.now()}`,
      name: name.trim(),
      enabled,
      order: rule?.order ?? 0,
      target,
      condition: {
        attribute,
        operator,
        value: currentOperator?.requiresValue ? value : undefined,
      },
      action,
      actionParams: {
        templateId: action === 'apply_card_template' || action === 'apply_edge_template' || action === 'apply_font_template' ? templateId : undefined,
        tagName: action === 'add_tag' ? tagName.trim() : undefined,
      },
      createdAt: rule?.createdAt || Date.now(),
    }

    onSave(newRule)
  }

  // Auto-set first attribute if none selected
  if (!attribute && availableAttributes.length > 0) {
    setAttribute(availableAttributes[0])
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-secondary border border-dark rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark">
          <h2 className="text-xl font-bold text-slate-100">
            {rule ? 'Edit Style Rule' : 'New Style Rule'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-dark rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Basic Information</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                  placeholder="e.g., Highlight servers"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="enabled" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Enabled
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Target *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTarget('nodes')}
                    className={`px-4 py-2 rounded border transition-colors ${
                      target === 'nodes'
                        ? 'bg-cyber-500 border-cyber-500 text-white'
                        : 'bg-dark border-dark text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    Nodes
                  </button>
                  <button
                    onClick={() => setTarget('edges')}
                    className={`px-4 py-2 rounded border transition-colors ${
                      target === 'edges'
                        ? 'bg-cyber-500 border-cyber-500 text-white'
                        : 'bg-dark border-dark text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    Edges
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Condition */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Condition (When)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Attribute *
                </label>
                <select
                  value={attribute}
                  onChange={(e) => setAttribute(e.target.value)}
                  className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                >
                  <option value="">Select attribute</option>
                  {availableAttributes.map((attr) => (
                    <option key={attr} value={attr}>
                      {attr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Operator *
                </label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as ConditionOperator)}
                  className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>
              </div>

              {currentOperator?.requiresValue && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Value *
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                    placeholder="Value to compare"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Action */}
          <section>
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Action (Then)</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Action Type *
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value as RuleAction)}
                  className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                >
                  {target === 'nodes' && (
                    <>
                      <option value="apply_card_template">Apply Card Template</option>
                      <option value="apply_font_template">Apply Font Template</option>
                      <option value="add_tag">Add Tag</option>
                    </>
                  )}
                  {target === 'edges' && (
                    <option value="apply_edge_template">Apply Edge Template</option>
                  )}
                </select>
              </div>

              {(action === 'apply_card_template' || action === 'apply_edge_template' || action === 'apply_font_template') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Template *
                  </label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                  >
                    <option value="">Select template</option>
                    {action === 'apply_card_template' &&
                      cardTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    {action === 'apply_edge_template' &&
                      edgeTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    {action === 'apply_font_template' &&
                      fontTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {action === 'add_tag' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Tag Name *
                  </label>
                  <input
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="w-full px-3 py-2 bg-dark border border-dark rounded text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyber-500"
                    placeholder="Tag name"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-dark">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark hover:bg-dark-secondary text-slate-300 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              !name.trim() ||
              !attribute ||
              ((action === 'apply_card_template' || action === 'apply_edge_template' || action === 'apply_font_template') &&
                !templateId) ||
              (action === 'add_tag' && !tagName.trim())
            }
            className="px-4 py-2 bg-cyber-500 hover:bg-cyber-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  )
}
