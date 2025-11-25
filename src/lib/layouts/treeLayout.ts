/**
 * Hierarchical tree layout algorithm
 * Organizes nodes in a tree structure with clear parent-child relationships
 */

import type { GraphNode, GraphEdge } from '@/types'

export interface TreeLayoutOptions {
  width: number
  height: number
  direction?: 'vertical' | 'horizontal' // vertical = top-down, horizontal = left-right
  levelSpacing?: number
  nodeSpacing?: number
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
 * Calculate hierarchical tree layout
 */
export function calculateTreeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: TreeLayoutOptions
): LayoutResult {
  const {
    width,
    height,
    direction = 'vertical',
    levelSpacing = 150,
    nodeSpacing = 120,
  } = options

  const positions = new Map<string, { x: number; y: number }>()

  if (nodes.length === 0) {
    return { positions }
  }

  // Build adjacency list
  const childrenMap = new Map<string, Set<string>>()
  const parentsMap = new Map<string, Set<string>>()

  edges.forEach((edge) => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, new Set())
    }
    childrenMap.get(edge.source)!.add(edge.target)

    if (!parentsMap.has(edge.target)) {
      parentsMap.set(edge.target, new Set())
    }
    parentsMap.get(edge.target)!.add(edge.source)
  })

  // Find root nodes (nodes with no parents)
  const rootNodes = nodes.filter((node) => {
    const parents = parentsMap.get(node.id)
    return !parents || parents.size === 0
  })

  // If no clear roots, use nodes with most children
  let roots: GraphNode[]
  if (rootNodes.length === 0) {
    roots = nodes
      .map((node) => ({
        node,
        childCount: childrenMap.get(node.id)?.size || 0,
      }))
      .sort((a, b) => b.childCount - a.childCount)
      .slice(0, Math.max(1, Math.floor(nodes.length / 10)))
      .map((item) => item.node)
  } else {
    roots = rootNodes
  }

  // Build tree structure from each root
  const visitedNodes = new Set<string>()
  const treeTrees: TreeNode[] = []

  function buildTree(nodeId: string, level: number): TreeNode {
    visitedNodes.add(nodeId)

    const children = childrenMap.get(nodeId) || new Set()
    const childNodes: TreeNode[] = []

    children.forEach((childId) => {
      if (!visitedNodes.has(childId)) {
        childNodes.push(buildTree(childId, level + 1))
      }
    })

    return {
      id: nodeId,
      children: childNodes,
      level,
      position: 0,
    }
  }

  roots.forEach((root) => {
    if (!visitedNodes.has(root.id)) {
      treeTrees.push(buildTree(root.id, 0))
    }
  })

  // Handle disconnected nodes
  nodes.forEach((node) => {
    if (!visitedNodes.has(node.id)) {
      treeTrees.push({
        id: node.id,
        children: [],
        level: 0,
        position: 0,
      })
    }
  })

  // Calculate positions using Reingold-Tilford algorithm (simplified)
  function calculatePositions(tree: TreeNode, offset: number): number {
    if (tree.children.length === 0) {
      tree.position = offset
      return 1 // Width of this subtree
    }

    let currentOffset = offset
    let totalWidth = 0

    tree.children.forEach((child) => {
      const childWidth = calculatePositions(child, currentOffset)
      currentOffset += childWidth
      totalWidth += childWidth
    })

    // Position parent in the center of its children
    const firstChild = tree.children[0]
    const lastChild = tree.children[tree.children.length - 1]
    tree.position = (firstChild.position + lastChild.position) / 2

    return totalWidth
  }

  // Layout each tree
  let treeOffset = 0
  treeTrees.forEach((tree) => {
    const treeWidth = calculatePositions(tree, treeOffset)
    treeOffset += treeWidth + 2 // Add spacing between trees
  })

  // Convert to canvas positions
  function assignCanvasPositions(tree: TreeNode) {
    const node = tree

    if (direction === 'vertical') {
      // Top-down layout
      positions.set(node.id, {
        x: 50 + node.position * nodeSpacing,
        y: 50 + node.level * levelSpacing,
      })
    } else {
      // Left-right layout
      positions.set(node.id, {
        x: 50 + node.level * levelSpacing,
        y: 50 + node.position * nodeSpacing,
      })
    }

    node.children.forEach((child) => assignCanvasPositions(child))
  }

  treeTrees.forEach((tree) => assignCanvasPositions(tree))

  // Center the layout
  const allPositions = Array.from(positions.values())
  if (allPositions.length > 0) {
    const minX = Math.min(...allPositions.map((p) => p.x))
    const maxX = Math.max(...allPositions.map((p) => p.x))
    const minY = Math.min(...allPositions.map((p) => p.y))
    const maxY = Math.max(...allPositions.map((p) => p.y))

    const offsetX = (width - (maxX - minX)) / 2 - minX
    const offsetY = (height - (maxY - minY)) / 2 - minY

    positions.forEach((pos) => {
      pos.x += offsetX
      pos.y += offsetY
    })
  }

  return { positions }
}
