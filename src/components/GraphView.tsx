/**
 * Graph View Component
 * Main Cytoscape.js visualization with interactions
 */

import { useEffect, useRef, useState } from 'react'
import cytoscape, { Core, NodeSingular } from 'cytoscape'
// @ts-ignore - no types available
import coseBilkent from 'cytoscape-cose-bilkent'
// @ts-ignore - no types available
import cola from 'cytoscape-cola'
// @ts-ignore - no types available
import dagre from 'cytoscape-dagre'
// @ts-ignore - no types available
import fcose from 'cytoscape-fcose'
import { useGraphStore } from '../stores/graphStore'
import { useStyleStore } from '../stores/styleStore'
import { useCardTemplateStore } from '../stores/cardTemplateStore'
import { useAttributeTemplateStore } from '../stores/attributeTemplateStore'
import { useEdgeTemplateStore } from '../stores/edgeTemplateStore'
import { useLayoutStore } from '../stores/layoutStore'
import { useUIStore } from '../stores/uiStore'
import { computeNodeStyle, computeEdgeStyle } from '../utils/styleEvaluator'
import type { NodeData, EdgeData, CardTemplate, AttributeDisplay, AttributeTemplate, EdgeTemplate } from '../types'

// Register layout extensions
cytoscape.use(coseBilkent)
cytoscape.use(cola)
cytoscape.use(dagre)
cytoscape.use(fcose)

/**
 * Cache for recolored SVG icons
 */
const svgColorCache = new Map<string, string>()

/**
 * Recolor an SVG icon and return as data URI
 */
async function getColoredSvgDataUri(svgPath: string, color: string): Promise<string> {
  const cacheKey = `${svgPath}|${color}`

  if (svgColorCache.has(cacheKey)) {
    return svgColorCache.get(cacheKey)!
  }

  try {
    const response = await fetch(svgPath)
    let svgText = await response.text()

    // Replace stroke="currentColor" with the desired color
    svgText = svgText.replace(/stroke="currentColor"/g, `stroke="${color}"`)

    // Convert to data URI
    const dataUri = `data:image/svg+xml;base64,${btoa(svgText)}`
    svgColorCache.set(cacheKey, dataUri)
    return dataUri
  } catch (error) {
    console.error('Failed to recolor SVG:', error)
    return svgPath // Fallback to original path
  }
}

/**
 * Resolve AttributeDisplay properties by merging attribute template
 * Hierarchy: Default Template → Attribute Template → AttributeDisplay → Overrides
 */
function resolveAttributeDisplay(
  display: AttributeDisplay,
  attributeTemplateGetter: (id: string) => AttributeTemplate | undefined,
  defaultTemplate: AttributeTemplate | undefined
): AttributeDisplay {
  // Start with default template properties
  let resolved: AttributeDisplay = { ...display }

  // Apply default template if available
  if (defaultTemplate) {
    resolved = {
      ...resolved,
      labelPrefix: resolved.labelPrefix ?? defaultTemplate.labelPrefix,
      labelSuffix: resolved.labelSuffix ?? defaultTemplate.labelSuffix,
      fontSize: resolved.fontSize ?? defaultTemplate.fontSize,
      fontFamily: resolved.fontFamily ?? defaultTemplate.fontFamily,
      color: resolved.color ?? defaultTemplate.color,
      fontWeight: resolved.fontWeight ?? defaultTemplate.fontWeight,
      fontStyle: resolved.fontStyle ?? defaultTemplate.fontStyle,
      textDecoration: resolved.textDecoration ?? defaultTemplate.textDecoration,
      textShadow: resolved.textShadow ?? defaultTemplate.textShadow,
      textOutlineWidth: resolved.textOutlineWidth ?? defaultTemplate.textOutlineWidth,
      textOutlineColor: resolved.textOutlineColor ?? defaultTemplate.textOutlineColor,
      backgroundColor: resolved.backgroundColor ?? defaultTemplate.backgroundColor,
      backgroundPadding: resolved.backgroundPadding ?? defaultTemplate.backgroundPadding,
      borderRadius: resolved.borderRadius ?? defaultTemplate.borderRadius,
    }
  }

  // Apply specific attribute template if assigned
  if (display.attributeTemplateId) {
    const template = attributeTemplateGetter(display.attributeTemplateId)
    if (template) {
      resolved = {
        ...resolved,
        labelPrefix: resolved.labelPrefix ?? template.labelPrefix,
        labelSuffix: resolved.labelSuffix ?? template.labelSuffix,
        fontSize: resolved.fontSize ?? template.fontSize,
        fontFamily: resolved.fontFamily ?? template.fontFamily,
        color: resolved.color ?? template.color,
        fontWeight: resolved.fontWeight ?? template.fontWeight,
        fontStyle: resolved.fontStyle ?? template.fontStyle,
        textDecoration: resolved.textDecoration ?? template.textDecoration,
        textShadow: resolved.textShadow ?? template.textShadow,
        textOutlineWidth: resolved.textOutlineWidth ?? template.textOutlineWidth,
        textOutlineColor: resolved.textOutlineColor ?? template.textOutlineColor,
        backgroundColor: resolved.backgroundColor ?? template.backgroundColor,
        backgroundPadding: resolved.backgroundPadding ?? template.backgroundPadding,
        borderRadius: resolved.borderRadius ?? template.borderRadius,
      }
    }
  }

  // Apply overrides (highest priority)
  if (display.overrides) {
    resolved = {
      ...resolved,
      ...display.overrides,
    }
  }

  return resolved
}

/**
 * Compute node label from card template
 * Note: Cytoscape.js labels are plain text with uniform styling.
 * Attribute template styling (colors, fonts, etc.) will be uniformly applied to the entire label.
 */
function computeNodeLabel(
  node: NodeData,
  template: CardTemplate,
  attributeTemplateGetter: (id: string) => AttributeTemplate | undefined,
  defaultAttributeTemplate: AttributeTemplate | undefined
): string {
  const visibleDisplays = template.attributeDisplays
    .filter(d => d.visible)
    .sort((a, b) => a.order - b.order)

  if (visibleDisplays.length === 0) {
    return node.label || node.id
  }

  const parts: string[] = []

  for (const display of visibleDisplays) {
    // Resolve display properties with attribute templates
    const resolvedDisplay = resolveAttributeDisplay(display, attributeTemplateGetter, defaultAttributeTemplate)

    // Handle special __id__ attribute
    let value: any
    if (resolvedDisplay.attribute === '__id__') {
      value = node.id
    } else {
      value = node.attributes[resolvedDisplay.attribute]
    }

    if (value === undefined || value === null) {
      continue
    }

    // Convert value to string (handle arrays and objects)
    let valueStr: string
    if (Array.isArray(value)) {
      valueStr = value.join(', ')
    } else if (typeof value === 'object') {
      valueStr = JSON.stringify(value)
    } else {
      valueStr = String(value)
    }

    // Build the display string using resolved properties
    if (template.layout.showLabels) {
      const labelName = resolvedDisplay.displayLabel || (resolvedDisplay.attribute === '__id__' ? 'ID' : resolvedDisplay.attribute)
      const prefix = resolvedDisplay.labelPrefix || ''
      const suffix = resolvedDisplay.labelSuffix || ''
      const fullLabel = `${prefix}${labelName}${suffix}`
      parts.push(`${fullLabel}: ${valueStr}`)
    } else {
      parts.push(valueStr)
    }
  }

  if (parts.length === 0) {
    return node.label || node.id
  }

  return parts.join(template.layout.separator || '\n')
}

/**
 * Merge two card templates
 */
function mergeCardTemplates(baseTemplate: CardTemplate, overlayTemplate: CardTemplate): CardTemplate {
  return {
    ...baseTemplate,
    ...overlayTemplate,
    layout: {
      ...baseTemplate.layout,
      ...overlayTemplate.layout,
    },
    textStyle: {
      ...baseTemplate.textStyle,
      ...overlayTemplate.textStyle,
    },
    nodeStyle: {
      ...baseTemplate.nodeStyle,
      ...overlayTemplate.nodeStyle,
    },
    attributeDisplays: [
      ...baseTemplate.attributeDisplays,
      ...overlayTemplate.attributeDisplays.filter(
        od => !baseTemplate.attributeDisplays.some(bd => bd.attribute === od.attribute)
      ),
    ],
  }
}

export function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)

  const { nodes, edges } = useGraphStore()
  const { styleRules, getEnabledRules } = useStyleStore()
  const { cardTemplates, getDefaultTemplate, getCardTemplate } = useCardTemplateStore()
  const { attributeTemplates, getAttributeTemplate, getDefaultTemplate: getDefaultAttributeTemplate } = useAttributeTemplateStore()
  const { edgeTemplates, getEdgeTemplate, getDefaultTemplate: getDefaultEdgeTemplate } = useEdgeTemplateStore()
  const { layoutConfig } = useLayoutStore()
  const uiStore = useUIStore()

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return

    const cy = cytoscape({
      container: containerRef.current,
      style: getCytoscapeStyles() as any,
      layout: { name: 'preset' },
      minZoom: 0.1,
      maxZoom: 5,
      wheelSensitivity: 0.2,
    })

    // Enable compound node dragging
    cy.on('drag', ':parent', (evt) => {
      evt.target.children().move({
        parent: evt.target.id(),
      })
    })

    // Node click handler
    cy.on('tap', 'node', (evt) => {
      const node = evt.target as NodeSingular
      const nodeData = node.data() as NodeData & { id: string }
      const connectedEdges = node.connectedEdges().length

      uiStore.selectNode({
        id: nodeData.id,
        data: nodeData,
        connectedEdges,
      })
    })

    // Double-click to center and highlight
    cy.on('dbltap', 'node', (evt) => {
      const node = evt.target as NodeSingular
      cy.animate({
        center: { eles: node },
        zoom: 2,
        duration: 500,
      })

      // Highlight neighbors
      const neighbors = node.neighborhood()
      cy.elements().removeClass('highlighted')
      node.addClass('highlighted')
      neighbors.addClass('highlighted')

      setTimeout(() => {
        cy.elements().removeClass('highlighted')
      }, 2000)
    })

    // Click on background to deselect
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        uiStore.clearSelection()
        uiStore.closePanel('detailPanel')
      }
    })

    // Display control event listeners
    const handleFit = () => cy.fit(undefined, 50)
    const handleZoomIn = () => cy.zoom({ level: cy.zoom() * 1.2, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
    const handleZoomOut = () => cy.zoom({ level: cy.zoom() * 0.8, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } })
    const handleCenter = () => cy.center()
    const handleExportPNG = () => {
      try {
        // Export as blob for better handling of large graphs
        cy.png({
          full: true,
          scale: 2,
          output: 'blob-promise',
          maxWidth: 8000,
          maxHeight: 8000
        }).then((blob: Blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `graph-${new Date().toISOString().slice(0,10)}.png`
          link.href = url
          link.click()
          // Clean up after a delay
          setTimeout(() => URL.revokeObjectURL(url), 100)
        }).catch((error: Error) => {
          console.error('PNG export failed:', error)
          alert('Failed to export PNG. The graph may be too large. Try zooming in or reducing the number of nodes.')
        })
      } catch (error) {
        console.error('PNG export error:', error)
        alert('Failed to export PNG. Please try again.')
      }
    }
    const handleExportJSON = () => {
      const json = cy.json()
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'graph.json'
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }

    const handleEdgeStyle = (event: any) => {
      const curveStyle = event.detail
      cy.edges().style('curve-style', curveStyle)
      // Reset control points for unbundled-bezier
      if (curveStyle === 'unbundled-bezier') {
        cy.edges().style({
          'control-point-distances': [40, -40],
          'control-point-weights': [0.25, 0.75],
        })
      }
    }

    window.addEventListener('cytoscape-fit', handleFit)
    window.addEventListener('cytoscape-zoom-in', handleZoomIn)
    window.addEventListener('cytoscape-zoom-out', handleZoomOut)
    window.addEventListener('cytoscape-center', handleCenter)
    window.addEventListener('cytoscape-export-png', handleExportPNG)
    window.addEventListener('cytoscape-export-json', handleExportJSON)
    window.addEventListener('cytoscape-edge-style', handleEdgeStyle)

    cyRef.current = cy

    return () => {
      window.removeEventListener('cytoscape-fit', handleFit)
      window.removeEventListener('cytoscape-zoom-in', handleZoomIn)
      window.removeEventListener('cytoscape-zoom-out', handleZoomOut)
      window.removeEventListener('cytoscape-center', handleCenter)
      window.removeEventListener('cytoscape-export-png', handleExportPNG)
      window.removeEventListener('cytoscape-export-json', handleExportJSON)
      window.removeEventListener('cytoscape-edge-style', handleEdgeStyle)
      cy.destroy()
      cyRef.current = null
    }
  }, [])

  // Update graph data
  useEffect(() => {
    if (!cyRef.current) return

    const cy = cyRef.current

    // First pass: determine group assignments for each node
    const nodeGroupMap = new Map<string, string>() // nodeId -> groupLabel
    const enabledRules = getEnabledRules()

    nodes.forEach((node) => {
      const style = computeNodeStyle(node, enabledRules)
      if (style.groupLabelToApply) {
        nodeGroupMap.set(node.id, style.groupLabelToApply)
      }
    })

    // Create parent nodes for each unique group
    const groupLabels = Array.from(new Set(nodeGroupMap.values()))
    const parentNodes = groupLabels.map((groupLabel) => ({
      data: {
        id: `group-${groupLabel}`,
        label: groupLabel,
        isGroup: true,
      },
    }))

    // Convert nodes and edges to Cytoscape format
    const cyNodes = nodes.map((node) => {
      // Determine which card template to use
      const style = computeNodeStyle(node, enabledRules)
      const defaultTemplate = getDefaultTemplate()
      let finalTemplate = defaultTemplate

      if (style.cardTemplateId) {
        const ruleTemplate = getCardTemplate(style.cardTemplateId)
        if (ruleTemplate) {
          if (ruleTemplate.mergeMode === 'merge' && defaultTemplate) {
            finalTemplate = mergeCardTemplates(defaultTemplate, ruleTemplate)
          } else {
            finalTemplate = ruleTemplate
          }
        }
      }

      // Compute display label from card template
      const displayLabel = finalTemplate ? computeNodeLabel(node, finalTemplate, getAttributeTemplate, getDefaultAttributeTemplate()) : (node.label || node.id)

      // Calculate node size based on whether it has an icon/image
      const hasIconOrImage = style.cardTemplateId && finalTemplate?.nodeStyle?.icon || finalTemplate?.nodeStyle?.imageUrl

      let estimatedWidth: number
      let estimatedHeight: number

      if (hasIconOrImage) {
        // Fixed square size for icon/image nodes (consistent aspect ratio)
        estimatedWidth = 100
        estimatedHeight = 100
      } else {
        // Calculate dynamic node size based on label content for regular nodes
        const lines = displayLabel.split('\n')
        const maxLineLength = Math.max(...lines.map(line => line.length))
        const lineCount = lines.length

        // Estimate dimensions (characters * ~7px per char, with min/max bounds)
        estimatedWidth = Math.max(60, Math.min(250, maxLineLength * 7 + 20))
        estimatedHeight = Math.max(60, lineCount * 16 + 20)
      }

      // Check if this node belongs to a group
      const groupLabel = nodeGroupMap.get(node.id)

      return {
        data: {
          ...node,
          id: node.id,
          label: displayLabel,
          dynamicWidth: estimatedWidth,
          dynamicHeight: estimatedHeight,
          parent: groupLabel ? `group-${groupLabel}` : undefined,
        },
      }
    })

    const cyEdges = edges.map((edge) => ({
      data: {
        ...edge,
        id: edge.id || `${edge.source}-${edge.target}`,
      },
    }))

    // Batch update
    cy.startBatch()
    cy.elements().remove()
    cy.add([...parentNodes, ...cyNodes, ...cyEdges])
    cy.endBatch()

    // Run layout
    runLayout(cy, layoutConfig.type, layoutConfig)
  }, [nodes, edges, layoutConfig, styleRules, cardTemplates, attributeTemplates])

  // Apply template-based styling
  useEffect(() => {
    if (!cyRef.current) return

    const cy = cyRef.current
    const enabledRules = getEnabledRules()

    // Apply styles to nodes (two-pass to handle tag application)
    // First pass: collect all tags to apply
    const nodeTagsMap = new Map<string, string[]>()
    cy.nodes().forEach((node) => {
      const nodeData = node.data() as NodeData & { dynamicWidth?: number; dynamicHeight?: number }
      const ruleResult = computeNodeStyle(nodeData, enabledRules)

      if (ruleResult.tagsToApply && ruleResult.tagsToApply.length > 0) {
        nodeTagsMap.set(nodeData.id, ruleResult.tagsToApply)
      }
    })

    // Second pass: apply template styling with augmented node data including applied tags
    cy.nodes().forEach((node) => {
      const nodeData = node.data() as NodeData & { dynamicWidth?: number; dynamicHeight?: number }

      // Augment node data with applied tags for style evaluation
      const augmentedNodeData: NodeData & { dynamicWidth?: number; dynamicHeight?: number } = {
        ...nodeData,
        tags: [...nodeData.tags, ...(nodeTagsMap.get(nodeData.id) || [])],
      }

      const ruleResult = computeNodeStyle(augmentedNodeData, enabledRules)

      // Determine which card template to use
      const defaultTemplate = getDefaultTemplate()
      let activeTemplate = defaultTemplate

      if (ruleResult.cardTemplateId) {
        const ruleTemplate = getCardTemplate(ruleResult.cardTemplateId)
        if (ruleTemplate) {
          if (ruleTemplate.mergeMode === 'merge' && defaultTemplate) {
            activeTemplate = mergeCardTemplates(defaultTemplate, ruleTemplate)
          } else {
            activeTemplate = ruleTemplate
          }
        }
      }

      // Get node visual styling from the card template
      const nodeStyle = activeTemplate?.nodeStyle

      // Apply dynamic size (with template size multiplier if specified)
      // Use larger default multiplier (2.5) for icons/images, 1 for shapes
      const hasIconOrImage = nodeStyle?.icon || nodeStyle?.imageUrl
      const defaultMultiplier = hasIconOrImage ? 2.5 : 1
      const sizeMultiplier = nodeStyle?.size ?? defaultMultiplier
      const baseWidth = nodeData.dynamicWidth || 60
      const baseHeight = nodeData.dynamicHeight || 60

      node.style('width', baseWidth * sizeMultiplier)
      node.style('height', baseHeight * sizeMultiplier)

      // Apply visual styling from card template
      if (nodeStyle) {
        if (nodeStyle.backgroundColor) {
          node.style('background-color', nodeStyle.backgroundColor)
        }
        if (nodeStyle.borderColor) {
          node.style('border-color', nodeStyle.borderColor)
        }
        if (nodeStyle.borderWidth !== undefined) {
          node.style('border-width', nodeStyle.borderWidth)
        }
        if (nodeStyle.opacity !== undefined) {
          node.style('opacity', nodeStyle.opacity)
        }

        // Handle icon or custom image
        const isSvgIcon = nodeStyle.icon && nodeStyle.icon.startsWith('/icons/')

        if (nodeStyle.imageUrl || isSvgIcon) {
          // Custom image or SVG icon - square shape that fits the icon
          let imageSource = nodeStyle.imageUrl || nodeStyle.icon!

          // If it's an SVG icon with a custom color, recolor it
          if (isSvgIcon && nodeStyle.iconColor) {
            getColoredSvgDataUri(nodeStyle.icon!, nodeStyle.iconColor).then(coloredSvg => {
              node.style('background-image', coloredSvg)
            })
          } else {
            node.style('background-image', imageSource)
          }

          node.style('background-fit', 'contain')
          node.style('background-clip', 'none')
          node.style('background-width', '70%')
          node.style('background-height', '70%')
          node.style('shape', 'roundrectangle')
          node.style('text-valign', 'bottom')
          node.style('text-margin-y', 10)
          // Make background transparent
          node.style('background-color', 'transparent')
          node.style('border-width', 0)
          // Ensure text is visible with white background
          node.style('color', '#1f2937')
          node.style('text-background-color', '#ffffff')
          node.style('text-background-opacity', 0.9)
          node.style('text-background-padding', '3px')
          node.style('text-background-shape', 'roundrectangle')
        } else if (nodeStyle.icon) {
          // Emoji/unicode icon - square shape that fits the emoji
          const currentLabel = node.data('label') || ''
          node.data('label', nodeStyle.icon + '\n' + currentLabel)
          node.style('font-size', '48px')
          node.style('text-valign', 'center')
          node.style('text-margin-y', 0)
          // Make background transparent
          node.style('background-color', 'transparent')
          node.style('border-width', 0)
          node.style('shape', 'roundrectangle')
        } else {
          // Regular display with geometric shape
          node.style('background-opacity', 1)
          node.style('text-valign', 'center')
          node.style('text-margin-y', 0)
          if (nodeStyle.shape) {
            node.style('shape', nodeStyle.shape)
          }
        }
      }

      // Apply text styling from card template
      // Card template's textStyle defines default text appearance for all attributes on the card
      const textStyle = activeTemplate?.textStyle
      if (textStyle) {
        if (textStyle.fontSize) {
          node.style('font-size', `${textStyle.fontSize}px`)
        }
        if (textStyle.fontFamily) {
          node.style('font-family', textStyle.fontFamily)
        }
        if (textStyle.color) {
          node.style('color', textStyle.color)
        }
        if (textStyle.fontWeight) {
          node.style('font-weight', textStyle.fontWeight)
        }
        if (textStyle.fontStyle) {
          node.style('font-style', textStyle.fontStyle)
        }
        if (textStyle.textDecoration === 'underline') {
          node.style('text-decoration', 'underline')
        } else if (textStyle.textDecoration === 'line-through') {
          node.style('text-decoration', 'line-through')
        }
        if (textStyle.textShadow) {
          node.style('text-shadow', textStyle.textShadow)
        }
        if (textStyle.textOutlineWidth && textStyle.textOutlineColor) {
          node.style('text-outline-width', textStyle.textOutlineWidth)
          node.style('text-outline-color', textStyle.textOutlineColor)
        }
      }
    })

    // Apply template-based styling to edges
    cy.edges().forEach((edge) => {
      const edgeData = edge.data() as EdgeData
      const ruleResult = computeEdgeStyle(edgeData, enabledRules)

      // Determine which edge template to use
      const defaultEdgeTemplate = getDefaultEdgeTemplate()
      let activeEdgeTemplate = defaultEdgeTemplate

      if (ruleResult.edgeTemplateId) {
        const ruleTemplate = getEdgeTemplate(ruleResult.edgeTemplateId)
        if (ruleTemplate) {
          activeEdgeTemplate = ruleTemplate
        }
      }

      // Apply edge styling from template
      if (activeEdgeTemplate) {
        if (activeEdgeTemplate.lineColor) {
          edge.style('line-color', activeEdgeTemplate.lineColor)
          edge.style('target-arrow-color', activeEdgeTemplate.lineColor)
        }
        if (activeEdgeTemplate.lineWidth !== undefined) {
          edge.style('width', activeEdgeTemplate.lineWidth)
        }
        if (activeEdgeTemplate.lineStyle) {
          edge.style('line-style', activeEdgeTemplate.lineStyle)
        }
        if (activeEdgeTemplate.opacity !== undefined) {
          edge.style('opacity', activeEdgeTemplate.opacity)
        }
        if (activeEdgeTemplate.arrowShape) {
          edge.style('target-arrow-shape', activeEdgeTemplate.arrowShape)
        }
        if (activeEdgeTemplate.label) {
          edge.style('label', activeEdgeTemplate.label)
        }
        if (activeEdgeTemplate.labelFontSize) {
          edge.style('font-size', `${activeEdgeTemplate.labelFontSize}px`)
        }
        if (activeEdgeTemplate.labelColor) {
          edge.style('color', activeEdgeTemplate.labelColor)
        }
        if (activeEdgeTemplate.labelBackgroundColor) {
          edge.style('text-background-color', activeEdgeTemplate.labelBackgroundColor)
          edge.style('text-background-opacity', 1)
        }
      }
    })
  }, [styleRules, nodes, edges, cardTemplates, edgeTemplates])

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-50 dark:bg-gray-900"
    />
  )
}

// Base Cytoscape styles
function getCytoscapeStyles() {
  return [
    {
      selector: 'node',
      style: {
        'shape': 'roundrectangle',
        'background-color': '#0ea5e9',
        'border-width': 2,
        'border-color': '#0284c7',
        'label': 'data(label)',
        'color': '#1f2937',
        'text-valign': 'center',
        'text-halign': 'center',
        'text-wrap': 'wrap',
        'text-max-width': '240px',
        'font-size': '11px',
        'font-weight': 'bold',
        'text-outline-color': '#ffffff',
        'text-outline-width': 2,
        'text-background-color': 'transparent',
        'text-background-opacity': 0,
        'text-background-padding': '0px',
        'width': 'data(dynamicWidth)',
        'height': 'data(dynamicHeight)',
      },
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-width': 4,
        'border-color': '#fbbf24',
      },
    },
    {
      selector: 'node[isStub = true]',
      style: {
        'border-style': 'dashed',
        'opacity': 0.7,
        'background-color': '#9ca3af',
      },
    },
    {
      selector: 'node[isGroup]',
      style: {
        'background-color': '#f3f4f6',
        'background-opacity': 0.3,
        'border-color': '#6366f1',
        'border-width': 2,
        'border-style': 'solid',
        'shape': 'roundrectangle',
        'padding': '20px',
        'text-valign': 'top',
        'text-halign': 'center',
        'font-size': '14px',
        'font-weight': 'bold',
        'color': '#4f46e5',
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.9,
        'text-background-padding': '4px',
        'text-background-shape': 'roundrectangle',
      },
    },
    {
      selector: ':parent',
      style: {
        'background-color': '#f3f4f6',
        'background-opacity': 0.3,
        'border-color': '#6366f1',
        'border-width': 2,
        'padding': '20px',
      },
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': '#9ca3af',
        'target-arrow-color': '#9ca3af',
        'target-arrow-shape': 'triangle',
        'curve-style': 'unbundled-bezier',
        'control-point-distances': [40, -40],
        'control-point-weights': [0.25, 0.75],
        'arrow-scale': 1,
        'edge-distances': 'node-position',
      },
    },
    {
      selector: 'edge.highlighted',
      style: {
        'line-color': '#fbbf24',
        'target-arrow-color': '#fbbf24',
        'width': 3,
      },
    },
    {
      selector: ':selected',
      style: {
        'border-width': 4,
        'border-color': '#ef4444',
      },
    },
  ]
}

// Run layout
function runLayout(cy: Core, layoutType: string, layoutConfig?: any) {
  const layouts: Record<string, any> = {
    'fcose': {
      name: 'fcose',
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
      // Fast Compound Spring Embedder - ideal for internet topology
      quality: 'proof',
      randomize: false,
      nodeDimensionsIncludeLabels: true,
      // Ideal edge length (higher = more spread out)
      idealEdgeLength: 250,
      // Edge elasticity (how much edges resist stretching)
      edgeElasticity: 0.45,
      // Node separation (higher = more space between nodes)
      nodeRepulsion: 8000,
      // Nesting/grouping factor for compound nodes
      nestingFactor: 0.1,
      // Gravity pulls nodes together (lower = more spread)
      gravity: 0.25,
      // Number of iterations
      numIter: 2500,
      // Tile disconnected components
      tile: true,
      tilingPaddingVertical: 40,
      tilingPaddingHorizontal: 40,
      // Gravity range (how far gravity reaches)
      gravityRange: 3.8,
      // Initial temperature (cooling schedule)
      initialTemp: 1000,
      // Cooling factor
      coolingFactor: 0.95,
      // Minimum temperature before termination
      minTemp: 1.0,
    },
    'dagre': {
      name: 'dagre',
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
      // Hierarchical directed graph layout - ideal for network hierarchy
      nodeSep: 100,              // Separation between adjacent nodes
      edgeSep: 50,               // Separation between adjacent edges
      rankSep: 150,              // Separation between ranks
      rankDir: layoutConfig.options?.rankDir || 'TB',  // Direction: TB, BT, LR, RL
      ranker: 'network-simplex', // Ranking algorithm: network-simplex, tight-tree, longest-path
      minLen: 1,                 // Min edge length
      edgeWeight: 1,             // Edge weight (affects layout)
      nodeDimensionsIncludeLabels: true,
    },
    'cose-bilkent': {
      name: 'cose-bilkent',
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
      randomize: false,
      nodeRepulsion: 10000,
      idealEdgeLength: 200,
      edgeElasticity: 0.45,
      nestingFactor: 0.1,
      gravity: 0.4,
      numIter: 5000,
      tile: true,
      tilingPaddingVertical: 30,
      tilingPaddingHorizontal: 30,
      // Quality settings for better edge routing and overlap avoidance
      quality: 'proof',
      nodeDimensionsIncludeLabels: true,
      // Compound node specific settings
      allowNodesInsideCompound: true,
    },
    'cola': {
      name: 'cola',
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
      nodeSpacing: 100,
      edgeLength: 200,
      convergenceThreshold: 0.01,
      // Aggressive overlap avoidance
      avoidOverlap: true,
      handleDisconnected: true,
      flow: undefined,
      alignment: undefined,
      gapInequalities: undefined,
      // More iterations for better results
      maxSimulationTime: 4000,
    },
    'breadthfirst': {
      name: 'breadthfirst',
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
      directed: true,
      spacingFactor: 1.75,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      // Creates hierarchical tree-like layout
      grid: false,
      roots: undefined,
    },
    'concentric': {
      name: 'concentric',
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      spacingFactor: 1.5,
      // Arranges nodes in concentric circles
      minNodeSpacing: 50,
      concentric: (node: any) => node.degree(),
      levelWidth: () => 2,
    },
    'circle': {
      name: 'circle',
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      spacingFactor: 1.5,
    },
    'grid': {
      name: 'grid',
      animate: true,
      animationDuration: 1000,
      fit: true,
      padding: 50,
      rows: undefined,
      cols: undefined,
      avoidOverlap: true,
      avoidOverlapPadding: 20,
      nodeDimensionsIncludeLabels: true,
      spacingFactor: 1.5,
    },
    'timeline': {
      name: 'preset',
      fit: true,
      padding: 50,
      animate: true,
      animationDuration: 1000,
      positions: (node: NodeSingular) => {
        const nodeData = node.data() as any
        const timestamp = nodeData.timestamp

        if (timestamp) {
          // Get all nodes with timestamps
          const nodesWithTimestamps = cy.nodes().filter((n: NodeSingular) => {
            const data = n.data() as any
            return data.timestamp !== undefined
          })

          // Find min/max timestamps for scaling
          const timestamps = nodesWithTimestamps.map((n: NodeSingular) => (n.data() as any).timestamp)
          const minTime = Math.min(...timestamps)
          const maxTime = Math.max(...timestamps)
          const timeRange = maxTime - minTime || 1

          // Scale X position based on timestamp (left to right over time)
          const graphWidth = cy.width() - 200 // Leave padding
          const x = 100 + ((timestamp - minTime) / timeRange) * graphWidth

          // Y position: distribute vertically to avoid overlap
          const nodeIndex = node.id()
          const hash = nodeIndex.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
          const y = 100 + (hash % 5) * 150 // Distribute across 5 vertical lanes

          return { x, y }
        }

        // Nodes without timestamps: place at the end
        const nodeIndex = node.id()
        const hash = nodeIndex.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return {
          x: cy.width() - 100,
          y: 100 + (hash % 10) * 80
        }
      }
    },
  }

  const config = layouts[layoutType] || layouts['cose-bilkent']
  cy.layout(config).run()
}

/**
 * Graph Controls Component
 */
export function GraphControls() {
  const { layoutConfig, setLayoutType, setLayoutConfig } = useLayoutStore()
  const [edgeCurveStyle, setEdgeCurveStyle] = useState('unbundled-bezier')
  const [isExpanded, setIsExpanded] = useState(false)
  const [rankDir, setRankDir] = useState('TB')

  const handleLayout = (type: string) => {
    setLayoutType(type as any)
  }

  const handleRankDirChange = (dir: string) => {
    setRankDir(dir)
    // Update the layout config options
    setLayoutConfig({
      ...layoutConfig,
      options: {
        ...layoutConfig.options,
        rankDir: dir
      }
    })
  }

  // Apply edge curve style when changed
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('cytoscape-edge-style', { detail: edgeCurveStyle }))
  }, [edgeCurveStyle])

  const handleFit = () => {
    window.dispatchEvent(new CustomEvent('cytoscape-fit'))
  }

  const handleZoomIn = () => {
    window.dispatchEvent(new CustomEvent('cytoscape-zoom-in'))
  }

  const handleZoomOut = () => {
    window.dispatchEvent(new CustomEvent('cytoscape-zoom-out'))
  }

  const handleCenter = () => {
    window.dispatchEvent(new CustomEvent('cytoscape-center'))
  }

  const handleExportPNG = () => {
    window.dispatchEvent(new CustomEvent('cytoscape-export-png'))
  }

  const handleExportJSON = () => {
    window.dispatchEvent(new CustomEvent('cytoscape-export-json'))
  }

  return (
    <>
      {/* Minimized Toggle Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="absolute top-4 right-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 z-30"
          title="Layout Controls"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
          </svg>
        </button>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 space-y-2 border border-gray-200 dark:border-gray-700 min-w-[200px] z-30">
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Layout Algorithm
        </label>
        <select
          value={layoutConfig.type}
          onChange={(e) => handleLayout(e.target.value)}
          className="w-full p-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-cyber-500"
        >
          <option value="fcose">fCoSE (Internet Topology) ⭐</option>
          <option value="dagre">Dagre (Hierarchical DAG) ⭐</option>
          <option value="timeline">Timeline (Timestamp-based) 🕒</option>
          <option value="cose-bilkent">Force-Directed</option>
          <option value="cola">Constraint-Based (No Overlap)</option>
          <option value="breadthfirst">Hierarchical Tree</option>
          <option value="concentric">Concentric Circles</option>
          <option value="circle">Circle</option>
          <option value="grid">Grid</option>
        </select>
      </div>

      {/* Direction control for hierarchical layouts */}
      {(layoutConfig.type === 'dagre' || layoutConfig.type === 'breadthfirst') && (
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Direction
          </label>
          <select
            value={rankDir}
            onChange={(e) => handleRankDirChange(e.target.value)}
            className="w-full p-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-cyber-500"
          >
            <option value="TB">Top to Bottom ↓</option>
            <option value="BT">Bottom to Top ↑</option>
            <option value="LR">Left to Right →</option>
            <option value="RL">Right to Left ←</option>
          </select>
        </div>
      )}

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Edge Style
        </label>
        <select
          value={edgeCurveStyle}
          onChange={(e) => setEdgeCurveStyle(e.target.value)}
          className="w-full p-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-cyber-500"
        >
          <option value="unbundled-bezier">Curved (Default)</option>
          <option value="bezier">Bezier</option>
          <option value="straight">Straight</option>
          <option value="haystack">Haystack (Fast)</option>
          <option value="segments">Segments</option>
          <option value="taxi">Taxi (90° angles)</option>
        </select>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          View Controls
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleZoomIn}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
            title="Zoom In"
          >
            Zoom +
          </button>
          <button
            onClick={handleZoomOut}
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
            title="Zoom Out"
          >
            Zoom −
          </button>
        </div>
        <button
          onClick={handleFit}
          className="w-full mt-2 px-3 py-2 text-sm bg-cyber-600 hover:bg-cyber-700 text-white rounded transition-colors"
        >
          Fit to Screen
        </button>
        <button
          onClick={handleCenter}
          className="w-full mt-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          Center View
        </button>
      </div>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Export
        </label>
        <button
          onClick={handleExportPNG}
          className="w-full px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
        >
          Export PNG
        </button>
        <button
          onClick={handleExportJSON}
          className="w-full mt-2 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
        >
          Export Graph JSON
        </button>
      </div>

          {/* Close Button */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
