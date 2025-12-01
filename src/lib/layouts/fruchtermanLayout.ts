/**
 * Fruchterman-Reingold layout algorithm
 * Force-directed layout with balanced edge lengths
 */

import type { GraphNode, GraphEdge } from '@/types'

export interface FruchtermanLayoutOptions {
  /** Number of iterations */
  iterations?: number
  /** Initial temperature (controls movement decay) */
  temperature?: number
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
}

interface Vector2D {
  x: number
  y: number
}

/**
 * Calculate repulsive force between two nodes
 */
function calculateRepulsion(distance: number, k: number): number {
  if (distance === 0) return 0
  return (k * k) / distance
}

/**
 * Calculate attractive force for connected nodes
 */
function calculateAttraction(distance: number, k: number): number {
  return (distance * distance) / k
}

/**
 * Cool down temperature
 */
function cool(temperature: number, iteration: number, maxIterations: number): number {
  return temperature * (1 - iteration / maxIterations)
}

/**
 * Calculate Fruchterman-Reingold layout positions for nodes
 */
export function calculateFruchtermanLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: FruchtermanLayoutOptions
): LayoutResult {
  const {
    iterations = 50,
    temperature: initialTemperature = 100,
    width,
    height,
  } = options

  const positions = new Map<string, { x: number; y: number }>()
  const displacement = new Map<string, Vector2D>()

  // Initialize random positions
  nodes.forEach((node) => {
    positions.set(node.id, {
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
    })
    displacement.set(node.id, { x: 0, y: 0 })
  })

  if (nodes.length === 0) return { positions }
  if (nodes.length === 1) {
    positions.set(nodes[0].id, { x: width / 2, y: height / 2 })
    return { positions }
  }

  // Calculate optimal distance between nodes
  const area = width * height
  const k = Math.sqrt(area / nodes.length)

  // Build adjacency map for faster edge lookups
  const adjacencyMap = new Map<string, Set<string>>()
  nodes.forEach((node) => {
    adjacencyMap.set(node.id, new Set())
  })
  edges.forEach((edge) => {
    adjacencyMap.get(edge.source)?.add(edge.target)
    adjacencyMap.get(edge.target)?.add(edge.source)
  })

  // Simulation loop
  for (let iteration = 0; iteration < iterations; iteration++) {
    // Reset displacement
    nodes.forEach((node) => {
      displacement.set(node.id, { x: 0, y: 0 })
    })

    // Calculate repulsive forces between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]
        const nodeB = nodes[j]

        const posA = positions.get(nodeA.id)!
        const posB = positions.get(nodeB.id)!

        const dx = posA.x - posB.x
        const dy = posA.y - posB.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.01

        const repulsion = calculateRepulsion(distance, k)
        const fx = (dx / distance) * repulsion
        const fy = (dy / distance) * repulsion

        const dispA = displacement.get(nodeA.id)!
        const dispB = displacement.get(nodeB.id)!

        dispA.x += fx
        dispA.y += fy
        dispB.x -= fx
        dispB.y -= fy
      }
    }

    // Calculate attractive forces for connected nodes
    edges.forEach((edge) => {
      const posSource = positions.get(edge.source)!
      const posTarget = positions.get(edge.target)!

      const dx = posSource.x - posTarget.x
      const dy = posSource.y - posTarget.y
      const distance = Math.sqrt(dx * dx + dy * dy) || 0.01

      const attraction = calculateAttraction(distance, k)
      const fx = (dx / distance) * attraction
      const fy = (dy / distance) * attraction

      const dispSource = displacement.get(edge.source)!
      const dispTarget = displacement.get(edge.target)!

      dispSource.x -= fx
      dispSource.y -= fy
      dispTarget.x += fx
      dispTarget.y += fy
    })

    // Update positions with cooling
    const temperature = cool(initialTemperature, iteration, iterations)

    nodes.forEach((node) => {
      const pos = positions.get(node.id)!
      const disp = displacement.get(node.id)!

      const dispLength = Math.sqrt(disp.x * disp.x + disp.y * disp.y) || 0.01
      const limitedLength = Math.min(dispLength, temperature)

      pos.x += (disp.x / dispLength) * limitedLength
      pos.y += (disp.y / dispLength) * limitedLength

      // Keep within bounds
      pos.x = Math.max(50, Math.min(width - 50, pos.x))
      pos.y = Math.max(50, Math.min(height - 50, pos.y))
    })
  }

  return { positions }
}
