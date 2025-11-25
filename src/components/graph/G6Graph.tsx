import { useEffect, useRef } from 'react'
import { useGraphStore } from '@/stores/graphStore'

/**
 * Basic Canvas Graph Visualization
 * Temporary simple implementation until G6 v5 API is properly configured
 */
export function G6Graph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { nodes, edges } = useGraphStore()

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Simple force-directed layout simulation
    const nodePositions = new Map<string, { x: number; y: number }>()

    // Initialize positions randomly
    nodes.forEach((node) => {
      nodePositions.set(node.id, {
        x: Math.random() * (canvas.width - 100) + 50,
        y: Math.random() * (canvas.height - 100) + 50,
      })
    })

    // Draw edges
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 2
    edges.forEach((edge) => {
      const sourcePos = nodePositions.get(edge.source)
      const targetPos = nodePositions.get(edge.target)

      if (sourcePos && targetPos) {
        ctx.beginPath()
        ctx.moveTo(sourcePos.x, sourcePos.y)
        ctx.lineTo(targetPos.x, targetPos.y)
        ctx.stroke()

        // Draw arrow
        const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x)
        const arrowSize = 10
        ctx.fillStyle = '#64748b'
        ctx.beginPath()
        ctx.moveTo(targetPos.x, targetPos.y)
        ctx.lineTo(
          targetPos.x - arrowSize * Math.cos(angle - Math.PI / 6),
          targetPos.y - arrowSize * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          targetPos.x - arrowSize * Math.cos(angle + Math.PI / 6),
          targetPos.y - arrowSize * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fill()
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      const pos = nodePositions.get(node.id)
      if (!pos) return

      // Node circle
      ctx.fillStyle = node.isStub ? '#64748b' : '#06b6d4'
      ctx.strokeStyle = node.isStub ? '#475569' : '#0891b2'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Label
      ctx.fillStyle = '#e2e8f0'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      const label = node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label
      ctx.fillText(label, pos.x, pos.y + 25)
    })
  }, [nodes, edges])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Node count indicator */}
      {nodes.length > 0 && (
        <div className="absolute top-4 left-4 px-3 py-2 bg-dark-secondary/90 border border-dark rounded-lg text-sm text-slate-300">
          {nodes.length} nodes • {edges.length} edges
        </div>
      )}

      {/* Placeholder message */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-sm text-yellow-400">
        Basic visualization - G6 integration pending
      </div>
    </div>
  )
}
