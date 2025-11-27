/**
 * Style evaluator for applying conditional styling rules to nodes and edges
 */

import type { StyleRule, RuleCondition, GraphNode, GraphEdge, ConditionOperator } from '@/types'

/**
 * Evaluate a single condition against a node or edge
 */
function evaluateCondition(
  condition: RuleCondition,
  attributes: Record<string, string | string[]>
): boolean {
  const { attribute, operator, value } = condition
  const attrValue = attributes[attribute]

  // Handle attribute existence operators
  if (operator === 'exists') {
    return attrValue !== undefined
  }
  if (operator === 'not_exists') {
    return attrValue === undefined
  }

  // If attribute doesn't exist, fail all other operators
  if (attrValue === undefined) {
    return false
  }

  // Handle empty/not_empty operators
  if (operator === 'empty') {
    if (Array.isArray(attrValue)) {
      return attrValue.length === 0
    }
    return String(attrValue).trim() === ''
  }
  if (operator === 'not_empty') {
    if (Array.isArray(attrValue)) {
      return attrValue.length > 0
    }
    return String(attrValue).trim() !== ''
  }

  // Convert attribute value to string or array of strings
  const attrValueStr = Array.isArray(attrValue)
    ? attrValue.map((v) => String(v).toLowerCase())
    : [String(attrValue).toLowerCase()]

  const compareValue = value ? String(value).toLowerCase() : ''

  // Evaluate operator
  switch (operator) {
    case 'equals':
      return attrValueStr.includes(compareValue)

    case 'not_equals':
      return !attrValueStr.includes(compareValue)

    case 'contains':
      return attrValueStr.some((v) => v.includes(compareValue))

    case 'not_contains':
      return !attrValueStr.some((v) => v.includes(compareValue))

    case 'regex_match':
      try {
        const regex = new RegExp(compareValue, 'i')
        return attrValueStr.some((v) => regex.test(v))
      } catch {
        return false
      }

    case 'regex_not_match':
      try {
        const regex = new RegExp(compareValue, 'i')
        return !attrValueStr.some((v) => regex.test(v))
      } catch {
        return false
      }

    default:
      return false
  }
}

/**
 * Apply style rules to a node
 * Returns the IDs of templates/tags to apply
 */
export function evaluateNodeRules(
  node: GraphNode,
  rules: StyleRule[]
): {
  cardTemplateId?: string
  fontTemplateId?: string
  additionalTags: string[]
} {
  const result: {
    cardTemplateId?: string
    fontTemplateId?: string
    additionalTags: string[]
  } = {
    additionalTags: [],
  }

  // Rules are already sorted by order (lower = higher priority)
  // We process them in order and first match wins for templates
  for (const rule of rules) {
    if (!rule.enabled || rule.target !== 'nodes') {
      continue
    }

    // Evaluate condition
    if (evaluateCondition(rule.condition, node.attributes)) {
      // Apply action
      if (rule.action === 'apply_card_template' && rule.actionParams.templateId) {
        // First matching template wins
        if (!result.cardTemplateId) {
          result.cardTemplateId = rule.actionParams.templateId
        }
      } else if (rule.action === 'apply_font_template' && rule.actionParams.templateId) {
        // First matching font template wins
        if (!result.fontTemplateId) {
          result.fontTemplateId = rule.actionParams.templateId
        }
      } else if (rule.action === 'add_tag' && rule.actionParams.tagName) {
        result.additionalTags.push(rule.actionParams.tagName)
      }
    }
  }

  return result
}

/**
 * Apply style rules to an edge
 * Returns the ID of template to apply
 */
export function evaluateEdgeRules(
  edge: GraphEdge,
  rules: StyleRule[]
): {
  edgeTemplateId?: string
} {
  const result: {
    edgeTemplateId?: string
  } = {}

  // Rules are already sorted by order (lower = higher priority)
  // We process them in order and first match wins
  for (const rule of rules) {
    if (!rule.enabled || rule.target !== 'edges') {
      continue
    }

    // Edges don't have attributes in current schema, but we prepare for future
    const edgeAttrs: Record<string, string | string[]> = {
      source: edge.source,
      target: edge.target,
      label: edge.label || '',
    }

    // Evaluate condition
    if (evaluateCondition(rule.condition, edgeAttrs)) {
      // Apply action
      if (rule.action === 'apply_edge_template' && rule.actionParams.templateId) {
        // First matching template wins
        if (!result.edgeTemplateId) {
          result.edgeTemplateId = rule.actionParams.templateId
        }
      }
    }
  }

  return result
}

/**
 * Get all available condition operators
 */
export function getConditionOperators(): Array<{
  value: ConditionOperator
  label: string
  requiresValue: boolean
}> {
  return [
    { value: 'equals', label: 'Equals', requiresValue: true },
    { value: 'not_equals', label: 'Not Equals', requiresValue: true },
    { value: 'contains', label: 'Contains', requiresValue: true },
    { value: 'not_contains', label: 'Not Contains', requiresValue: true },
    { value: 'regex_match', label: 'Regex Match', requiresValue: true },
    { value: 'regex_not_match', label: 'Regex Not Match', requiresValue: true },
    { value: 'exists', label: 'Exists', requiresValue: false },
    { value: 'not_exists', label: 'Not Exists', requiresValue: false },
    { value: 'empty', label: 'Is Empty', requiresValue: false },
    { value: 'not_empty', label: 'Is Not Empty', requiresValue: false },
  ]
}
