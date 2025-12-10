/**
 * Force-directed physics engine for graph layout
 *
 * Implements 4-phase physics simulation:
 * Phase 1: Explosion - Strong springs keep leaves close during initial spread
 * Phase 2: Retraction - Pull leaves closer to parents
 * Phase 3: Spacing - Strict collision enforcement for clean layout
 * Phase 4: Final snap - Extremely strong leaf attraction
 */

import { SpatialHashGrid, type SpatialNode } from '@/lib/spatialHash'
import type { Node } from '@/stores/graphStore'
import type { NodePosition, PhysicsParams } from '@/components/graph/types'

interface PhysicsEngineOptions {
  nodes: Node[]
  positions: Map<string, NodePosition>
  adjacency: Map<string, Set<string>>
  physicsParams: PhysicsParams
  nodeDeviationFactors: Map<string, number>
  draggedNodeId: string | null
  canvasWidth: number
  canvasHeight: number
  iterationCount: number
  maxIterations: number
  nodeRadius: number
}

/**
 * Calculate physics-based node positions for one frame
 */
export function calculatePhysicsFrame(options: PhysicsEngineOptions): Map<string, NodePosition> {
  const {
    nodes,
    positions: prev,
    adjacency,
    physicsParams,
    nodeDeviationFactors,
    draggedNodeId,
    canvasWidth,
    canvasHeight,
    iterationCount,
    maxIterations,
    nodeRadius
  } = options

  const updated = new Map<string, NodePosition>()

  const area = canvasWidth * canvasHeight
  const nodeCount = nodes.length
  const k = Math.sqrt(area / nodeCount) // Optimal spacing

  // Temperature for simulated annealing
  const progress = iterationCount / maxIterations
  const temperature = k * Math.pow(1 - progress, 2)

  // Initialize displacements map
  const displacements = new Map<string, { x: number; y: number }>()

  // Determine current phase (4 phases of equal length)
  const phase1Iterations = Math.floor(maxIterations * 0.25)
  const phase2Iterations = Math.floor(maxIterations * 0.25)
  const phase3Iterations = Math.floor(maxIterations * 0.25)

  const currentPhase = iterationCount < phase1Iterations ? 1
    : iterationCount < phase1Iterations + phase2Iterations ? 2
    : iterationCount < phase1Iterations + phase2Iterations + phase3Iterations ? 3
    : 4

  // PHASE 2 OPTIMIZATION: Spatial Hashing for Physics
  // Build spatial hash grid for O(N log N) repulsion instead of O(N²)
  const spatialHash = new SpatialHashGrid(500) // 500px cells
  const spatialNodes: SpatialNode[] = nodes.map(node => {
    const pos = prev.get(node.id)
    return {
      id: node.id,
      x: pos?.x || 0,
      y: pos?.y || 0,
      data: node
    }
  }).filter(n => n.x !== 0 || n.y !== 0)
  spatialHash.build(spatialNodes)

  // Calculate forces for all nodes
  nodes.forEach(node => {
    const pos = prev.get(node.id)
    if (!pos) return

    // If this is the dragged node, keep it at its current position
    if (draggedNodeId === node.id) {
      updated.set(node.id, { ...pos, vx: 0, vy: 0 })
      return
    }

    let fx = 0
    let fy = 0

    const neighbors = adjacency.get(node.id) || new Set()
    const nodeDegree = neighbors.size
    const isLeaf = nodeDegree === 1

    // FORCE 1: Attractive Springs (Edge Connections Only)
    neighbors.forEach(neighborId => {
      const neighborPos = prev.get(neighborId)
      if (!neighborPos) return

      const neighborDegree = (adjacency.get(neighborId) || new Set()).size
      const neighborIsLeaf = neighborDegree === 1

      // Classify connection types
      const isLeafConnection = isLeaf || neighborIsLeaf
      const isHubConnection = !isLeaf && !neighborIsLeaf

      let idealLength: number
      let springStrength: number

      if (isLeafConnection) {
        // PHASE-DEPENDENT leaf spring parameters
        const leafMultiplier = physicsParams.leafSpringStrength
        if (currentPhase === 1) {
          // Phase 1: STRONG springs to keep children close during explosion
          idealLength = 30
          springStrength = 2.0 * leafMultiplier
        } else if (currentPhase === 2) {
          // Phase 2: Strong retraction
          idealLength = 40
          springStrength = 2.0 * leafMultiplier
        } else if (currentPhase === 3) {
          // Phase 3: Continue pulling closer
          idealLength = 20
          springStrength = 8.0 * leafMultiplier
        } else {
          // Phase 4: EXTREMELY strong final snap
          idealLength = 5
          springStrength = 20.0 * leafMultiplier
        }
      } else if (isHubConnection) {
        // HUB-TO-HUB CONNECTIONS: Use VERY WEAK spring force (payout behavior)
        idealLength = 500
        springStrength = physicsParams.hubEdgeStrength * physicsParams.attractionStrength
      } else {
        // Fallback
        idealLength = 250
        springStrength = 0.05 * physicsParams.attractionStrength
      }

      const dx = neighborPos.x - pos.x
      const dy = neighborPos.y - pos.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        // Hooke's law: F = k * (distance - idealLength)
        const stretch = distance - idealLength
        const force = stretch * springStrength

        fx += (dx / distance) * force
        fy += (dy / distance) * force
      }
    })

    // FORCE 1b: Additional Attractive Force for Leaf Nodes to Parent
    // Progressively stronger in phases 2-4
    if (currentPhase >= 2 && isLeaf && neighbors.size === 1) {
      const parentId = Array.from(neighbors)[0]
      const parentPos = prev.get(parentId)

      if (parentPos) {
        const dx = parentPos.x - pos.x
        const dy = parentPos.y - pos.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > 0) {
          // Progressive magnetic attraction
          let attractionStrength: number
          if (currentPhase === 2) {
            attractionStrength = 1.5
          } else if (currentPhase === 3) {
            attractionStrength = 5.0
          } else {
            attractionStrength = 10.0
          }

          const force = attractionStrength * distance

          fx += (dx / distance) * force
          fy += (dy / distance) * force
        }
      }
    }

    // FORCE 2: Strong Electrostatic Repulsion
    const nearbyNodes = spatialHash.getNearby(pos.x, pos.y, physicsParams.repulsionRadius)
    nearbyNodes.forEach(spatialNode => {
      const otherNode = spatialNode.data
      if (otherNode.id === node.id) return

      const otherPos = prev.get(otherNode.id)
      if (!otherPos) return

      const otherNeighbors = adjacency.get(otherNode.id) || new Set()
      const otherDegree = otherNeighbors.size
      const otherIsLeaf = otherDegree === 1

      // Check if they're siblings (share at least one common parent)
      const sharedParents = [...neighbors].filter(n => otherNeighbors.has(n))
      if (sharedParents.length > 0) {
        // Siblings don't repel
        return
      }

      const dx = pos.x - otherPos.x
      const dy = pos.y - otherPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        // Add variation based on node IDs for organic spacing
        const nodeHash = (node.id.charCodeAt(0) + otherNode.id.charCodeAt(0)) % 100
        const repulsionVariation = 0.5 + (nodeHash / 100) * 1.0

        // Apply node chaos
        const nodeRandomFactor = nodeDeviationFactors.get(node.id) || 0
        const otherRandomFactor = nodeDeviationFactors.get(otherNode.id) || 0
        const averageRandomFactor = (nodeRandomFactor + otherRandomFactor) / 2

        // Start with base repulsion * variation
        let repulsionStrength = physicsParams.repulsionStrength * repulsionVariation

        // Add chaos
        const MAX_REPULSION = 30000
        const MIN_REPULSION = 1000
        const chaosAmount = averageRandomFactor * (physicsParams.nodeChaosFactor / 100) * MAX_REPULSION
        repulsionStrength = Math.max(MIN_REPULSION, repulsionStrength + chaosAmount)

        // LEAF REPULSION FIX: Only reduce repulsion between leaf and its parent
        const areConnected = neighbors.has(otherNode.id)
        if (areConnected) {
          if (isLeaf) {
            repulsionStrength *= 0.15
          }
          if (otherIsLeaf) {
            repulsionStrength *= 0.15
          }
        }

        // HUB REPULSION BOOST
        if (!isLeaf && !otherIsLeaf && physicsParams.hubRepulsionBoost > 0) {
          const myDegree = nodeDegree
          const avgDegree = (myDegree + otherDegree) / 2

          if (avgDegree > 3) {
            const hubBoost = 1.0 + Math.sqrt((avgDegree - 3) / 3) * physicsParams.hubRepulsionBoost
            repulsionStrength *= hubBoost
          }
        }

        // FORCE 2b: Leaf-Parent Magnetic Repulsion
        if (!isLeaf && !otherIsLeaf) {
          // Count leaf children for both nodes
          let myLeafCount = 0
          neighbors.forEach(neighborId => {
            const neighborDegree = (adjacency.get(neighborId) || new Set()).size
            if (neighborDegree === 1) myLeafCount++
          })

          let otherLeafCount = 0
          otherNeighbors.forEach(neighborId => {
            const neighborDegree = (adjacency.get(neighborId) || new Set()).size
            if (neighborDegree === 1) otherLeafCount++
          })

          if (myLeafCount > 0 && otherLeafCount > 0) {
            // Magnetic repulsion
            const leafRepulsionMultiplier = Math.sqrt(myLeafCount * otherLeafCount) * 1.0
            repulsionStrength *= (1 + leafRepulsionMultiplier)

            // Add distance-based boost
            const criticalDistance = 300
            if (distance < criticalDistance) {
              const proximityBoost = (criticalDistance - distance) / criticalDistance
              repulsionStrength *= (1 + proximityBoost * 2.0)
            }
          }
        }

        // Coulomb's law: F = k / distance
        const force = repulsionStrength / distance

        fx += (dx / distance) * force
        fy += (dy / distance) * force
      }
    })

    // FORCE 3: Hub Attraction (Cluster Gravity)
    if (neighbors.size > 0) {
      let highestDegreeNeighbor: string | null = null
      let highestDegree = 0

      neighbors.forEach(neighborId => {
        const neighborDegree = (adjacency.get(neighborId) || new Set()).size
        if (neighborDegree > highestDegree) {
          highestDegree = neighborDegree
          highestDegreeNeighbor = neighborId
        }
      })

      if (highestDegreeNeighbor) {
        const hubPos = prev.get(highestDegreeNeighbor)
        if (hubPos) {
          const dx = hubPos.x - pos.x
          const dy = hubPos.y - pos.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance > 0) {
            const hubGravity = 0.05
            fx += (dx / distance) * distance * hubGravity
            fy += (dy / distance) * distance * hubGravity
          }
        }
      }
    }

    // FORCE 4: Center Gravity
    if (physicsParams.centerGravity > 0) {
      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2
      const dx = centerX - pos.x
      const dy = centerY - pos.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        fx += (dx / distance) * distance * physicsParams.centerGravity
        fy += (dy / distance) * distance * physicsParams.centerGravity
      }
    }

    displacements.set(node.id, { x: fx, y: fy })
  })

  // Apply forces with temperature-based damping
  displacements.forEach((force, nodeId) => {
    const pos = prev.get(nodeId)
    if (!pos) return

    if (draggedNodeId === nodeId) {
      updated.set(nodeId, { ...pos, vx: 0, vy: 0 })
      return
    }

    const forceLength = Math.sqrt(force.x * force.x + force.y * force.y)

    if (forceLength > 0) {
      const limitedLength = Math.min(forceLength, temperature)
      const damping = physicsParams.damping

      const vx = (force.x / forceLength) * limitedLength * damping
      const vy = (force.y / forceLength) * limitedLength * damping

      const newX = pos.x + vx
      const newY = pos.y + vy

      updated.set(nodeId, { x: newX, y: newY, vx, vy })
    } else {
      updated.set(nodeId, pos)
    }
  })

  // Collision Detection
  const nodeIds = Array.from(updated.keys())
  const collisionMinDistance = nodeRadius * 4.0

  // Phase-based collision enforcement
  const enforceLeafCollision = currentPhase >= 3

  for (let i = 0; i < nodeIds.length; i++) {
    const id1 = nodeIds[i]
    const pos1 = updated.get(id1)!
    const node1Degree = (adjacency.get(id1) || new Set()).size
    const node1IsLeaf = node1Degree === 1

    for (let j = i + 1; j < nodeIds.length; j++) {
      const id2 = nodeIds[j]
      const pos2 = updated.get(id2)!
      const node2Degree = (adjacency.get(id2) || new Set()).size
      const node2IsLeaf = node2Degree === 1

      // Skip collision for leaf nodes in Phase 1-2
      if (!enforceLeafCollision && (node1IsLeaf || node2IsLeaf)) {
        continue
      }

      const dx = pos2.x - pos1.x
      const dy = pos2.y - pos1.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Hard collision: push apart if too close
      if (distance < collisionMinDistance && distance > 0) {
        const overlap = collisionMinDistance - distance
        const collisionStrength = 1.0
        const pushDistance = (overlap / 2) * collisionStrength

        const nx = dx / distance
        const ny = dy / distance

        if (draggedNodeId !== id1) {
          pos1.x -= nx * pushDistance
          pos1.y -= ny * pushDistance
        }

        if (draggedNodeId !== id2) {
          pos2.x += nx * pushDistance
          pos2.y += ny * pushDistance
        }
      }
    }
  }

  return updated
}
