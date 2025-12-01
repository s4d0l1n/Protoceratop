/**
 * Hierarchical layout algorithm
 * Organizes nodes in a tree-like hierarchy with configurable direction
 */

import type { GraphNode, GraphEdge, HierarchicalDirection } from '@/types'

export interface HierarchicalLayoutOptions {
  /** Layout direction */
  direction?: HierarchicalDirection
  /** Spacing between levels */
  levelSeparation?: number
  /** Spacing between nodes on same level */
  nodeSeparation?: number
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
}

export interface LayoutResult {
  positions: Map<string, { x: number; y: number }>
}

interface TreeNode {
  id: string
  children: TreeNode[]
  level: number
  position: number
}

/**
 * Build tree structure from edges
 */
function buildTree(nodes: GraphNode[], edges: GraphEdge[]): TreeNode[] {
  const nodeMap = new Map<string, GraphNode>()
  nodes.forEach((n) => nodeMap.set(n.id, n))

  // Count incoming edges for each node
  const inDegree = new Map<string, number>()
  const outEdges = new Map<string, string[]>()

  nodes.forEach((n) => {
    inDegree.set(n.id, 0)
    outEdges.set(n.id, [])
  })

  edges.forEach((e) => {
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1)
    const targets = outEdges.get(e.source) || []
    targets.push(e.target)
    outEdges.set(e.source, targets)
  })

  // Find root nodes (nodes with no incoming edges)
  const roots: string[] = []
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      roots.push(nodeId)
    }
  })

  // If no roots found (cyclic graph), use nodes with minimum in-degree
  if (roots.length === 0) {
    let minDegree = Infinity
    inDegree.forEach((degree) => {
      if (degree < minDegree) minDegree = degree
    })
    inDegree.forEach((degree, nodeId) => {
      if (degree === minDegree) roots.push(nodeId)
    })
  }

  // Build tree from roots using BFS
  const visited = new Set<string>()
  const trees: TreeNode[] = []

  function buildSubtree(nodeId: string, level: number): TreeNode {
    visited.add(nodeId)
    const children: TreeNode[] = []
    const childIds = outEdges.get(nodeId) || []

    childIds.forEach((childId) => {
      if (!visited.has(childId)) {
        children.push(buildSubtree(childId, level + 1))
      }
    })

    return {
      id: nodeId,
      children,
      level,
      position: 0, // Will be calculated later
    }
  }

  roots.forEach((rootId) => {
    if (!visited.has(rootId)) {
      trees.push(buildSubtree(rootId, 0))
    }
  })

  // Add unvisited nodes as separate trees
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      trees.push({
        id: node.id,
        children: [],
        level: 0,
        position: 0,
      })
    }
  })

  return trees
}

/**
 * Calculate positions for tree nodes
 */
function calculateTreePositions(
  trees: TreeNode[],
  direction: HierarchicalDirection,
  _levelSeparation: number,
  _nodeSeparation: number,
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>()

  // Find max level
  let maxLevel = 0
  function findMaxLevel(node: TreeNode) {
    if (node.level > maxLevel) maxLevel = node.level
    node.children.forEach(findMaxLevel)
  }
  trees.forEach(findMaxLevel)

  // Assign positions within each level
  const levelNodes = new Map<number, TreeNode[]>()
  function collectByLevel(node: TreeNode) {
    if (!levelNodes.has(node.level)) {
      levelNodes.set(node.level, [])
    }
    levelNodes.get(node.level)!.push(node)
    node.children.forEach(collectByLevel)
  }
  trees.forEach(collectByLevel)

  // Calculate position for each node
  levelNodes.forEach((nodesAtLevel) => {
    nodesAtLevel.forEach((node, index) => {
      node.position = index
    })
  })

  // Convert to x, y coordinates based on direction
  const isHorizontal = direction === 'left-right' || direction === 'right-left'
  const isReversed = direction === 'bottom-top' || direction === 'right-left'

  levelNodes.forEach((nodesAtLevel, level) => {
    nodesAtLevel.forEach((node) => {
      let primaryPos: number
      let secondaryPos: number

      if (isReversed) {
        primaryPos = maxLevel - level
      } else {
        primaryPos = level
      }

      secondaryPos = node.position

      // Scale to canvas
      const levelCount = maxLevel + 1
      const nodeCount = nodesAtLevel.length

      if (isHorizontal) {
        // Horizontal layout (left-right or right-left)
        const x =
          (primaryPos / Math.max(levelCount - 1, 1)) * (width - 100) + 50
        const y =
          nodeCount > 1
            ? (secondaryPos / (nodeCount - 1)) * (height - 100) + 50
            : height / 2

        positions.set(node.id, { x, y })
      } else {
        // Vertical layout (top-bottom or bottom-top)
        const x =
          nodeCount > 1
            ? (secondaryPos / (nodeCount - 1)) * (width - 100) + 50
            : width / 2
        const y =
          (primaryPos / Math.max(levelCount - 1, 1)) * (height - 100) + 50

        positions.set(node.id, { x, y })
      }
    })
  })

  return positions
}

/**
 * Calculate hierarchical layout positions for nodes
 */
export function calculateHierarchicalLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: HierarchicalLayoutOptions
): LayoutResult {
  const {
    direction = 'top-bottom',
    levelSeparation = 100,
    nodeSeparation = 80,
    width,
    height,
  } = options

  if (nodes.length === 0) {
    return { positions: new Map() }
  }

  if (nodes.length === 1) {
    const positions = new Map<string, { x: number; y: number }>()
    positions.set(nodes[0].id, { x: width / 2, y: height / 2 })
    return { positions }
  }

  // Build tree structure
  const trees = buildTree(nodes, edges)

  // Calculate positions
  const positions = calculateTreePositions(
    trees,
    direction,
    levelSeparation,
    nodeSeparation,
    width,
    height
  )

  return { positions }
}
