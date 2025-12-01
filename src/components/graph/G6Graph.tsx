import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { Download } from 'lucide-react'
import { useGraphStore } from '@/stores/graphStore'
import { useUIStore } from '@/stores/uiStore'
import { useProjectStore } from '@/stores/projectStore'
import { useTemplateStore } from '@/stores/templateStore'
import { toast } from '@/components/ui/Toast'
import { ArrangementToolbar } from '@/components/ui/ArrangementToolbar'
import { Minimap } from '@/components/graph/Minimap'
import type { LayoutType } from '@/components/ui/LayoutSwitcher'
import { calculateTimelineLayout } from '@/lib/layouts/timelineLayout'
import { calculateCircleLayout } from '@/lib/layouts/circleLayout'
import { calculateGridLayout } from '@/lib/layouts/gridLayout'
import { calculateConcentricLayout } from '@/lib/layouts/concentricLayout'
import { calculateForceLayout } from '@/lib/layouts/forceLayout'
import { calculateRadialLayout } from '@/lib/layouts/radialLayout'
import { calculateHierarchicalLayout } from '@/lib/layouts/hierarchicalLayout'
import { calculateFruchtermanLayout } from '@/lib/layouts/fruchtermanLayout'
import { calculateKamadaKawaiLayout } from '@/lib/layouts/kamadaKawaiLayout'
import { calculateSpectralLayout } from '@/lib/layouts/spectralLayout'
import { calculateSugiyamaLayout } from '@/lib/layouts/sugiyamaLayout'
import { calculateClusterIslandLayout } from '@/lib/layouts/clusterIslandLayout'
import { getVisibleNodesWithGrouping, getVisibleMetaNodes, calculateMetaNodePosition, transformEdgesForGrouping } from '@/lib/grouping'
import { evaluateNodeRules, evaluateEdgeRules } from '@/lib/styleEvaluator'
import { useRulesStore } from '@/stores/rulesStore'

interface NodePosition {
  x: number
  y: number
  vx?: number  // velocity X for smooth animations
  vy?: number  // velocity Y for smooth animations
}

/**
 * Simplified Canvas Graph Visualization - Static rendering, no physics
 */
export function G6Graph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { nodes, edges, metaNodes } = useGraphStore()
  const { setSelectedNodeId, setSelectedMetaNodeId, selectedNodeId, selectedNodeIds, filteredNodeIds, zoom, panOffset, setZoom, setPanOffset, currentLayout, setCurrentLayout } = useUIStore()
  const { layoutConfig } = useProjectStore()
  const { getEdgeTemplateById, getDefaultEdgeTemplate, getCardTemplateById } = useTemplateStore()
  const { getEnabledRules } = useRulesStore()

  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map())
  const [metaNodePositions, setMetaNodePositions] = useState<Map<string, NodePosition>>(new Map())
  const [swimlanes, setSwimlanes] = useState<Map<string, number>>(new Map())

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [manuallyPositionedMetaNodes, setManuallyPositionedMetaNodes] = useState<Set<string>>(new Set())

  // Animation and physics state
  const animationRef = useRef<number | null>(null)
  const dragPhysicsRef = useRef<number | null>(null)
  const [targetPositions, setTargetPositions] = useState<Map<string, NodePosition>>(new Map())
  const [isAnimating, setIsAnimating] = useState(false)
  const [connectedNodeIds, setConnectedNodeIds] = useState<Set<string>>(new Set())

  // Arrangement tools state
  const [lockedNodeIds, setLockedNodeIds] = useState<Set<string>>(new Set())

  // Get visible nodes (filtering logic only - grouping just draws boxes, doesn't hide nodes)
  const visibleNodes = useMemo(() => {
    // Apply filteredNodeIds if present
    if (filteredNodeIds && filteredNodeIds.size > 0) {
      return nodes.filter(node => filteredNodeIds.has(node.id))
    }
    return nodes
  }, [nodes, filteredNodeIds])

  const visibleMetaNodes = useMemo(() => getVisibleMetaNodes(metaNodes), [metaNodes])

  // Transform edges for grouped display
  const transformedEdges = useMemo(() => transformEdgesForGrouping(edges, metaNodes), [edges, metaNodes])

  // Initialize node positions with layout calculation - STATIC, NO PHYSICS
  useEffect(() => {
    if (nodes.length === 0) return

    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    // CRITICAL: Canvas might not have dimensions yet, skip if so
    if (width === 0 || height === 0) {
      return
    }

    setNodePositions((prev) => {
      const newPositions = new Map<string, NodePosition>()

      // Check if we have existing positions
      const hasExistingPositions = prev.size > 0

      if (hasExistingPositions) {
        // Keep existing positions for nodes that haven't changed
        nodes.forEach((node) => {
          const existing = prev.get(node.id)
          if (existing) {
            newPositions.set(node.id, existing)
          }
        })

        // Only calculate layout for new nodes (place them at center)
        const newNodes = nodes.filter(node => !prev.has(node.id))
        if (newNodes.length > 0) {
          newNodes.forEach((node) => {
            newPositions.set(node.id, {
              x: width / 2 + (Math.random() - 0.5) * 200,
              y: height / 2 + (Math.random() - 0.5) * 200,
            })
          })
        }
      } else {
        // First time initialization - use grid layout as simple default
        const layoutResult = calculateGridLayout(nodes, {
          width,
          height,
        })

        layoutResult.positions.forEach((pos, nodeId) => {
          newPositions.set(nodeId, {
            x: pos.x,
            y: pos.y,
          })
        })
      }

      return newPositions
    })

    setSwimlanes(new Map())
  }, [nodes, edges])  // Re-run when nodes or edges change (will catch when canvas gets sized)

  // Calculate meta-node positions
  useEffect(() => {
    if (metaNodes.length === 0 || nodePositions.size === 0) {
      setMetaNodePositions(new Map())
      return
    }

    setMetaNodePositions((prevPositions) => {
      const positions = new Map<string, NodePosition>()

      visibleMetaNodes.forEach((metaNode) => {
        // Check if manually positioned
        if (manuallyPositionedMetaNodes.has(metaNode.id)) {
          const existingPos = prevPositions.get(metaNode.id)
          if (existingPos) {
            positions.set(metaNode.id, existingPos)
            return
          }
        }

        // Calculate position from child nodes
        const pos = calculateMetaNodePosition(metaNode, nodePositions)
        if (pos) {
          positions.set(metaNode.id, pos)
        }
      })

      return positions
    })
  }, [metaNodes, nodePositions, visibleMetaNodes, manuallyPositionedMetaNodes])

  // Clean up manually positioned meta-nodes
  useEffect(() => {
    if (metaNodes.length === 0) {
      setManuallyPositionedMetaNodes(new Set())
      return
    }

    setManuallyPositionedMetaNodes((prev) => {
      const metaNodeIds = new Set(metaNodes.map((mn) => mn.id))
      const cleaned = new Set<string>()
      let hasChanges = false

      prev.forEach((id) => {
        if (metaNodeIds.has(id)) {
          cleaned.add(id)
        } else {
          hasChanges = true
        }
      })

      return hasChanges ? cleaned : prev
    })
  }, [metaNodes])

  // Spring-based smooth animation loop for layout transitions
  useEffect(() => {
    if (!isAnimating || targetPositions.size === 0) return

    const animate = () => {
      setNodePositions((prev) => {
        const newPositions = new Map<string, NodePosition>()
        let hasMovement = false

        prev.forEach((currentPos, nodeId) => {
          const target = targetPositions.get(nodeId)
          if (!target) {
            newPositions.set(nodeId, currentPos)
            return
          }

          // Spring physics parameters
          const springStrength = 0.15
          const damping = 0.7
          const maxVelocity = 20
          const snapThreshold = 0.5

          // Calculate delta
          const dx = target.x - currentPos.x
          const dy = target.y - currentPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Snap to target if very close
          if (distance < snapThreshold) {
            newPositions.set(nodeId, { x: target.x, y: target.y, vx: 0, vy: 0 })
            return
          }

          // Calculate acceleration from spring force
          const ax = dx * springStrength
          const ay = dy * springStrength

          // Update velocity with damping
          let vx = ((currentPos.vx || 0) + ax) * damping
          let vy = ((currentPos.vy || 0) + ay) * damping

          // Clamp velocity
          const speed = Math.sqrt(vx * vx + vy * vy)
          if (speed > maxVelocity) {
            vx = (vx / speed) * maxVelocity
            vy = (vy / speed) * maxVelocity
          }

          // Update position
          const newX = currentPos.x + vx
          const newY = currentPos.y + vy

          newPositions.set(nodeId, { x: newX, y: newY, vx, vy })
          hasMovement = true
        })

        // Stop animation if no movement
        if (!hasMovement) {
          setIsAnimating(false)
          setTargetPositions(new Map())
        }

        return newPositions
      })

      if (isAnimating) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isAnimating, targetPositions])

  // Drag physics - connected nodes follow dragged node via springs with collision detection
  useEffect(() => {
    if (!draggedNodeId || connectedNodeIds.size === 0) {
      if (dragPhysicsRef.current) {
        cancelAnimationFrame(dragPhysicsRef.current)
        dragPhysicsRef.current = null
      }
      return
    }

    const animateDrag = () => {
      setNodePositions((prev) => {
        const newPositions = new Map(prev)
        const draggedPos = prev.get(draggedNodeId)
        if (!draggedPos) return prev

        // Spring physics for connected nodes
        const springStrength = 0.12
        const damping = 0.4
        const maxVelocity = 20
        const idealDistance = 150
        const minSeparation = 140 // Minimum distance between nodes (card size ~120px)

        // Apply spring forces to connected nodes
        connectedNodeIds.forEach((connectedId) => {
          const connectedPos = prev.get(connectedId)
          if (!connectedPos) return

          // Calculate vector from connected node to dragged node
          const dx = draggedPos.x - connectedPos.x
          const dy = draggedPos.y - connectedPos.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance === 0) return

          // Spring force pulls connected node toward ideal distance from dragged node
          const stretch = distance - idealDistance
          const forceMagnitude = stretch * springStrength

          const fx = (dx / distance) * forceMagnitude
          const fy = (dy / distance) * forceMagnitude

          // Update velocity with damping
          let vx = ((connectedPos.vx || 0) + fx) * damping
          let vy = ((connectedPos.vy || 0) + fy) * damping

          // Clamp velocity
          const speed = Math.sqrt(vx * vx + vy * vy)
          if (speed > maxVelocity) {
            vx = (vx / speed) * maxVelocity
            vy = (vy / speed) * maxVelocity
          }

          // Update position
          newPositions.set(connectedId, {
            x: connectedPos.x + vx,
            y: connectedPos.y + vy,
            vx,
            vy,
          })
        })

        // Collision detection and resolution (3 passes for better convergence)
        const movingNodeIds = new Set([draggedNodeId, ...Array.from(connectedNodeIds)])

        for (let pass = 0; pass < 3; pass++) {
          movingNodeIds.forEach((nodeAId) => {
            const posA = newPositions.get(nodeAId)
            if (!posA) return

            // Check against all other nodes
            newPositions.forEach((posB, nodeBId) => {
              if (nodeAId === nodeBId) return

              const dx = posB.x - posA.x
              const dy = posB.y - posA.y
              const distance = Math.sqrt(dx * dx + dy * dy)

              // If nodes overlap, push them apart
              if (distance < minSeparation && distance > 0) {
                const overlap = minSeparation - distance
                const pushX = (dx / distance) * overlap * 0.5
                const pushY = (dy / distance) * overlap * 0.5

                // Both nodes are moving - push both
                if (movingNodeIds.has(nodeBId)) {
                  newPositions.set(nodeAId, {
                    ...posA,
                    x: posA.x - pushX,
                    y: posA.y - pushY,
                  })
                  newPositions.set(nodeBId, {
                    ...posB,
                    x: posB.x + pushX,
                    y: posB.y + pushY,
                  })
                }
                // Only nodeA is moving - push it more
                else if (nodeAId !== draggedNodeId) { // Don't push the dragged node
                  newPositions.set(nodeAId, {
                    ...posA,
                    x: posA.x - pushX * 2,
                    y: posA.y - pushY * 2,
                  })
                }
              }
            })
          })
        }

        return newPositions
      })

      dragPhysicsRef.current = requestAnimationFrame(animateDrag)
    }

    dragPhysicsRef.current = requestAnimationFrame(animateDrag)

    return () => {
      if (dragPhysicsRef.current) {
        cancelAnimationFrame(dragPhysicsRef.current)
      }
    }
  }, [draggedNodeId, connectedNodeIds])

  // Render graph - simple static rendering
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0 || nodePositions.size === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save context and apply pan/zoom transformations
    ctx.save()
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoom, zoom)

    // Constants for node and group rendering
    const baseCardWidth = 120
    const baseCardHeight = 60
    const padding = 30
    const headerHeight = 35

    // Draw swimlanes if in timeline mode
    if (swimlanes.size > 0) {
      const sortedSwimlanes = Array.from(swimlanes.entries()).sort((a, b) => a[1] - b[1])

      sortedSwimlanes.forEach(([label, yPos], i) => {
        const swimlaneHeight = i < sortedSwimlanes.length - 1
          ? sortedSwimlanes[i + 1][1] - yPos
          : canvas.height - yPos

        ctx.fillStyle = i % 2 === 0 ? '#1e293b' : '#0f172a'
        ctx.fillRect(0, yPos - swimlaneHeight / 2, canvas.width, swimlaneHeight)

        ctx.fillStyle = '#64748b'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, 10, yPos)

        ctx.strokeStyle = '#334155'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(0, yPos - swimlaneHeight / 2)
        ctx.lineTo(canvas.width, yPos - swimlaneHeight / 2)
        ctx.stroke()
      })
    }

    // Calculate group bounding boxes for edge intersection
    const groupBounds = new Map<string, { minX: number; maxX: number; minY: number; maxY: number }>()
    const nodeToGroup = new Map<string, string>() // nodeId -> groupId

    visibleMetaNodes.forEach((metaNode) => {
      const containedNodes = nodes.filter((n) => metaNode.childNodeIds.includes(n.id))
      if (containedNodes.length === 0) return

      let minX = Infinity, maxX = -Infinity
      let minY = Infinity, maxY = -Infinity

      containedNodes.forEach((node) => {
        const pos = nodePositions.get(node.id)
        if (!pos) return

        const rules = getEnabledRules()
        const ruleResult = evaluateNodeRules(node, rules)
        const templateId = ruleResult.cardTemplateId || node.cardTemplateId
        const cardTemplate = templateId ? getCardTemplateById(templateId) : undefined
        const sizeMultiplier = cardTemplate?.size || 1
        const cardWidth = baseCardWidth * sizeMultiplier
        const cardHeight = baseCardHeight * sizeMultiplier

        minX = Math.min(minX, pos.x - cardWidth / 2)
        maxX = Math.max(maxX, pos.x + cardWidth / 2)
        minY = Math.min(minY, pos.y - cardHeight / 2)
        maxY = Math.max(maxY, pos.y + cardHeight / 2)

        // Map node to group
        nodeToGroup.set(node.id, metaNode.id)
      })

      if (isFinite(minX)) {
        groupBounds.set(metaNode.id, {
          minX: minX - padding,
          maxX: maxX + padding,
          minY: minY - padding - headerHeight,
          maxY: maxY + padding,
        })
      }
    })

    // Helper function to find intersection point of line with rectangle
    const getRectIntersection = (
      x1: number, y1: number, x2: number, y2: number,
      bounds: { minX: number; maxX: number; minY: number; maxY: number }
    ): { x: number; y: number } => {
      const { minX, maxX, minY, maxY } = bounds
      const dx = x2 - x1
      const dy = y2 - y1

      // Check intersection with each edge of rectangle
      const intersections: { x: number; y: number; dist: number }[] = []

      // Top edge
      if (dy !== 0) {
        const t = (minY - y1) / dy
        if (t >= 0 && t <= 1) {
          const x = x1 + t * dx
          if (x >= minX && x <= maxX) {
            intersections.push({ x, y: minY, dist: t })
          }
        }
      }

      // Bottom edge
      if (dy !== 0) {
        const t = (maxY - y1) / dy
        if (t >= 0 && t <= 1) {
          const x = x1 + t * dx
          if (x >= minX && x <= maxX) {
            intersections.push({ x, y: maxY, dist: t })
          }
        }
      }

      // Left edge
      if (dx !== 0) {
        const t = (minX - x1) / dx
        if (t >= 0 && t <= 1) {
          const y = y1 + t * dy
          if (y >= minY && y <= maxY) {
            intersections.push({ x: minX, y, dist: t })
          }
        }
      }

      // Right edge
      if (dx !== 0) {
        const t = (maxX - x1) / dx
        if (t >= 0 && t <= 1) {
          const y = y1 + t * dy
          if (y >= minY && y <= maxY) {
            intersections.push({ x: maxX, y, dist: t })
          }
        }
      }

      // Return closest intersection
      if (intersections.length > 0) {
        intersections.sort((a, b) => a.dist - b.dist)
        return { x: intersections[0].x, y: intersections[0].y }
      }

      // Fallback to original point
      return { x: x1, y: y1 }
    }

    // Draw edges
    const rules = getEnabledRules()
    transformedEdges.forEach((transformedEdge) => {
      if (!transformedEdge.shouldRender) return

      let sourcePos = nodePositions.get(transformedEdge.renderSource) || metaNodePositions.get(transformedEdge.renderSource)
      let targetPos = nodePositions.get(transformedEdge.renderTarget) || metaNodePositions.get(transformedEdge.renderTarget)

      if (!sourcePos || !targetPos) return

      // Check if source or target is in a group and adjust edge endpoints
      const sourceGroupId = nodeToGroup.get(transformedEdge.renderSource)
      const targetGroupId = nodeToGroup.get(transformedEdge.renderTarget)

      let startX = sourcePos.x
      let startY = sourcePos.y
      let endX = targetPos.x
      let endY = targetPos.y

      // If source is in a group and target is NOT in the same group, connect to group box edge
      if (sourceGroupId && sourceGroupId !== targetGroupId) {
        const bounds = groupBounds.get(sourceGroupId)
        if (bounds) {
          const intersection = getRectIntersection(sourcePos.x, sourcePos.y, targetPos.x, targetPos.y, bounds)
          startX = intersection.x
          startY = intersection.y
        }
      }

      // If target is in a group and source is NOT in the same group, connect to group box edge
      if (targetGroupId && targetGroupId !== sourceGroupId) {
        const bounds = groupBounds.get(targetGroupId)
        if (bounds) {
          const intersection = getRectIntersection(targetPos.x, targetPos.y, sourcePos.x, sourcePos.y, bounds)
          endX = intersection.x
          endY = intersection.y
        }
      }

      const ruleResult = evaluateEdgeRules(transformedEdge.edge, rules)
      const templateId = ruleResult.edgeTemplateId || transformedEdge.edge.edgeTemplateId
      const template = templateId ? getEdgeTemplateById(templateId) : getDefaultEdgeTemplate()

      // Fallback values if template is undefined
      ctx.strokeStyle = template?.color ?? '#475569'
      ctx.lineWidth = template?.width ?? 2
      ctx.setLineDash(template?.style === 'dashed' ? [5, 5] : [])

      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
      ctx.setLineDash([])
    })

    // Draw meta-nodes (as background boxes around grouped nodes)
    visibleMetaNodes.forEach((metaNode) => {
      // Get all child node positions to calculate bounding box
      const containedNodes = nodes.filter((n) => metaNode.childNodeIds.includes(n.id))
      if (containedNodes.length === 0) return

      // Calculate bounding box around actual node positions
      let minX = Infinity, maxX = -Infinity
      let minY = Infinity, maxY = -Infinity

      containedNodes.forEach((node) => {
        const pos = nodePositions.get(node.id)
        if (!pos) return

        // Get node size for accurate bounds
        const rules = getEnabledRules()
        const ruleResult = evaluateNodeRules(node, rules)
        const templateId = ruleResult.cardTemplateId || node.cardTemplateId
        const cardTemplate = templateId ? getCardTemplateById(templateId) : undefined
        const sizeMultiplier = cardTemplate?.size || 1
        const cardWidth = baseCardWidth * sizeMultiplier
        const cardHeight = baseCardHeight * sizeMultiplier

        const halfWidth = cardWidth / 2
        const halfHeight = cardHeight / 2

        minX = Math.min(minX, pos.x - halfWidth)
        maxX = Math.max(maxX, pos.x + halfWidth)
        minY = Math.min(minY, pos.y - halfHeight)
        maxY = Math.max(maxY, pos.y + halfHeight)
      })

      if (!isFinite(minX)) return

      // Add padding and header space
      const containerX = minX - padding
      const containerY = minY - padding - headerHeight
      const containerWidth = maxX - minX + padding * 2
      const containerHeight = maxY - minY + padding * 2 + headerHeight
      const radius = 12

      // Draw group box with semi-transparent background
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)'
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(containerX + radius, containerY)
      ctx.lineTo(containerX + containerWidth - radius, containerY)
      ctx.quadraticCurveTo(containerX + containerWidth, containerY, containerX + containerWidth, containerY + radius)
      ctx.lineTo(containerX + containerWidth, containerY + containerHeight - radius)
      ctx.quadraticCurveTo(containerX + containerWidth, containerY + containerHeight, containerX + containerWidth - radius, containerY + containerHeight)
      ctx.lineTo(containerX + radius, containerY + containerHeight)
      ctx.quadraticCurveTo(containerX, containerY + containerHeight, containerX, containerY + containerHeight - radius)
      ctx.lineTo(containerX, containerY + radius)
      ctx.quadraticCurveTo(containerX, containerY, containerX + radius, containerY)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.setLineDash([])

      // Draw header
      ctx.fillStyle = 'rgba(30, 64, 175, 0.6)'
      ctx.fillRect(containerX + 4, containerY + 4, containerWidth - 8, headerHeight - 4)

      ctx.fillStyle = '#fff'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(metaNode.groupValue, containerX + padding, containerY + headerHeight / 2)

      ctx.font = '11px sans-serif'
      ctx.fillStyle = '#93c5fd'
      ctx.textAlign = 'right'
      ctx.fillText(`${containedNodes.length} node${containedNodes.length !== 1 ? 's' : ''}`, containerX + containerWidth - padding, containerY + headerHeight / 2)
    })

    // Draw nodes ON TOP of meta-nodes (at their original positions - no repositioning!)
    visibleNodes.forEach((node) => {
      const pos = nodePositions.get(node.id)
      if (!pos) return

      const ruleResult = evaluateNodeRules(node, rules)
      const templateId = ruleResult.cardTemplateId || node.cardTemplateId
      const cardTemplate = templateId ? getCardTemplateById(templateId) : undefined

      const sizeMultiplier = cardTemplate?.size || 1
      const cardWidth = baseCardWidth * sizeMultiplier
      const cardHeight = baseCardHeight * sizeMultiplier

      const x = pos.x - cardWidth / 2
      const y = pos.y - cardHeight / 2

      const bgColor = cardTemplate?.backgroundColor || (node.isStub ? '#1e293b' : '#0f172a')
      const borderColor = cardTemplate?.borderColor || (node.isStub ? '#475569' : '#0891b2')
      const borderWidth = cardTemplate?.borderWidth || 2
      const shape = cardTemplate?.shape || 'rect'

      ctx.fillStyle = bgColor
      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth

      // Draw shape
      ctx.beginPath()
      switch (shape) {
        case 'circle':
          const circleRadius = Math.min(cardWidth, cardHeight) / 2
          ctx.arc(pos.x, pos.y, circleRadius, 0, Math.PI * 2)
          break
        case 'ellipse':
          ctx.ellipse(pos.x, pos.y, cardWidth / 2, cardHeight / 2, 0, 0, Math.PI * 2)
          break
        case 'diamond':
          ctx.moveTo(pos.x, y)
          ctx.lineTo(x + cardWidth, pos.y)
          ctx.lineTo(pos.x, y + cardHeight)
          ctx.lineTo(x, pos.y)
          ctx.closePath()
          break
        default: // rect
          const cornerRadius = cardTemplate?.cornerRadius || 8
          ctx.moveTo(x + cornerRadius, y)
          ctx.lineTo(x + cardWidth - cornerRadius, y)
          ctx.quadraticCurveTo(x + cardWidth, y, x + cardWidth, y + cornerRadius)
          ctx.lineTo(x + cardWidth, y + cardHeight - cornerRadius)
          ctx.quadraticCurveTo(x + cardWidth, y + cardHeight, x + cardWidth - cornerRadius, y + cardHeight)
          ctx.lineTo(x + cornerRadius, y + cardHeight)
          ctx.quadraticCurveTo(x, y + cardHeight, x, y + cardHeight - cornerRadius)
          ctx.lineTo(x, y + cornerRadius)
          ctx.quadraticCurveTo(x, y, x + cornerRadius, y)
          ctx.closePath()
      }
      ctx.fill()
      ctx.stroke()

      // Highlight if selected (single selection)
      if (selectedNodeId === node.id) {
        ctx.strokeStyle = '#fbbf24'
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Highlight if in multi-selection
      if (selectedNodeIds.has(node.id)) {
        ctx.strokeStyle = '#10b981'
        ctx.lineWidth = 3
        ctx.stroke()
      }

      // Show lock icon if locked
      if (lockedNodeIds.has(node.id)) {
        ctx.save()
        ctx.fillStyle = '#f59e0b'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'top'
        ctx.fillText('🔒', x + cardWidth - 20, y + 2)
        ctx.restore()
      }

      // Draw node label
      ctx.fillStyle = cardTemplate?.textColor || '#fff'
      ctx.font = `${cardTemplate?.fontSize || 12}px ${cardTemplate?.fontFamily || 'sans-serif'}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.label || node.id, pos.x, pos.y)
    })

    ctx.restore()
  }, [nodes, edges, nodePositions, selectedNodeId, selectedNodeIds, lockedNodeIds, filteredNodeIds, visibleNodes, swimlanes, metaNodes, visibleMetaNodes, metaNodePositions, panOffset, zoom, transformedEdges, draggedNodeId, manuallyPositionedMetaNodes])

  // Mouse handlers for dragging and selection
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoom
    const y = (e.clientY - rect.top - panOffset.y) / zoom

    // Check meta-nodes first - detect header area clicks for dragging/selection
    const baseCardWidth = 120
    const baseCardHeight = 60
    const padding = 30
    const headerHeight = 35

    for (const metaNode of visibleMetaNodes) {
      const containedNodes = nodes.filter((n) => metaNode.childNodeIds.includes(n.id))
      if (containedNodes.length === 0) continue

      // Calculate bounding box (same logic as rendering)
      let minX = Infinity, maxX = -Infinity
      let minY = Infinity, maxY = -Infinity

      containedNodes.forEach((node) => {
        const pos = nodePositions.get(node.id)
        if (!pos) return

        const rules = getEnabledRules()
        const ruleResult = evaluateNodeRules(node, rules)
        const templateId = ruleResult.cardTemplateId || node.cardTemplateId
        const cardTemplate = templateId ? getCardTemplateById(templateId) : undefined
        const sizeMultiplier = cardTemplate?.size || 1
        const cardWidth = baseCardWidth * sizeMultiplier
        const cardHeight = baseCardHeight * sizeMultiplier

        minX = Math.min(minX, pos.x - cardWidth / 2)
        maxX = Math.max(maxX, pos.x + cardWidth / 2)
        minY = Math.min(minY, pos.y - cardHeight / 2)
        maxY = Math.max(maxY, pos.y + cardHeight / 2)
      })

      if (!isFinite(minX)) continue

      const containerX = minX - padding
      const containerY = minY - padding - headerHeight
      const containerWidth = maxX - minX + padding * 2

      // Check if clicking in header area only (so nodes inside are still clickable)
      const inHeaderArea = x >= containerX && x <= containerX + containerWidth &&
                           y >= containerY && y <= containerY + headerHeight

      if (inHeaderArea) {
        // Calculate centroid for drag offset
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        setDraggedNodeId(metaNode.id)
        setDragOffset({ x: x - centerX, y: y - centerY })
        return
      }
    }

    // Check regular nodes
    for (const node of visibleNodes) {
      const pos = nodePositions.get(node.id)
      if (!pos) continue

      const rules = getEnabledRules()
      const ruleResult = evaluateNodeRules(node, rules)
      const templateId = ruleResult.cardTemplateId || node.cardTemplateId
      const cardTemplate = templateId ? getCardTemplateById(templateId) : undefined
      const sizeMultiplier = cardTemplate?.size || 1
      const baseCardWidth = 120
      const baseCardHeight = 60
      const cardWidth = baseCardWidth * sizeMultiplier
      const cardHeight = baseCardHeight * sizeMultiplier

      const dx = x - pos.x
      const dy = y - pos.y

      if (Math.abs(dx) < cardWidth / 2 && Math.abs(dy) < cardHeight / 2) {
        // Multi-selection with Ctrl/Cmd+click
        if (e.ctrlKey || e.metaKey) {
          const { toggleNodeSelection } = useUIStore.getState()
          toggleNodeSelection(node.id)
          return
        }

        setDraggedNodeId(node.id)
        setDragOffset({ x: dx, y: dy })

        // Find all directly connected nodes for drag physics
        const connected = new Set<string>()
        edges.forEach((edge) => {
          if (edge.source === node.id) {
            connected.add(edge.target)
          } else if (edge.target === node.id) {
            connected.add(edge.source)
          }
        })
        setConnectedNodeIds(connected)

        return
      }
    }

    // Start panning
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
  }, [visibleMetaNodes, visibleNodes, metaNodePositions, nodePositions, panOffset, zoom, nodes, edges, getEnabledRules, getCardTemplateById])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })
      setPanStart({ x: e.clientX, y: e.clientY })
      return
    }

    if (!draggedNodeId) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoom
    const y = (e.clientY - rect.top - panOffset.y) / zoom

    const isMetaNode = metaNodePositions.has(draggedNodeId)

    if (isMetaNode) {
      const newX = x - dragOffset.x
      const newY = y - dragOffset.y

      setMetaNodePositions((prev) => {
        const newPositions = new Map(prev)
        const currentPos = newPositions.get(draggedNodeId)
        if (currentPos) {
          newPositions.set(draggedNodeId, {
            ...currentPos,
            x: newX,
            y: newY,
          })
        }
        return newPositions
      })

      setManuallyPositionedMetaNodes((prev) => {
        const newSet = new Set(prev)
        newSet.add(draggedNodeId)
        return newSet
      })
    } else {
      const newX = x - dragOffset.x
      const newY = y - dragOffset.y

      setNodePositions((prev) => {
        const newPositions = new Map(prev)
        const currentPos = newPositions.get(draggedNodeId)
        if (currentPos) {
          newPositions.set(draggedNodeId, {
            ...currentPos,
            x: newX,
            y: newY,
          })
        }
        return newPositions
      })
    }
  }, [draggedNodeId, dragOffset, isPanning, panStart, panOffset, zoom, metaNodePositions])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setIsPanning(false)
      return
    }

    if (!draggedNodeId) return

    const canvas = canvasRef.current
    if (!canvas) {
      setDraggedNodeId(null)
      return
    }

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoom
    const y = (e.clientY - rect.top - panOffset.y) / zoom

    const pos = nodePositions.get(draggedNodeId) || metaNodePositions.get(draggedNodeId)
    if (pos) {
      const dragDistance = Math.sqrt((x - pos.x - dragOffset.x) ** 2 + (y - pos.y - dragOffset.y) ** 2)

      if (dragDistance < 3) {
        // Click - select node or meta-node
        const isMetaNode = metaNodePositions.has(draggedNodeId)
        if (isMetaNode) {
          setSelectedMetaNodeId(draggedNodeId)
          setSelectedNodeId(null)
        } else {
          setSelectedNodeId(draggedNodeId)
          setSelectedMetaNodeId(null)
        }
      }
    }

    setDraggedNodeId(null)
    setConnectedNodeIds(new Set()) // Clear connected nodes after drag
  }, [draggedNodeId, dragOffset, isPanning, panOffset, zoom, nodePositions, metaNodePositions, setSelectedNodeId, setSelectedMetaNodeId])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5)

    const graphX = (mouseX - panOffset.x) / zoom
    const graphY = (mouseY - panOffset.y) / zoom

    const newPanX = mouseX - graphX * newZoom
    const newPanY = mouseY - graphY * newZoom

    setPanOffset({ x: newPanX, y: newPanY })
    setZoom(newZoom)
  }, [zoom, panOffset])

  // Attach wheel event listener with passive: false
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('wheel', handleWheel)
    }
  }, [handleWheel])

  // Export handler
  const handleExport = useCallback(async () => {
    if (nodes.length === 0 || nodePositions.size === 0) return

    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity

    nodePositions.forEach((pos) => {
      minX = Math.min(minX, pos.x)
      maxX = Math.max(maxX, pos.x)
      minY = Math.min(minY, pos.y)
      maxY = Math.max(maxY, pos.y)
    })

    const padding = 200
    const nodeRadius = 60
    minX -= padding
    maxX += padding + nodeRadius * 2
    minY -= padding
    maxY += padding + nodeRadius * 2

    const graphWidth = maxX - minX
    const graphHeight = maxY - minY

    const exportCanvas = document.createElement('canvas')
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    const scale = 2
    exportCanvas.width = graphWidth * scale
    exportCanvas.height = graphHeight * scale

    ctx.scale(scale, scale)
    ctx.translate(-minX, -minY)

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(minX, minY, graphWidth, graphHeight)

    // Draw edges with proper styling
    const rules = getEnabledRules()
    transformedEdges.forEach((transformedEdge) => {
      if (!transformedEdge.shouldRender) return

      const sourcePos = nodePositions.get(transformedEdge.renderSource) || metaNodePositions.get(transformedEdge.renderSource)
      const targetPos = nodePositions.get(transformedEdge.renderTarget) || metaNodePositions.get(transformedEdge.renderTarget)

      if (!sourcePos || !targetPos) return

      const ruleResult = evaluateEdgeRules(transformedEdge.edge, rules)
      const templateId = ruleResult.edgeTemplateId || transformedEdge.edge.edgeTemplateId
      const template = templateId ? getEdgeTemplateById(templateId) : getDefaultEdgeTemplate()

      ctx.strokeStyle = template?.color ?? '#475569'
      ctx.lineWidth = template?.width ?? 2
      ctx.setLineDash(template?.style === 'dashed' ? [5, 5] : [])

      ctx.beginPath()
      ctx.moveTo(sourcePos.x, sourcePos.y)
      ctx.lineTo(targetPos.x, targetPos.y)
      ctx.stroke()
      ctx.setLineDash([])
    })

    // Draw nodes with proper styling
    const baseCardWidth = 120
    const baseCardHeight = 60

    visibleNodes.forEach((node) => {
      const pos = nodePositions.get(node.id)
      if (!pos) return

      const ruleResult = evaluateNodeRules(node, rules)
      const templateId = ruleResult.cardTemplateId || node.cardTemplateId
      const cardTemplate = templateId ? getCardTemplateById(templateId) : undefined

      const sizeMultiplier = cardTemplate?.size || 1
      const cardWidth = baseCardWidth * sizeMultiplier
      const cardHeight = baseCardHeight * sizeMultiplier

      const x = pos.x - cardWidth / 2
      const y = pos.y - cardHeight / 2

      const bgColor = cardTemplate?.backgroundColor || (node.isStub ? '#1e293b' : '#0f172a')
      const borderColor = cardTemplate?.borderColor || (node.isStub ? '#475569' : '#0891b2')
      const borderWidth = cardTemplate?.borderWidth || 2
      const shape = cardTemplate?.shape || 'rect'

      ctx.fillStyle = bgColor
      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth

      // Draw shape
      ctx.beginPath()
      switch (shape) {
        case 'circle':
          const circleRadius = Math.min(cardWidth, cardHeight) / 2
          ctx.arc(pos.x, pos.y, circleRadius, 0, Math.PI * 2)
          break
        case 'ellipse':
          ctx.ellipse(pos.x, pos.y, cardWidth / 2, cardHeight / 2, 0, 0, Math.PI * 2)
          break
        case 'diamond':
          ctx.moveTo(pos.x, y)
          ctx.lineTo(x + cardWidth, pos.y)
          ctx.lineTo(pos.x, y + cardHeight)
          ctx.lineTo(x, pos.y)
          ctx.closePath()
          break
        default: // rect
          const cornerRadius = cardTemplate?.cornerRadius || 8
          ctx.moveTo(x + cornerRadius, y)
          ctx.lineTo(x + cardWidth - cornerRadius, y)
          ctx.quadraticCurveTo(x + cardWidth, y, x + cardWidth, y + cornerRadius)
          ctx.lineTo(x + cardWidth, y + cardHeight - cornerRadius)
          ctx.quadraticCurveTo(x + cardWidth, y + cardHeight, x + cardWidth - cornerRadius, y + cardHeight)
          ctx.lineTo(x + cornerRadius, y + cardHeight)
          ctx.quadraticCurveTo(x, y + cardHeight, x, y + cardHeight - cornerRadius)
          ctx.lineTo(x, y + cornerRadius)
          ctx.quadraticCurveTo(x, y, x + cornerRadius, y)
          ctx.closePath()
      }
      ctx.fill()
      ctx.stroke()

      // Draw node label
      ctx.fillStyle = cardTemplate?.textColor || '#fff'
      ctx.font = `${cardTemplate?.fontSize || 12}px ${cardTemplate?.fontFamily || 'sans-serif'}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.label || node.id, pos.x, pos.y)
    })

    // Draw meta-nodes
    visibleMetaNodes.forEach((metaNode) => {
      if (metaNode.collapsed) {
        const pos = metaNodePositions.get(metaNode.id)
        if (!pos) return

        const containedNodes = nodes.filter((n) => metaNode.childNodeIds.includes(n.id))
        const nodeCount = containedNodes.length

        const cols = Math.min(4, Math.ceil(Math.sqrt(nodeCount)))
        const rows = Math.ceil(nodeCount / cols)

        let maxSizeMultiplier = 1
        containedNodes.forEach((node) => {
          const ruleResult = evaluateNodeRules(node, rules)
          const templateId = ruleResult.cardTemplateId || node.cardTemplateId
          const cardTemplate = templateId ? getCardTemplateById(templateId) : undefined
          const sizeMultiplier = cardTemplate?.size || 1
          maxSizeMultiplier = Math.max(maxSizeMultiplier, sizeMultiplier)
        })

        const cardWidth = baseCardWidth * maxSizeMultiplier
        const cardHeight = baseCardHeight * maxSizeMultiplier
        const spacing = 15
        const padding = 25
        const headerHeight = 35

        const containerWidth = Math.max(200, cols * (cardWidth + spacing) - spacing + padding * 2)
        const containerHeight = rows * (cardHeight + spacing) - spacing + padding * 2 + headerHeight

        const containerX = pos.x - containerWidth / 2
        const containerY = pos.y - containerHeight / 2
        const radius = 12

        // Draw container background
        ctx.fillStyle = '#0f172a'
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 4

        ctx.beginPath()
        ctx.moveTo(containerX + radius, containerY)
        ctx.lineTo(containerX + containerWidth - radius, containerY)
        ctx.quadraticCurveTo(containerX + containerWidth, containerY, containerX + containerWidth, containerY + radius)
        ctx.lineTo(containerX + containerWidth, containerY + containerHeight - radius)
        ctx.quadraticCurveTo(containerX + containerWidth, containerY + containerHeight, containerX + containerWidth - radius, containerY + containerHeight)
        ctx.lineTo(containerX + radius, containerY + containerHeight)
        ctx.quadraticCurveTo(containerX, containerY + containerHeight, containerX, containerY + containerHeight - radius)
        ctx.lineTo(containerX, containerY + radius)
        ctx.quadraticCurveTo(containerX, containerY, containerX + radius, containerY)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // Draw header
        ctx.fillStyle = '#1e40af'
        ctx.fillRect(containerX + 4, containerY + 4, containerWidth - 8, headerHeight - 4)

        ctx.fillStyle = '#fff'
        ctx.font = 'bold 13px sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(metaNode.groupValue, containerX + padding, containerY + headerHeight / 2)

        ctx.font = '11px sans-serif'
        ctx.fillStyle = '#93c5fd'
        ctx.textAlign = 'right'
        ctx.fillText(`${nodeCount} node${nodeCount !== 1 ? 's' : ''}`, containerX + containerWidth - padding, containerY + headerHeight / 2)
      }
    })

    const blob = await new Promise<Blob | null>((resolve) => {
      exportCanvas.toBlob(resolve, 'image/png', 1.0)
    })

    if (!blob) return

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'raptorgraph-export.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exported full graph (${exportCanvas.width}x${exportCanvas.height}px)`)
  }, [nodes, edges, nodePositions, metaNodePositions, transformedEdges, visibleNodes, visibleMetaNodes, metaNodes, getEnabledRules, evaluateNodeRules, evaluateEdgeRules, getCardTemplateById, getEdgeTemplateById, getDefaultEdgeTemplate])

  // Arrangement tools functions
  const handleAlign = useCallback((direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const { selectedNodeIds } = useUIStore.getState()
    if (selectedNodeIds.size < 2) return

    const selectedPositions = Array.from(selectedNodeIds)
      .map(id => ({ id, pos: nodePositions.get(id) }))
      .filter((item): item is { id: string; pos: NodePosition } => item.pos !== undefined)

    if (selectedPositions.length === 0) return

    setNodePositions((prev) => {
      const newPositions = new Map(prev)

      if (direction === 'left') {
        const minX = Math.min(...selectedPositions.map(item => item.pos.x))
        selectedPositions.forEach(({ id }) => {
          const pos = newPositions.get(id)
          if (pos) newPositions.set(id, { ...pos, x: minX })
        })
      } else if (direction === 'center') {
        const avgX = selectedPositions.reduce((sum, item) => sum + item.pos.x, 0) / selectedPositions.length
        selectedPositions.forEach(({ id }) => {
          const pos = newPositions.get(id)
          if (pos) newPositions.set(id, { ...pos, x: avgX })
        })
      } else if (direction === 'right') {
        const maxX = Math.max(...selectedPositions.map(item => item.pos.x))
        selectedPositions.forEach(({ id }) => {
          const pos = newPositions.get(id)
          if (pos) newPositions.set(id, { ...pos, x: maxX })
        })
      } else if (direction === 'top') {
        const minY = Math.min(...selectedPositions.map(item => item.pos.y))
        selectedPositions.forEach(({ id }) => {
          const pos = newPositions.get(id)
          if (pos) newPositions.set(id, { ...pos, y: minY })
        })
      } else if (direction === 'middle') {
        const avgY = selectedPositions.reduce((sum, item) => sum + item.pos.y, 0) / selectedPositions.length
        selectedPositions.forEach(({ id }) => {
          const pos = newPositions.get(id)
          if (pos) newPositions.set(id, { ...pos, y: avgY })
        })
      } else if (direction === 'bottom') {
        const maxY = Math.max(...selectedPositions.map(item => item.pos.y))
        selectedPositions.forEach(({ id }) => {
          const pos = newPositions.get(id)
          if (pos) newPositions.set(id, { ...pos, y: maxY })
        })
      }

      return newPositions
    })

    toast.success(`Aligned ${selectedPositions.length} nodes ${direction}`)
  }, [nodePositions])

  const handleDistribute = useCallback((axis: 'horizontal' | 'vertical') => {
    const { selectedNodeIds } = useUIStore.getState()
    if (selectedNodeIds.size < 3) {
      toast.error('Select at least 3 nodes to distribute')
      return
    }

    const selectedPositions = Array.from(selectedNodeIds)
      .map(id => ({ id, pos: nodePositions.get(id) }))
      .filter((item): item is { id: string; pos: NodePosition } => item.pos !== undefined)

    if (selectedPositions.length < 3) return

    // Sort by the axis we're distributing on
    if (axis === 'horizontal') {
      selectedPositions.sort((a, b) => a.pos.x - b.pos.x)
    } else {
      selectedPositions.sort((a, b) => a.pos.y - b.pos.y)
    }

    const first = selectedPositions[0].pos
    const last = selectedPositions[selectedPositions.length - 1].pos
    const range = axis === 'horizontal' ? last.x - first.x : last.y - first.y
    const gap = range / (selectedPositions.length - 1)

    setNodePositions((prev) => {
      const newPositions = new Map(prev)

      selectedPositions.forEach(({ id }, index) => {
        const pos = newPositions.get(id)
        if (!pos) return

        if (axis === 'horizontal') {
          newPositions.set(id, { ...pos, x: first.x + gap * index })
        } else {
          newPositions.set(id, { ...pos, y: first.y + gap * index })
        }
      })

      return newPositions
    })

    toast.success(`Distributed ${selectedPositions.length} nodes ${axis}ly`)
  }, [nodePositions])

  const handleToggleLock = useCallback(() => {
    const { selectedNodeIds } = useUIStore.getState()
    if (selectedNodeIds.size === 0) return

    setLockedNodeIds((prev) => {
      const newLocked = new Set(prev)
      const allLocked = Array.from(selectedNodeIds).every(id => newLocked.has(id))

      if (allLocked) {
        // Unlock all
        selectedNodeIds.forEach(id => newLocked.delete(id))
        toast.success(`Unlocked ${selectedNodeIds.size} nodes`)
      } else {
        // Lock all
        selectedNodeIds.forEach(id => newLocked.add(id))
        toast.success(`Locked ${selectedNodeIds.size} nodes`)
      }

      return newLocked
    })
  }, [])

  const isSelectionLocked = useMemo(() => {
    if (selectedNodeIds.size === 0) return false
    return Array.from(selectedNodeIds).every(id => lockedNodeIds.has(id))
  }, [selectedNodeIds, lockedNodeIds])

  // Layout switcher handlers
  const handleLayoutChange = useCallback((layout: LayoutType) => {
    const canvas = canvasRef.current
    if (!canvas || visibleNodes.length === 0) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    let layoutResult: { positions: Map<string, { x: number; y: number }>; swimlanes?: Map<string, number> }

    switch (layout) {
      case 'grid':
        layoutResult = calculateGridLayout(visibleNodes, { width, height })
        break
      case 'circle':
        layoutResult = calculateCircleLayout(visibleNodes, { width, height })
        break
      case 'concentric':
        layoutResult = calculateConcentricLayout(visibleNodes, edges, { width, height })
        break
      case 'force':
        layoutResult = calculateForceLayout(visibleNodes, edges, { width, height })
        break
      case 'radial':
        layoutResult = calculateRadialLayout(visibleNodes, edges, { width, height })
        break
      case 'hierarchical':
        layoutResult = calculateHierarchicalLayout(visibleNodes, edges, { width, height })
        break
      case 'tree':
        layoutResult = calculateSugiyamaLayout(visibleNodes, edges, { width, height })
        break
      case 'fruchterman':
        layoutResult = calculateFruchtermanLayout(visibleNodes, edges, { width, height })
        break
      case 'kamadaKawai':
        layoutResult = calculateKamadaKawaiLayout(visibleNodes, edges, { width, height })
        break
      case 'spectral':
        layoutResult = calculateSpectralLayout(visibleNodes, edges, { width, height })
        break
      case 'random':
        layoutResult = {
          positions: new Map(visibleNodes.map(node => [
            node.id,
            { x: Math.random() * width, y: Math.random() * height }
          ]))
        }
        break
      case 'timeline':
        layoutResult = calculateTimelineLayout(visibleNodes, { width, height })
        break
      case 'sugiyama':
        layoutResult = calculateSugiyamaLayout(visibleNodes, edges, { width, height })
        break
      case 'clusterIsland':
        layoutResult = calculateClusterIslandLayout(visibleNodes, edges, { width, height })
        break
      default:
        layoutResult = calculateGridLayout(visibleNodes, { width, height })
    }

    // Set target positions for smooth animation
    const targets = new Map<string, NodePosition>()
    layoutResult.positions.forEach((pos, nodeId) => {
      targets.set(nodeId, { x: pos.x, y: pos.y })
    })

    setTargetPositions(targets)
    setIsAnimating(true)
    setCurrentLayout(layout)
    if (layoutResult.swimlanes) {
      setSwimlanes(layoutResult.swimlanes)
    } else {
      setSwimlanes(new Map())
    }

    toast.success(`Applied ${layout} layout`)
  }, [visibleNodes, edges])

  const handleAutoLayout = useCallback(() => {
    // Smart layout selection based on graph properties
    const nodeCount = visibleNodes.length
    const edgeCount = edges.length
    const avgDegree = edgeCount > 0 ? (edgeCount * 2) / nodeCount : 0

    let selectedLayout: LayoutType

    if (nodeCount < 10) {
      selectedLayout = 'circle'
    } else if (avgDegree < 1.5) {
      // Sparse graph - use tree or hierarchical
      selectedLayout = 'hierarchical'
    } else if (avgDegree > 3) {
      // Dense graph - use force-directed
      selectedLayout = 'force'
    } else {
      // Medium density - use grid or fruchterman
      selectedLayout = nodeCount > 50 ? 'grid' : 'fruchterman'
    }

    handleLayoutChange(selectedLayout)
    toast.success(`Auto-selected ${selectedLayout} layout for ${nodeCount} nodes`)
  }, [visibleNodes, edges, handleLayoutChange])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />

      {/* Arrangement Toolbar */}
      <ArrangementToolbar
        onAlign={handleAlign}
        onDistribute={handleDistribute}
        onToggleLock={handleToggleLock}
        isLocked={isSelectionLocked}
      />

      {/* Export button */}
      {nodes.length > 0 && (
        <button
          onClick={handleExport}
          className="absolute top-6 right-6 group bg-dark-secondary hover:bg-dark-tertiary border border-dark rounded-lg text-slate-300 hover:text-slate-100 transition-all duration-200 shadow-lg flex items-center gap-2 overflow-hidden"
        >
          <div className="p-2 flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap overflow-hidden text-sm">
              Export PNG
            </span>
          </div>
        </button>
      )}

      {/* Zoom Controls */}
      {nodes.length > 0 && (
        <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-2 mb-40">
          <button
            onClick={() => {
              const canvas = canvasRef.current
              if (!canvas) return

              const zoomFactor = 1.1
              const newZoom = Math.min(5, zoom * zoomFactor)

              const centerX = canvas.offsetWidth / 2
              const centerY = canvas.offsetHeight / 2

              const graphX = (centerX - panOffset.x) / zoom
              const graphY = (centerY - panOffset.y) / zoom

              const newPanX = centerX - graphX * newZoom
              const newPanY = centerY - graphY * newZoom

              setPanOffset({ x: newPanX, y: newPanY })
              setZoom(newZoom)
            }}
            disabled={zoom >= 5}
            className="w-10 h-10 bg-dark-secondary border border-dark rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-100 hover:bg-dark-tertiary transition-colors shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>

          <button
            onClick={() => {
              setZoom(1)
              setPanOffset({ x: 0, y: 0 })
            }}
            className="w-10 h-10 bg-dark-secondary border border-dark rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-100 hover:bg-dark-tertiary transition-colors shadow-lg"
            title="Reset zoom"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          <button
            onClick={() => {
              const canvas = canvasRef.current
              if (!canvas) return

              const zoomFactor = 0.9
              const newZoom = Math.max(0.1, zoom * zoomFactor)

              const centerX = canvas.offsetWidth / 2
              const centerY = canvas.offsetHeight / 2

              const graphX = (centerX - panOffset.x) / zoom
              const graphY = (centerY - panOffset.y) / zoom

              const newPanX = centerX - graphX * newZoom
              const newPanY = centerY - graphY * newZoom

              setPanOffset({ x: newPanX, y: newPanY })
              setZoom(newZoom)
            }}
            disabled={zoom <= 0.1}
            className="w-10 h-10 bg-dark-secondary border border-dark rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-100 hover:bg-dark-tertiary transition-colors shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
            title="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>

          {/* Zoom percentage indicator */}
          <div className="w-10 h-10 bg-dark-secondary border border-dark rounded-lg flex items-center justify-center text-xs font-medium text-slate-300 shadow-lg">
            {(zoom * 100).toFixed(0)}%
          </div>
        </div>
      )}

      {/* Minimap */}
      {nodes.length > 0 && canvasRef.current && (
        <Minimap
          nodePositions={nodePositions}
          metaNodePositions={metaNodePositions}
          panOffset={panOffset}
          zoom={zoom}
          canvasWidth={canvasRef.current.offsetWidth}
          canvasHeight={canvasRef.current.offsetHeight}
          onPanChange={setPanOffset}
        />
      )}
    </div>
  )
}
