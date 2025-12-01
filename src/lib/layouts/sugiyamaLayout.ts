/**
 * Sugiyama (Hierarchical) Layout Algorithm
 * A layered graph drawing algorithm for directed acyclic graphs
 */

import type { GraphNode, GraphEdge } from '@/types'

export interface SugiyamaLayoutOptions {
  width: number
  height: number
  rankSeparation?: number
  nodeSeparation?: number
  direction?: 'TB' | 'BT' | 'LR' | 'RL'
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
  swimlanes?: Map<string, number>
}

/**
 * Calculate Sugiyama layout positions for nodes
 */
export function calculateSugiyamaLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: SugiyamaLayoutOptions
): LayoutResult {
  const { width, height, rankSeparation = 100, nodeSeparation = 80, direction = 'TB' } = options
  const positions = new Map<string, { x: number; y: number }>()
  const swimlanes = new Map<string, number>()

  if (nodes.length === 0) {
    return { positions, swimlanes }
  }

  // Build adjacency lists
  const outgoing = new Map<string, Set<string>>()
  const incoming = new Map<string, Set<string>>()

  nodes.forEach(node => {
    outgoing.set(node.id, new Set())
    incoming.set(node.id, new Set())
  })

  edges.forEach(edge => {
    outgoing.get(edge.source)?.add(edge.target)
    incoming.get(edge.target)?.add(edge.source)
  })

  // Assign nodes to layers using longest path
  const layers: string[][] = []
  const nodeLayer = new Map<string, number>()
  const visited = new Set<string>()

  // Find root nodes (nodes with no incoming edges)
  const roots = nodes.filter(node => incoming.get(node.id)!.size === 0)

  // BFS to assign layers
  const queue: Array<{ id: string; layer: number }> = roots.map(node => ({ id: node.id, layer: 0 }))

  while (queue.length > 0) {
    const { id, layer } = queue.shift()!

    if (visited.has(id)) continue
    visited.add(id)

    // Update layer assignment
    const currentLayer = nodeLayer.get(id) ?? layer
    if (layer > currentLayer) {
      nodeLayer.set(id, layer)
    } else {
      nodeLayer.set(id, currentLayer)
    }

    // Add children to queue
    outgoing.get(id)?.forEach(childId => {
      queue.push({ id: childId, layer: (nodeLayer.get(id) ?? 0) + 1 })
    })
  }

  // Handle disconnected nodes
  nodes.forEach(node => {
    if (!nodeLayer.has(node.id)) {
      nodeLayer.set(node.id, 0)
    }
  })

  // Group nodes by layer
  const maxLayer = Math.max(...Array.from(nodeLayer.values()), 0)
  for (let i = 0; i <= maxLayer; i++) {
    layers[i] = []
  }

  nodes.forEach(node => {
    const layer = nodeLayer.get(node.id) ?? 0
    layers[layer].push(node.id)
    swimlanes.set(node.id, layer)
  })

  // Position nodes
  const isVertical = direction === 'TB' || direction === 'BT'
  const layerCount = layers.length
  const totalRankSpace = (layerCount - 1) * rankSeparation

  layers.forEach((layer, layerIndex) => {
    const nodeCount = layer.length
    const totalNodeSpace = (nodeCount - 1) * nodeSeparation

    layer.forEach((nodeId, nodeIndex) => {
      let x: number, y: number

      if (isVertical) {
        // Vertical layout (TB or BT)
        x = (width - totalNodeSpace) / 2 + nodeIndex * nodeSeparation
        y = (height - totalRankSpace) / 2 + layerIndex * rankSeparation

        if (direction === 'BT') {
          y = height - y
        }
      } else {
        // Horizontal layout (LR or RL)
        x = (width - totalRankSpace) / 2 + layerIndex * rankSeparation
        y = (height - totalNodeSpace) / 2 + nodeIndex * nodeSeparation

        if (direction === 'RL') {
          x = width - x
        }
      }

      positions.set(nodeId, { x, y })
    })
  })

  return { positions, swimlanes }
}
