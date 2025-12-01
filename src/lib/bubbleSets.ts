/**
 * Bubble Sets implementation for smooth, organic group wrapping
 * Based on the Bubble Sets algorithm for set visualization
 */

export interface Point {
  x: number
  y: number
}

/**
 * Create a smooth bubble set outline around a group of points
 * Uses a combination of Marching Squares and smoothing
 */
export function createBubbleSet(
  points: Point[],
  radius: number = 60,
  smoothness: number = 0.5
): Point[] {
  if (points.length === 0) return []
  if (points.length === 1) {
    // Single point - create a circle
    return createCircle(points[0], radius, 32)
  }
  if (points.length === 2) {
    // Two points - create a pill shape
    return createPillShape(points[0], points[1], radius, 32)
  }

  // Multi-point bubble set using influence fields
  const outline = createInfluenceOutline(points, radius, smoothness)
  return outline
}

/**
 * Create a circle of points around a center
 */
function createCircle(center: Point, radius: number, segments: number): Point[] {
  const circle: Point[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2
    circle.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    })
  }
  return circle
}

/**
 * Create a pill shape (rounded rectangle) connecting two points
 */
function createPillShape(
  p1: Point,
  p2: Point,
  radius: number,
  segments: number
): Point[] {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist < 0.01) return createCircle(p1, radius, segments)

  // Perpendicular direction
  const perpX = -dy / dist
  const perpY = dx / dist

  const pill: Point[] = []
  const halfSegments = Math.floor(segments / 2)

  // First semicircle around p1
  for (let i = 0; i <= halfSegments; i++) {
    const angle = (i / halfSegments) * Math.PI
    const offsetX = Math.cos(angle) * perpX - Math.sin(angle) * (dx / dist)
    const offsetY = Math.cos(angle) * perpY - Math.sin(angle) * (dy / dist)
    pill.push({
      x: p1.x + offsetX * radius,
      y: p1.y + offsetY * radius,
    })
  }

  // Second semicircle around p2
  for (let i = 0; i <= halfSegments; i++) {
    const angle = Math.PI + (i / halfSegments) * Math.PI
    const offsetX = Math.cos(angle) * perpX - Math.sin(angle) * (dx / dist)
    const offsetY = Math.cos(angle) * perpY - Math.sin(angle) * (dy / dist)
    pill.push({
      x: p2.x + offsetX * radius,
      y: p2.y + offsetY * radius,
    })
  }

  return pill
}

/**
 * Create an outline using influence fields (metaball-like approach)
 */
function createInfluenceOutline(
  points: Point[],
  radius: number,
  smoothness: number
): Point[] {
  // Calculate bounding box
  const minX = Math.min(...points.map(p => p.x)) - radius * 2
  const maxX = Math.max(...points.map(p => p.x)) + radius * 2
  const minY = Math.min(...points.map(p => p.y)) - radius * 2
  const maxY = Math.max(...points.map(p => p.y)) + radius * 2

  const gridSize = 20 // Resolution of marching squares grid
  const threshold = 0.5 // Threshold for outline detection

  // Create influence field grid
  const width = maxX - minX
  const height = maxY - minY
  const cols = Math.ceil(width / gridSize) + 1
  const rows = Math.ceil(height / gridSize) + 1

  const field: number[][] = []
  for (let y = 0; y < rows; y++) {
    field[y] = []
    for (let x = 0; x < cols; x++) {
      const worldX = minX + x * gridSize
      const worldY = minY + y * gridSize

      // Calculate influence from all points
      let influence = 0
      for (const point of points) {
        const dx = worldX - point.x
        const dy = worldY - point.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        // Gaussian-like influence falloff
        if (dist < radius * 2) {
          influence += Math.exp(-(dist * dist) / (radius * radius * smoothness))
        }
      }

      field[y][x] = influence
    }
  }

  // March squares to extract outline
  const contours = marchingSquares(field, cols, rows, threshold, minX, minY, gridSize)

  if (contours.length === 0) {
    // Fallback to convex hull if marching squares fails
    return createConvexHullOutline(points, radius)
  }

  // Smooth the contour
  return smoothContour(contours, 3)
}

/**
 * Simplified Marching Squares algorithm to extract contour
 */
function marchingSquares(
  field: number[][],
  cols: number,
  rows: number,
  threshold: number,
  offsetX: number,
  offsetY: number,
  gridSize: number
): Point[] {
  const contour: Point[] = []
  const visited = new Set<string>()

  // Find a starting cell on the boundary
  let startX = -1
  let startY = -1

  for (let y = 0; y < rows - 1 && startY === -1; y++) {
    for (let x = 0; x < cols - 1; x++) {
      const tl = field[y][x] >= threshold
      const tr = field[y][x + 1] >= threshold
      const bl = field[y + 1][x] >= threshold
      const br = field[y + 1][x + 1] >= threshold

      // Check if this cell is on the boundary
      if (tl || tr || bl || br) {
        if (!tl || !tr || !bl || !br) {
          startX = x
          startY = y
          break
        }
      }
    }
  }

  if (startX === -1) return []

  // Trace the contour
  let x = startX
  let y = startY
  let prevDirection = 0

  do {
    const key = `${x},${y}`
    if (visited.has(key)) break
    visited.add(key)

    const tl = y < rows && x < cols ? field[y][x] >= threshold : false
    const tr = y < rows && x + 1 < cols ? field[y][x + 1] >= threshold : false
    const bl = y + 1 < rows && x < cols ? field[y + 1][x] >= threshold : false
    const br = y + 1 < rows && x + 1 < cols ? field[y + 1][x + 1] >= threshold : false

    // Calculate case (0-15)
    const caseValue = (tl ? 8 : 0) + (tr ? 4 : 0) + (br ? 2 : 0) + (bl ? 1 : 0)

    // Add interpolated point based on case
    if (caseValue !== 0 && caseValue !== 15) {
      contour.push({
        x: offsetX + (x + 0.5) * gridSize,
        y: offsetY + (y + 0.5) * gridSize,
      })
    }

    // Move to next cell (simplified - always move right/down for demo)
    if (visited.size > cols * rows) break // Safety check

    x = (x + 1) % (cols - 1)
    if (x === 0) y = (y + 1) % (rows - 1)

  } while (x !== startX || y !== startY)

  return contour
}

/**
 * Smooth a contour using Chaikin's corner cutting algorithm
 */
function smoothContour(points: Point[], iterations: number): Point[] {
  let smoothed = [...points]

  for (let iter = 0; iter < iterations; iter++) {
    const newPoints: Point[] = []
    const n = smoothed.length

    for (let i = 0; i < n; i++) {
      const p1 = smoothed[i]
      const p2 = smoothed[(i + 1) % n]

      // Create two points: 1/4 and 3/4 along the edge
      newPoints.push({
        x: p1.x * 0.75 + p2.x * 0.25,
        y: p1.y * 0.75 + p2.y * 0.25,
      })
      newPoints.push({
        x: p1.x * 0.25 + p2.x * 0.75,
        y: p1.y * 0.25 + p2.y * 0.75,
      })
    }

    smoothed = newPoints
  }

  return smoothed
}

/**
 * Fallback: Create a simple convex hull outline with padding
 */
function createConvexHullOutline(points: Point[], padding: number): Point[] {
  // Simple convex hull using gift wrapping
  if (points.length < 3) return points

  const hull: Point[] = []

  // Start with leftmost point
  let current = points.reduce((min, p) => p.x < min.x ? p : min, points[0])
  hull.push(current)

  do {
    let next = points[0]
    for (const p of points) {
      if (p === current) continue

      const cross =
        (next.x - current.x) * (p.y - current.y) -
        (next.y - current.y) * (p.x - current.x)

      if (next === current || cross < 0) {
        next = p
      }
    }

    current = next
    if (hull[0] !== current) {
      hull.push(current)
    }
  } while (current !== hull[0] && hull.length < points.length)

  // Expand hull outward
  return expandHullOutward(hull, padding)
}

/**
 * Expand hull outward by a given padding
 */
function expandHullOutward(hull: Point[], padding: number): Point[] {
  if (hull.length < 3) return hull

  const expanded: Point[] = []
  const n = hull.length

  for (let i = 0; i < n; i++) {
    const prev = hull[(i - 1 + n) % n]
    const curr = hull[i]
    const next = hull[(i + 1) % n]

    // Calculate edge normals
    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y }
    const v2 = { x: next.x - curr.x, y: next.y - curr.y }

    // Perpendicular normals (pointing outward)
    const n1 = { x: -v1.y, y: v1.x }
    const n2 = { x: -v2.y, y: v2.x }

    // Normalize
    const len1 = Math.sqrt(n1.x * n1.x + n1.y * n1.y) || 1
    const len2 = Math.sqrt(n2.x * n2.x + n2.y * n2.y) || 1

    n1.x /= len1
    n1.y /= len1
    n2.x /= len2
    n2.y /= len2

    // Average normal
    const avgNormal = {
      x: (n1.x + n2.x) / 2,
      y: (n1.y + n2.y) / 2,
    }

    const avgLen = Math.sqrt(avgNormal.x * avgNormal.x + avgNormal.y * avgNormal.y) || 1
    avgNormal.x /= avgLen
    avgNormal.y /= avgLen

    // Expand point
    expanded.push({
      x: curr.x + avgNormal.x * padding,
      y: curr.y + avgNormal.y * padding,
    })
  }

  return expanded
}
