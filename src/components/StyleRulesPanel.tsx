/**
 * Style Rules Panel
 * Manage conditional styling rules with regex support
 */

import { useState, useRef } from 'react'
import { X, Plus, Trash2, Eye, EyeOff, Download, Upload, Edit2 } from 'lucide-react'
import { useStyleStore } from '../stores/styleStore'
import { useGraphStore } from '../stores/graphStore'
import { useUIStore } from '../stores/uiStore'
import { useCardTemplateStore } from '../stores/cardTemplateStore'
import { useAttributeTemplateStore } from '../stores/attributeTemplateStore'
import { useEdgeTemplateStore } from '../stores/edgeTemplateStore'
import { validateRegex } from '../utils/styleEvaluator'
import type { StyleRule, StyleConditionOperator, StyleRuleTarget } from '../types'

const OPERATORS: { value: StyleConditionOperator; label: string }[] = [
  { value: 'equals', label: '=' },
  { value: 'not_equals', label: '≠' },
  { value: 'contains', label: 'contains' },
  { value: 'regex_match', label: '=~ regex' },
  { value: 'regex_no_match', label: '!~ regex' },
  { value: 'exists', label: 'exists' },
  { value: 'empty', label: 'empty' },
]

export function StyleRulesPanel() {
  const { styleRules, addStyleRule, updateStyleRule, removeStyleRule, toggleStyleRule, importStyleRules, exportStyleRules } = useStyleStore()
  const { getAllAttributeNames } = useGraphStore()
  const { closePanel } = useUIStore()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRule, setEditingRule] = useState<StyleRule | null>(null)
  const importFileRef = useRef<HTMLInputElement>(null)

  const allAttributes = getAllAttributeNames()

  // Export style rules to JSON file
  const handleExport = () => {
    const rules = exportStyleRules()
    const dataStr = JSON.stringify(rules, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `style-rules-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Import style rules from JSON file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const rules = JSON.parse(e.target?.result as string) as StyleRule[]
        // Validate that it's an array of style rules
        if (!Array.isArray(rules)) {
          alert('Invalid file format: expected an array of style rules')
          return
        }
        // Ask user if they want to replace or merge
        const shouldReplace = confirm(
          'Replace existing rules?\n\nOK = Replace all rules\nCancel = Merge with existing rules'
        )
        importStyleRules(rules, !shouldReplace)
      } catch (error) {
        alert('Error importing file: ' + (error instanceof Error ? error.message : 'Unknown error'))
      }
    }
    reader.readAsText(file)
    // Reset input so the same file can be imported again
    event.target.value = ''
  }

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-white dark:bg-gray-900 shadow-2xl z-40 flex flex-col border-l border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Style Rules
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {styleRules.length} rules • {styleRules.filter((r) => r.enabled).length} enabled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => importFileRef.current?.click()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Import rules"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button
            onClick={handleExport}
            disabled={styleRules.length === 0}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export rules"
          >
            <Download className="w-5 h-5" />
          </button>
          <input
            ref={importFileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => closePanel('stylePanel')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {styleRules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No style rules yet. Create your first rule!
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 bg-cyber-600 hover:bg-cyber-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Style Rule
              </button>
            </div>
          ) : (
            <>
              {styleRules.map((rule) => (
                <StyleRuleCard
                  key={rule.id}
                  rule={rule}
                  attributes={allAttributes}
                  onToggle={() => toggleStyleRule(rule.id)}
                  onEdit={() => setEditingRule(rule)}
                  onDelete={() => removeStyleRule(rule.id)}
                />
              ))}
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-cyber-500 dark:hover:border-cyber-500 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:text-cyber-600 dark:hover:text-cyber-400"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Style Rule
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <StyleRuleForm
          attributes={allAttributes}
          onClose={() => setShowAddForm(false)}
          onSave={(rule) => {
            addStyleRule(rule)
            setShowAddForm(false)
          }}
        />
      )}

      {/* Edit Form Modal */}
      {editingRule && (
        <StyleRuleForm
          attributes={allAttributes}
          existingRule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={(rule) => {
            updateStyleRule(rule.id, rule)
            setEditingRule(null)
          }}
        />
      )}
    </div>
  )
}

interface StyleRuleCardProps {
  rule: StyleRule
  attributes: string[]
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function StyleRuleCard({ rule, onToggle, onEdit, onDelete }: StyleRuleCardProps) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {rule.enabled ? (
              <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <EyeOff className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {rule.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {rule.target} • Order: {rule.order}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Edit rule"
          >
            <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete rule"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Condition:</span>
          <p className="font-mono text-xs mt-1">
            {rule.attribute} {OPERATORS.find((o) => o.value === rule.operator)?.label}{' '}
            {rule.value && `"${rule.value}"`}
          </p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Templates & Actions:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {rule.style.cardTemplateId && (
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                Card Template
              </span>
            )}
            {rule.style.edgeTemplateId && (
              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">
                Edge Template
              </span>
            )}
            {rule.style.attributeTemplateId && (
              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                Attr: {rule.style.targetAttribute}
              </span>
            )}
            {rule.style.groupLabel && (
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs">
                group: {rule.style.groupLabel}
              </span>
            )}
            {rule.style.applyTag && (
              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs">
                tag: {rule.style.applyTag}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface StyleRuleFormProps {
  attributes: string[]
  existingRule?: StyleRule
  onClose: () => void
  onSave: (rule: StyleRule) => void
}

function StyleRuleForm({ attributes, existingRule, onClose, onSave }: StyleRuleFormProps) {
  const isEditing = !!existingRule
  const { cardTemplates } = useCardTemplateStore()
  const { attributeTemplates } = useAttributeTemplateStore()
  const { edgeTemplates } = useEdgeTemplateStore()

  // Basic rule info
  const [name, setName] = useState(existingRule?.name || '')
  const [attribute, setAttribute] = useState(existingRule?.attribute || attributes[0] || '')
  const [operator, setOperator] = useState<StyleConditionOperator>(existingRule?.operator || 'equals')
  const [value, setValue] = useState(existingRule?.value || '')
  const [target, setTarget] = useState<StyleRuleTarget>(existingRule?.target || 'nodes')

  // Template assignments
  const [cardTemplateId, setCardTemplateId] = useState(existingRule?.style.cardTemplateId || '')
  const [edgeTemplateId, setEdgeTemplateId] = useState(existingRule?.style.edgeTemplateId || '')
  const [attributeTemplateId, setAttributeTemplateId] = useState(existingRule?.style.attributeTemplateId || '')
  const [targetAttribute, setTargetAttribute] = useState(existingRule?.style.targetAttribute || '')

  // Organizational
  const [applyTag, setApplyTag] = useState(existingRule?.style.applyTag || '')
  const [groupLabel, setGroupLabel] = useState(existingRule?.style.groupLabel || '')

  const [error, setError] = useState<string | null>(null)

  const needsValue = !['exists', 'empty'].includes(operator)

  const handleSave = () => {
    // Validate
    if (!name.trim()) {
      setError('Please enter a rule name')
      return
    }
    if (!attribute) {
      setError('Please select an attribute')
      return
    }
    if (needsValue && !value.trim()) {
      setError('Please enter a value')
      return
    }

    // Validate regex
    if ((operator === 'regex_match' || operator === 'regex_no_match') && value) {
      const validation = validateRegex(value)
      if (!validation.valid) {
        setError(`Invalid regex: ${validation.error}`)
        return
      }
    }

    const rule: StyleRule = {
      id: existingRule?.id || `rule-${Date.now()}`,
      name: name.trim(),
      enabled: existingRule?.enabled ?? true,
      attribute,
      operator,
      value: needsValue ? value : undefined,
      target,
      style: {
        cardTemplateId: cardTemplateId || undefined,
        edgeTemplateId: edgeTemplateId || undefined,
        attributeTemplateId: attributeTemplateId || undefined,
        targetAttribute: targetAttribute || undefined,
        applyTag: applyTag.trim() || undefined,
        groupLabel: groupLabel.trim() || undefined,
      },
      order: existingRule?.order || Date.now(),
    }

    onSave(rule)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{isEditing ? 'Edit Style Rule' : 'Add Style Rule'}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Rule Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Highlight DNS servers"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as StyleRuleTarget)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
            >
              <option value="nodes">Nodes (Card Template)</option>
              <option value="edges">Edges (Edge Template)</option>
              <option value="attributes">Attributes (Attribute Template)</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {target === 'nodes' && 'Apply card template to matching nodes'}
              {target === 'edges' && 'Apply edge template to matching edges'}
              {target === 'attributes' && 'Apply attribute template to a specific attribute'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Target Attribute</label>
            <select
              value={attribute}
              onChange={(e) => setAttribute(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
            >
              {attributes.map((attr) => (
                <option key={attr} value={attr}>
                  {attr}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Select the attribute to match against for this rule
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as StyleConditionOperator)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {needsValue && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Value {(operator === 'regex_match' || operator === 'regex_no_match') && '(regex pattern)'}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={operator.includes('regex') ? '^(8\\.8\\.|1\\.1\\.1\\.)' : 'value to match'}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 font-mono text-sm"
              />
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="font-medium mb-3">Template & Action Assignments</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              When the condition matches, assign templates or perform actions
            </p>

            <div className="space-y-3">
              {/* Node Card Template - Only show for nodes target */}
              {target === 'nodes' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Card Template</label>
                  <select
                    value={cardTemplateId}
                    onChange={(e) => setCardTemplateId(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                  >
                    <option value="">Use default template</option>
                    {cardTemplates.filter(t => !t.isDefault).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.mergeMode})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Applies card template to matching nodes (controls layout + visual styling + text style)
                  </p>
                </div>
              )}

              {/* Edge Template - Only show for edges target */}
              {target === 'edges' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Edge Template</label>
                  <select
                    value={edgeTemplateId}
                    onChange={(e) => setEdgeTemplateId(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                  >
                    <option value="">Use default template</option>
                    {edgeTemplates.filter(t => !t.isDefault).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Applies edge template to matching edges (line color, width, style, arrows)
                  </p>
                </div>
              )}

              {/* Attribute Template - Only show for attributes target */}
              {target === 'attributes' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Attribute Template</label>
                  <select
                    value={attributeTemplateId}
                    onChange={(e) => {
                      setAttributeTemplateId(e.target.value)
                      if (e.target.value && !targetAttribute) {
                        setTargetAttribute(attribute)
                      }
                    }}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                  >
                    <option value="">Use default template</option>
                    {attributeTemplates.filter(t => !t.isDefault).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {attributeTemplateId && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium mb-1">Target Attribute Name</label>
                      <input
                        type="text"
                        value={targetAttribute}
                        onChange={(e) => setTargetAttribute(e.target.value)}
                        placeholder="e.g., hostname, ip_address"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm"
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Applies styling to a specific attribute (works in detail panel and anywhere the attribute appears)
                  </p>
                </div>
              )}

              {/* Organizational Actions */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <h5 className="text-sm font-medium mb-2">Organizational Actions</h5>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm mb-1">Apply Tag (optional)</label>
                    <input
                      type="text"
                      value={applyTag}
                      onChange={(e) => setApplyTag(e.target.value)}
                      placeholder="e.g., server, workstation"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Tags help categorize nodes (can be used in other rules)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Group Label (optional)</label>
                    <input
                      type="text"
                      value={groupLabel}
                      onChange={(e) => setGroupLabel(e.target.value)}
                      placeholder="e.g., Servers, Workstations, Infrastructure"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Creates a visual group box around matching nodes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyber-600 hover:bg-cyber-700 text-white rounded transition-colors"
            >
              {isEditing ? 'Update Rule' : 'Add Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
