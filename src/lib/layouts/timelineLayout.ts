/**
 * Timeline layout algorithm
 * Positions nodes on X-axis by timestamp and groups on Y-axis
 */

import type { GraphNode, GraphEdge, TimelineSortOrder, TimelineSpacingMode } from '@/types'

export interface TimelineLayoutOptions {
  /** Attribute to group by for Y-axis swimlanes (optional) */
  swimlaneAttribute?: string
  /** Vertical spacing between swimlanes on Y-axis */
  verticalSpacing?: number
  /** X-axis spacing multiplier (affects horizontal time spacing) */
  xSpacingMultiplier?: number
  /** Y-axis spacing multiplier (affects vertical spacing within swimlanes) */
  ySpacingMultiplier?: number
  /** Sort order for swimlanes */
  swimlaneSort?: TimelineSortOrder
  /** Spacing mode - relative to time or equal spacing */
  spacingMode?: TimelineSpacingMode
  /** Start time filter (only show nodes after this timestamp) */
  startTime?: number
  /** End time filter (only show nodes before this timestamp) */
  endTime?: number
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
  /** Graph edges (for positioning stub nodes near parents) */
  edges?: GraphEdge[]
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
  swimlanes: Map<string, number>
}

/**
 * Calculate timeline layout positions for nodes
 */
export function calculateTimelineLayout(
  nodes: GraphNode[],
  options: TimelineLayoutOptions
): LayoutResult {
  const {
    swimlaneAttribute,
    verticalSpacing = 120,
    xSpacingMultiplier = 1.0,
    ySpacingMultiplier = 1.0,
    swimlaneSort = 'alphabetical',
    spacingMode = 'relative',
    startTime,
    endTime,
    width,
    height,
    edges = [],
  } = options

  const positions = new Map<string, { x: number; y: number }>()
  const swimlanes = new Map<string, number>()

  // Separate stub nodes from regular nodes
  const stubNodes = nodes.filter((n) => n.isStub)
  const regularNodes = nodes.filter((n) => !n.isStub)

  // Filter regular nodes with timestamps and apply time range filter
  let nodesWithTime = regularNodes.filter((n) => n.timestamp !== undefined)

  // Apply time range filtering
  if (startTime !== undefined) {
    nodesWithTime = nodesWithTime.filter((n) => (n.timestamp || 0) >= startTime)
  }
  if (endTime !== undefined) {
    nodesWithTime = nodesWithTime.filter((n) => (n.timestamp || 0) <= endTime)
  }

  const nodesWithoutTime = regularNodes.filter((n) => n.timestamp === undefined)

  if (nodesWithTime.length === 0) {
    // No timestamps, fall back to simple layout for regular nodes
    regularNodes.forEach((node, i) => {
      const angle = (i / regularNodes.length) * Math.PI * 2
      const radius = Math.min(width, height) / 3
      positions.set(node.id, {
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      })
    })

    // Position stub nodes to the right of the canvas
    stubNodes.forEach((node, i) => {
      positions.set(node.id, {
        x: width - 50,
        y: 50 + i * 40,
      })
    })

    return { positions, swimlanes }
  }

  // Sort nodes by timestamp
  const sortedNodes = [...nodesWithTime].sort((a, b) => {
    return (a.timestamp || 0) - (b.timestamp || 0)
  })

  // Get time range
  const minTime = sortedNodes[0].timestamp || 0
  const maxTime = sortedNodes[sortedNodes.length - 1].timestamp || 0
  const timeRange = maxTime - minTime || 1

  // Group nodes by swimlane if attribute specified
  if (swimlaneAttribute) {
    const groupMap = new Map<string, GraphNode[]>()

    sortedNodes.forEach((node) => {
      const attrValue = node.attributes[swimlaneAttribute]
      const groupKey = Array.isArray(attrValue)
        ? attrValue[0]
        : attrValue
        ? String(attrValue)
        : 'unknown'

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, [])
      }
      groupMap.get(groupKey)!.push(node)
    })

    // Sort swimlanes
    let groups = Array.from(groupMap.keys())
    if (swimlaneSort === 'alphabetical') {
      groups = groups.sort((a, b) => a.localeCompare(b))
    } else if (swimlaneSort === 'count') {
      groups = groups.sort((a, b) => {
        const aCount = groupMap.get(a)?.length || 0
        const bCount = groupMap.get(b)?.length || 0
        return bCount - aCount // Descending order (most nodes first)
      })
    }
    // 'custom' order keeps the original order

    // Assign Y positions to swimlanes with configurable spacing
    const swimlaneCount = groups.length
    const swimlaneHeight = Math.max(verticalSpacing, (height - 100) / swimlaneCount) * ySpacingMultiplier

    groups.forEach((group, i) => {
      const yPos = 50 + i * swimlaneHeight + swimlaneHeight / 2
      swimlanes.set(group, yPos)
    })

    // Position nodes based on spacing mode
    if (spacingMode === 'equal') {
      // Equal spacing mode - nodes evenly distributed, sorted by time
      groupMap.forEach((groupNodes, group) => {
        const yPos = swimlanes.get(group) || height / 2
        const nodeCount = groupNodes.length

        groupNodes.forEach((node, index) => {
          const xPos = nodeCount > 1
            ? 50 + (index / (nodeCount - 1)) * (width - 100) * xSpacingMultiplier
            : width / 2

          positions.set(node.id, { x: xPos, y: yPos })
        })
      })
    } else {
      // Relative spacing mode - positions relative to timestamp
      groupMap.forEach((groupNodes, group) => {
        const yPos = swimlanes.get(group) || height / 2

        groupNodes.forEach((node) => {
          const timeFraction = ((node.timestamp || 0) - minTime) / timeRange
          const xPos = 50 + timeFraction * (width - 100) * xSpacingMultiplier

          positions.set(node.id, { x: xPos, y: yPos })
        })
      })
    }
  } else {
    // No swimlanes
    if (spacingMode === 'equal') {
      // Equal spacing mode - nodes evenly distributed, sorted by time
      const nodeCount = sortedNodes.length
      sortedNodes.forEach((node, index) => {
        const xPos = nodeCount > 1
          ? 50 + (index / (nodeCount - 1)) * (width - 100) * xSpacingMultiplier
          : width / 2
        const yPos = height / 2 + (Math.random() - 0.5) * (height / 3) * ySpacingMultiplier

        positions.set(node.id, { x: xPos, y: yPos })
      })
    } else {
      // Relative spacing mode - use Y-axis jitter
      sortedNodes.forEach((node) => {
        const timeFraction = ((node.timestamp || 0) - minTime) / timeRange
        const xPos = 50 + timeFraction * (width - 100) * xSpacingMultiplier
        const yPos = height / 2 + (Math.random() - 0.5) * (height / 3) * ySpacingMultiplier

        positions.set(node.id, { x: xPos, y: yPos })
      })
    }
  }

  // Position nodes without timestamps at the end
  nodesWithoutTime.forEach((node, i) => {
    const xPos = width - 50
    const yPos = 50 + i * 40

    positions.set(node.id, { x: xPos, y: yPos })
  })

  // Position stub nodes adjacent to their parent nodes
  const stubGap = 80 // Gap between parent and stub node
  const stubVerticalOffset = 0 // Vertical offset from parent

  stubNodes.forEach((stubNode) => {
    // Find parent node (node that links to this stub)
    const parentEdge = edges.find((edge) => edge.target === stubNode.id)

    if (parentEdge) {
      const parentPos = positions.get(parentEdge.source)
      if (parentPos) {
        // Position stub node to the right of parent with a gap
        positions.set(stubNode.id, {
          x: parentPos.x + stubGap,
          y: parentPos.y + stubVerticalOffset,
        })
      } else {
        // Fallback: position at the right edge
        positions.set(stubNode.id, {
          x: width - 50,
          y: height / 2,
        })
      }
    } else {
      // No parent found, position at the right edge
      positions.set(stubNode.id, {
        x: width - 50,
        y: height / 2,
      })
    }
  })

  return { positions, swimlanes }
}
