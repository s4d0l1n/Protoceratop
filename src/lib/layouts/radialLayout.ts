/**
 * Radial layout algorithm
 * Places high-degree (hub) nodes in the center with connected nodes radiating outward
 */

import type { GraphNode, GraphEdge } from '@/types'

export interface RadialLayoutOptions {
  width: number
  height: number
  innerRadius?: number
  radiusStep?: number
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
}

/**
 * Calculate radial layout with hub nodes in center
 */
export function calculateRadialLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: RadialLayoutOptions
): LayoutResult {
  const { width, height, innerRadius = 100, radiusStep = 120 } = options

  const positions = new Map<string, { x: number; y: number }>()
  const centerX = width / 2
  const centerY = height / 2

  if (nodes.length === 0) {
    return { positions }
  }

  // Calculate degree (number of connections) for each node
  const degreeMap = new Map<string, number>()
  nodes.forEach((node) => degreeMap.set(node.id, 0))

  edges.forEach((edge) => {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1)
    degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1)
  })

  // Sort nodes by degree (descending)
  const sortedNodes = [...nodes].sort((a, b) => {
    return (degreeMap.get(b.id) || 0) - (degreeMap.get(a.id) || 0)
  })

  // Build adjacency map
  const adjacency = new Map<string, Set<string>>()
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, new Set())
    }
    if (!adjacency.has(edge.target)) {
      adjacency.set(edge.target, new Set())
    }
    adjacency.get(edge.source)!.add(edge.target)
    adjacency.get(edge.target)!.add(edge.source)
  })

  // Assign nodes to rings based on their relationship to hub nodes
  const nodeRings = new Map<string, number>()
  const placedNodes = new Set<string>()

  // Place hub nodes (top 20% or at least 1) in center ring
  const hubCount = Math.max(1, Math.ceil(nodes.length * 0.2))
  const hubs = sortedNodes.slice(0, hubCount)

  hubs.forEach((hub) => {
    nodeRings.set(hub.id, 0)
    placedNodes.add(hub.id)
  })

  // Assign remaining nodes to rings based on distance from hubs
  let currentRing = 1
  let remainingNodes = new Set(nodes.map((n) => n.id))
  hubs.forEach((hub) => remainingNodes.delete(hub.id))

  while (remainingNodes.size > 0 && currentRing < 10) {
    const nodesInCurrentRing: string[] = []

    // Find nodes connected to previous ring
    nodes.forEach((node) => {
      if (placedNodes.has(node.id)) return

      const neighbors = adjacency.get(node.id) || new Set()
      const hasNeighborInPrevRing = Array.from(neighbors).some(
        (neighborId) => nodeRings.get(neighborId) === currentRing - 1
      )

      if (hasNeighborInPrevRing) {
        nodesInCurrentRing.push(node.id)
      }
    })

    // If no nodes found, place remaining nodes with lowest degree
    if (nodesInCurrentRing.length === 0 && remainingNodes.size > 0) {
      const unplacedByDegree = Array.from(remainingNodes)
        .map((id) => ({ id, degree: degreeMap.get(id) || 0 }))
        .sort((a, b) => a.degree - b.degree)

      nodesInCurrentRing.push(unplacedByDegree[0].id)
    }

    nodesInCurrentRing.forEach((nodeId) => {
      nodeRings.set(nodeId, currentRing)
      placedNodes.add(nodeId)
      remainingNodes.delete(nodeId)
    })

    currentRing++
  }

  // Position nodes in their assigned rings
  const ringGroups = new Map<number, string[]>()
  nodeRings.forEach((ring, nodeId) => {
    if (!ringGroups.has(ring)) {
      ringGroups.set(ring, [])
    }
    ringGroups.get(ring)!.push(nodeId)
  })

  ringGroups.forEach((nodeIds, ring) => {
    const radius = ring === 0 ? 0 : innerRadius + ring * radiusStep
    const nodesInRing = nodeIds.length

    nodeIds.forEach((nodeId, index) => {
      if (ring === 0 && nodesInRing === 1) {
        // Single hub node at center
        positions.set(nodeId, { x: centerX, y: centerY })
      } else {
        // Distribute evenly around the ring
        const angle = (index / nodesInRing) * Math.PI * 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        positions.set(nodeId, { x, y })
      }
    })
  })

  return { positions }
}
