/**
 * Spectral layout algorithm
 * Eigenvalue-based mathematical layout using graph Laplacian
 */

import type { GraphNode, GraphEdge } from '@/types'

export interface SpectralLayoutOptions {
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
}

/**
 * Power iteration method to find dominant eigenvector
 */
function powerIteration(
  matrix: number[][],
  iterations: number = 100
): number[] {
  const n = matrix.length
  let vector = new Array(n).fill(1).map(() => Math.random())

  for (let iter = 0; iter < iterations; iter++) {
    // Multiply matrix by vector
    const newVector = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newVector[i] += matrix[i][j] * vector[j]
      }
    }

    // Normalize
    const magnitude = Math.sqrt(
      newVector.reduce((sum, val) => sum + val * val, 0)
    )
    if (magnitude > 0) {
      vector = newVector.map((val) => val / magnitude)
    }
  }

  return vector
}

/**
 * Find second smallest eigenvector using deflation
 */
function findSecondEigenvector(
  matrix: number[][],
  firstEigenvector: number[]
): number[] {
  const n = matrix.length

  // Create deflated matrix (remove component of first eigenvector)
  const deflated: number[][] = []
  for (let i = 0; i < n; i++) {
    deflated[i] = []
    for (let j = 0; j < n; j++) {
      deflated[i][j] =
        matrix[i][j] -
        (firstEigenvector[i] * firstEigenvector[j])
    }
  }

  return powerIteration(deflated, 100)
}

/**
 * Calculate Spectral layout positions for nodes
 */
export function calculateSpectralLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: SpectralLayoutOptions
): LayoutResult {
  const { width, height } = options
  const positions = new Map<string, { x: number; y: number }>()

  if (nodes.length === 0) return { positions }

  if (nodes.length === 1) {
    positions.set(nodes[0].id, { x: width / 2, y: height / 2 })
    return { positions }
  }

  // Build node index map
  const nodeIndexMap = new Map<string, number>()
  nodes.forEach((node, index) => {
    nodeIndexMap.set(node.id, index)
  })

  const n = nodes.length

  // Build adjacency matrix
  const adjacency: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))

  edges.forEach((edge) => {
    const sourceIdx = nodeIndexMap.get(edge.source)
    const targetIdx = nodeIndexMap.get(edge.target)
    if (sourceIdx !== undefined && targetIdx !== undefined) {
      adjacency[sourceIdx][targetIdx] = 1
      adjacency[targetIdx][sourceIdx] = 1
    }
  })

  // Calculate degree matrix
  const degree: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    let degreeSum = 0
    for (let j = 0; j < n; j++) {
      degreeSum += adjacency[i][j]
    }
    degree[i][i] = degreeSum
  }

  // Calculate Laplacian matrix (L = D - A)
  const laplacian: number[][] = Array(n)
    .fill(0)
    .map(() => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      laplacian[i][j] = degree[i][j] - adjacency[i][j]
    }
  }

  // Handle disconnected graphs by adding small random perturbation
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        laplacian[i][j] += Math.random() * 0.001
      }
    }
  }

  // Find first and second eigenvectors
  const firstEigenvector = powerIteration(laplacian, 100)
  const secondEigenvector = findSecondEigenvector(laplacian, firstEigenvector)

  // Normalize eigenvectors to canvas space
  const firstMin = Math.min(...firstEigenvector)
  const firstMax = Math.max(...firstEigenvector)
  const secondMin = Math.min(...secondEigenvector)
  const secondMax = Math.max(...secondEigenvector)

  const firstRange = firstMax - firstMin || 1
  const secondRange = secondMax - secondMin || 1

  // Map eigenvector values to positions
  nodes.forEach((node, index) => {
    const xNorm = (firstEigenvector[index] - firstMin) / firstRange
    const yNorm = (secondEigenvector[index] - secondMin) / secondRange

    const x = xNorm * (width - 100) + 50
    const y = yNorm * (height - 100) + 50

    positions.set(node.id, { x, y })
  })

  return { positions }
}
