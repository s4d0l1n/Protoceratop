/**
 * Spatial Hash Grid for efficient spatial queries
 * Reduces physics calculations from O(N²) to O(N log N)
 * by only checking nearby nodes for repulsion forces
 */

export interface Point {
  x: number
  y: number
}

export interface SpatialNode {
  id: string
  x: number
  y: number
  data?: any
}

/**
 * Spatial hash grid for O(1) spatial queries
 * Divides space into cells and only checks nearby cells
 */
export class SpatialHashGrid {
  private cellSize: number
  private grid: Map<string, SpatialNode[]>

  constructor(cellSize: number = 150) {
    this.cellSize = cellSize
    this.grid = new Map()
  }

  /**
   * Convert world coordinates to grid cell key
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize)
    const cellY = Math.floor(y / this.cellSize)
    return `${cellX},${cellY}`
  }

  /**
   * Clear the grid
   */
  clear(): void {
    this.grid.clear()
  }

  /**
   * Insert a node into the grid
   */
  insert(node: SpatialNode): void {
    const key = this.getCellKey(node.x, node.y)
    if (!this.grid.has(key)) {
      this.grid.set(key, [])
    }
    this.grid.get(key)!.push(node)
  }

  /**
   * Get all nodes within a certain radius of a point
   * This is MUCH faster than checking all nodes (O(1) vs O(N))
   */
  getNearby(x: number, y: number, radius: number): SpatialNode[] {
    const nearby: SpatialNode[] = []

    // Calculate which cells to check
    const cellRadius = Math.ceil(radius / this.cellSize)
    const centerCellX = Math.floor(x / this.cellSize)
    const centerCellY = Math.floor(y / this.cellSize)

    // Check all cells within the radius
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        const key = `${centerCellX + dx},${centerCellY + dy}`
        const nodesInCell = this.grid.get(key)

        if (nodesInCell) {
          // Filter by actual distance within the radius
          for (const node of nodesInCell) {
            const distSq = (node.x - x) ** 2 + (node.y - y) ** 2
            if (distSq <= radius * radius) {
              nearby.push(node)
            }
          }
        }
      }
    }

    return nearby
  }

  /**
   * Build the grid from a list of nodes
   * Call this once per frame before querying
   */
  build(nodes: SpatialNode[]): void {
    this.clear()
    for (const node of nodes) {
      this.insert(node)
    }
  }
}
