/**
 * Style Evaluator
 * Evaluates style rules against nodes and edges
 * Supports regex matching and condition operators
 */

import type { StyleRule, NodeData, EdgeData, StyleProperties } from '../types'

/**
 * Evaluate a style rule against a node
 * Applies to rules targeting 'nodes' or 'attributes'
 */
export function evaluateRuleForNode(
  rule: StyleRule,
  node: NodeData
): boolean {
  if (!rule.enabled) return false
  // Only evaluate if targeting nodes or attributes (both apply to nodes)
  if (rule.target === 'edges') return false

  return evaluateCondition(rule, node.attributes, node.tags)
}

/**
 * Evaluate a style rule against an edge
 */
export function evaluateRuleForEdge(
  rule: StyleRule,
  edge: EdgeData
): boolean {
  if (!rule.enabled) return false
  // Only evaluate if targeting edges
  if (rule.target !== 'edges') return false

  // For edges, we mainly check existence and basic properties
  const attributes: Record<string, string | string[]> = {
    source: edge.source,
    target: edge.target,
    sourceColumn: edge.sourceColumn || '',
    targetColumn: edge.targetColumn || '',
    label: edge.label || '',
  }

  return evaluateCondition(rule, attributes, [])
}

/**
 * Evaluate condition based on operator
 */
function evaluateCondition(
  rule: StyleRule,
  attributes: Record<string, string | string[]>,
  _tags: string[]
): boolean {
  const { operator, attribute, value } = rule

  // Get attribute value(s)
  const attrValue = attributes[attribute]

  switch (operator) {
    case 'exists':
      return attrValue !== undefined && attrValue !== null

    case 'empty':
      return (
        attrValue === undefined ||
        attrValue === null ||
        attrValue === '' ||
        (Array.isArray(attrValue) && attrValue.length === 0)
      )

    case 'equals':
      if (!value) return false
      return matchValue(attrValue, value, (a, b) => a === b)

    case 'not_equals':
      if (!value) return false
      return !matchValue(attrValue, value, (a, b) => a === b)

    case 'contains':
      if (!value) return false
      return matchValue(attrValue, value, (a, b) =>
        a.toLowerCase().includes(b.toLowerCase())
      )

    case 'regex_match':
      if (!value) return false
      try {
        const regex = new RegExp(value, 'i')
        return matchValue(attrValue, value, (a) => regex.test(a))
      } catch {
        // Invalid regex
        return false
      }

    case 'regex_no_match':
      if (!value) return false
      try {
        const regex = new RegExp(value, 'i')
        return !matchValue(attrValue, value, (a) => regex.test(a))
      } catch {
        // Invalid regex - treat as no match
        return true
      }

    default:
      return false
  }
}

/**
 * Match a value (or array of values) against a comparison function
 */
function matchValue(
  attrValue: string | string[] | undefined | null,
  compareValue: string,
  compareFn: (a: string, b: string) => boolean
): boolean {
  if (!attrValue) return false

  if (Array.isArray(attrValue)) {
    // For arrays, return true if ANY value matches
    return attrValue.some((v) => compareFn(v, compareValue))
  }

  return compareFn(attrValue, compareValue)
}

/**
 * Compute final style for a node by applying all matching rules in order
 * Returns only template IDs and organizational properties (tags, groupLabel)
 */
export function computeNodeStyle(
  node: NodeData,
  rules: StyleRule[]
): StyleProperties & { tagsToApply?: string[]; groupLabelToApply?: string } {
  const style: StyleProperties = {}
  const tagsToApply: string[] = []
  let groupLabelToApply: string | undefined

  // Rules are already sorted by order (lower = higher priority)
  // Apply rules in order, later rules override earlier ones
  for (const rule of rules) {
    if (evaluateRuleForNode(rule, node)) {
      // Collect tags to apply
      if (rule.style.applyTag && !tagsToApply.includes(rule.style.applyTag)) {
        tagsToApply.push(rule.style.applyTag)
      }
      // Collect group label (only one group per node, last matching rule wins)
      if (rule.style.groupLabel) {
        groupLabelToApply = rule.style.groupLabel
      }

      // Apply template assignments based on rule target
      if (rule.target === 'nodes' && rule.style.cardTemplateId) {
        style.cardTemplateId = rule.style.cardTemplateId
      }

      if (rule.target === 'attributes' && rule.style.attributeTemplateId) {
        style.attributeTemplateId = rule.style.attributeTemplateId
        style.targetAttribute = rule.style.targetAttribute
      }
    }
  }

  return {
    ...style,
    tagsToApply: tagsToApply.length > 0 ? tagsToApply : undefined,
    groupLabelToApply,
  }
}

/**
 * Compute final style for an edge by applying all matching rules in order
 */
export function computeEdgeStyle(
  edge: EdgeData,
  rules: StyleRule[]
): StyleProperties {
  const style: StyleProperties = {}

  for (const rule of rules) {
    if (evaluateRuleForEdge(rule, edge)) {
      Object.assign(style, rule.style)
    }
  }

  return style
}

/**
 * Validate a regex pattern
 */
export function validateRegex(pattern: string): { valid: boolean; error?: string } {
  try {
    new RegExp(pattern)
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid regex',
    }
  }
}
