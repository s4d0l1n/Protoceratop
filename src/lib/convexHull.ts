/**
 * Convex Hull computation using Graham Scan algorithm
 * Used for drawing hulls around groups of nodes
 */

export interface Point {
  x: number
  y: number
}

/**
 * Cross product of vectors OA and OB where O is the origin
 */
function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

/**
 * Compute the convex hull of a set of points using Graham Scan algorithm
 * Returns points in counter-clockwise order
 */
export function computeConvexHull(points: Point[]): Point[] {
  if (points.length < 3) return [...points]

  // Sort points by x-coordinate, then by y-coordinate
  const sorted = [...points].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x
    return a.y - b.y
  })

  // Build lower hull
  const lower: Point[] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }

  // Build upper hull
  const upper: Point[] = []
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }

  // Remove last point of each half because it's repeated
  lower.pop()
  upper.pop()

  // Concatenate lower and upper hull
  return lower.concat(upper)
}

/**
 * Expand a convex hull outward by a given margin
 */
export function expandHull(hull: Point[], margin: number): Point[] {
  if (hull.length < 3) return hull

  const expanded: Point[] = []
  const n = hull.length

  for (let i = 0; i < n; i++) {
    const prev = hull[(i - 1 + n) % n]
    const curr = hull[i]
    const next = hull[(i + 1) % n]

    // Calculate edge normals
    const prevEdge = { x: curr.x - prev.x, y: curr.y - prev.y }
    const nextEdge = { x: next.x - curr.x, y: next.y - curr.y }

    // Normalize
    const prevLen = Math.sqrt(prevEdge.x ** 2 + prevEdge.y ** 2)
    const nextLen = Math.sqrt(nextEdge.x ** 2 + nextEdge.y ** 2)

    const prevNorm = {
      x: -prevEdge.y / prevLen,
      y: prevEdge.x / prevLen,
    }

    const nextNorm = {
      x: -nextEdge.y / nextLen,
      y: nextEdge.x / nextLen,
    }

    // Average normal
    const avgNorm = {
      x: (prevNorm.x + nextNorm.x) / 2,
      y: (prevNorm.y + nextNorm.y) / 2,
    }

    // Normalize average
    const avgLen = Math.sqrt(avgNorm.x ** 2 + avgNorm.y ** 2)
    if (avgLen > 0) {
      avgNorm.x /= avgLen
      avgNorm.y /= avgLen
    }

    // Expand point outward
    expanded.push({
      x: curr.x + avgNorm.x * margin,
      y: curr.y + avgNorm.y * margin,
    })
  }

  return expanded
}

/**
 * Calculate the centroid (center point) of a set of points
 */
export function calculateCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 }

  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  )

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  }
}
