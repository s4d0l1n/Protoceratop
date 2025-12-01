/**
 * Kamada-Kawai layout algorithm
 * Spring-based layout minimizing energy
 */

import type { GraphNode, GraphEdge } from '@/types'

export interface KamadaKawaiLayoutOptions {
  /** Spring constant */
  springConstant?: number
  /** Spring length */
  springLength?: number
  /** Maximum iterations */
  maxIterations?: number
  /** Convergence threshold */
  epsilon?: number
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
}

/**
 * Calculate shortest path distances using Floyd-Warshall
 */
function calculateShortestPaths(
  nodes: GraphNode[],
  edges: GraphEdge[]
): Map<string, Map<string, number>> {
  const distances = new Map<string, Map<string, number>>()

  // Initialize distances
  nodes.forEach((nodeA) => {
    const distMap = new Map<string, number>()
    nodes.forEach((nodeB) => {
      if (nodeA.id === nodeB.id) {
        distMap.set(nodeB.id, 0)
      } else {
        distMap.set(nodeB.id, Infinity)
      }
    })
    distances.set(nodeA.id, distMap)
  })

  // Set edge distances
  edges.forEach((edge) => {
    distances.get(edge.source)?.set(edge.target, 1)
    distances.get(edge.target)?.set(edge.source, 1)
  })

  // Floyd-Warshall algorithm
  nodes.forEach((nodeK) => {
    nodes.forEach((nodeI) => {
      nodes.forEach((nodeJ) => {
        const distIK = distances.get(nodeI.id)?.get(nodeK.id) || Infinity
        const distKJ = distances.get(nodeK.id)?.get(nodeJ.id) || Infinity
        const distIJ = distances.get(nodeI.id)?.get(nodeJ.id) || Infinity

        if (distIK + distKJ < distIJ) {
          distances.get(nodeI.id)?.set(nodeJ.id, distIK + distKJ)
        }
      })
    })
  })

  return distances
}

/**
 * Calculate energy for a node
 */
function calculateEnergy(
  nodeId: string,
  positions: Map<string, { x: number; y: number }>,
  nodes: GraphNode[],
  distances: Map<string, Map<string, number>>,
  springConstant: number,
  springLength: number
): { ex: number; ey: number } {
  let ex = 0
  let ey = 0

  const pos = positions.get(nodeId)!

  nodes.forEach((otherNode) => {
    if (otherNode.id === nodeId) return

    const otherPos = positions.get(otherNode.id)!
    const idealDist = (distances.get(nodeId)?.get(otherNode.id) || 1) * springLength

    const dx = pos.x - otherPos.x
    const dy = pos.y - otherPos.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01

    const k = springConstant / (idealDist * idealDist)
    const force = k * (dist - idealDist)

    ex += force * (dx / dist)
    ey += force * (dy / dist)
  })

  return { ex, ey }
}

/**
 * Calculate Kamada-Kawai layout positions for nodes
 */
export function calculateKamadaKawaiLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: KamadaKawaiLayoutOptions
): LayoutResult {
  const {
    springConstant = 1,
    springLength = 50,
    maxIterations = 100,
    epsilon = 0.1,
    width,
    height,
  } = options

  const positions = new Map<string, { x: number; y: number }>()

  if (nodes.length === 0) return { positions }

  // Initialize positions in a circle
  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2
    const radius = Math.min(width, height) / 3
    positions.set(node.id, {
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
    })
  })

  if (nodes.length === 1) {
    positions.set(nodes[0].id, { x: width / 2, y: height / 2 })
    return { positions }
  }

  // Calculate shortest path distances
  const distances = calculateShortestPaths(nodes, edges)

  // Iterative optimization
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let maxDelta = 0

    // For each node, calculate energy gradient and move
    nodes.forEach((node) => {
      const { ex, ey } = calculateEnergy(
        node.id,
        positions,
        nodes,
        distances,
        springConstant,
        springLength
      )

      const energyMagnitude = Math.sqrt(ex * ex + ey * ey)

      if (energyMagnitude > epsilon) {
        const pos = positions.get(node.id)!

        // Move node in direction opposite to energy gradient
        const step = Math.min(10, energyMagnitude * 0.1)
        pos.x -= (ex / energyMagnitude) * step
        pos.y -= (ey / energyMagnitude) * step

        // Keep within bounds
        pos.x = Math.max(50, Math.min(width - 50, pos.x))
        pos.y = Math.max(50, Math.min(height - 50, pos.y))

        maxDelta = Math.max(maxDelta, step)
      }
    })

    // Check for convergence
    if (maxDelta < epsilon) {
      break
    }
  }

  return { positions }
}
