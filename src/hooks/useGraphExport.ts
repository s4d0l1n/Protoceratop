import { useCallback } from 'react'
import { toast } from '@/components/ui/Toast'
import type { GraphNode, GraphEdge, MetaNode } from '@/types'

/**
 * Hook for exporting graph visualization as PNG or SVG
 */
export function useGraphExport() {
  /**
   * Export canvas as high-resolution PNG
   * @param canvas - The canvas element to export
   * @param filename - Output filename (without extension)
   * @param scale - Scale factor for higher resolution (default: 2 for 2x resolution)
   */
  const exportAsPNG = useCallback(async (
    canvas: HTMLCanvasElement | null,
    filename = 'raptorgraph-export',
    scale = 2
  ) => {
    if (!canvas) {
      toast.error('No graph to export')
      return
    }

    try {
      // Create a new canvas with higher resolution
      const exportCanvas = document.createElement('canvas')
      const ctx = exportCanvas.getContext('2d')

      if (!ctx) {
        toast.error('Failed to create export context')
        return
      }

      // Set higher resolution dimensions
      exportCanvas.width = canvas.width * scale
      exportCanvas.height = canvas.height * scale

      // Scale the context
      ctx.scale(scale, scale)

      // Draw the original canvas onto the export canvas
      ctx.drawImage(canvas, 0, 0)

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, 'image/png', 1.0)
      })

      if (!blob) {
        toast.error('Failed to generate image')
        return
      }

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported as ${filename}.png (${exportCanvas.width}x${exportCanvas.height}px)`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export graph')
    }
  }, [])

  /**
   * Export canvas with custom dimensions
   */
  const exportWithDimensions = useCallback(async (
    canvas: HTMLCanvasElement | null,
    filename: string,
    width: number,
    height: number
  ) => {
    if (!canvas) {
      toast.error('No graph to export')
      return
    }

    try {
      const exportCanvas = document.createElement('canvas')
      const ctx = exportCanvas.getContext('2d')

      if (!ctx) {
        toast.error('Failed to create export context')
        return
      }

      exportCanvas.width = width
      exportCanvas.height = height

      // Scale to fit the specified dimensions
      const scaleX = width / canvas.width
      const scaleY = height / canvas.height
      ctx.scale(scaleX, scaleY)

      ctx.drawImage(canvas, 0, 0)

      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, 'image/png', 1.0)
      })

      if (!blob) {
        toast.error('Failed to generate image')
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported as ${filename}.png (${width}x${height}px)`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export graph')
    }
  }, [])

  /**
   * Export graph as SVG showing all nodes on the canvas
   */
  const exportAsSVG = useCallback((
    nodes: GraphNode[],
    edges: GraphEdge[],
    metaNodes: MetaNode[],
    nodePositions: Map<string, { x: number; y: number }>,
    metaNodePositions: Map<string, { x: number; y: number }>,
    nodeStyles: Map<string, any>,
    edgeStyles: Map<string, any>,
    canvasWidth: number,
    canvasHeight: number,
    zoom: number,
    panOffset: { x: number; y: number },
    rotation: number,
    filename = 'raptorgraph-export'
  ) => {
    try {
      // Calculate bounds of all nodes to fit everything in the export
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

      nodePositions.forEach((pos) => {
        minX = Math.min(minX, pos.x - 100)
        maxX = Math.max(maxX, pos.x + 100)
        minY = Math.min(minY, pos.y - 100)
        maxY = Math.max(maxY, pos.y + 100)
      })

      metaNodePositions.forEach((pos) => {
        minX = Math.min(minX, pos.x - 200)
        maxX = Math.max(maxX, pos.x + 200)
        minY = Math.min(minY, pos.y - 200)
        maxY = Math.max(maxY, pos.y + 200)
      })

      const padding = 50
      const viewWidth = maxX - minX + padding * 2
      const viewHeight = maxY - minY + padding * 2

      // Create SVG with dimensions to fit all nodes
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', viewWidth.toString())
      svg.setAttribute('height', viewHeight.toString())
      svg.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${viewWidth} ${viewHeight}`)
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

      // Add dark background matching canvas
      const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bg.setAttribute('x', (minX - padding).toString())
      bg.setAttribute('y', (minY - padding).toString())
      bg.setAttribute('width', viewWidth.toString())
      bg.setAttribute('height', viewHeight.toString())
      bg.setAttribute('fill', '#0f172a')
      svg.appendChild(bg)

      // Draw edges first (so they appear behind nodes)
      edges.forEach((edge) => {
        const sourcePos = nodePositions.get(edge.source)
        const targetPos = nodePositions.get(edge.target)
        if (!sourcePos || !targetPos) return

        const style = edgeStyles.get(edge.id) || {}
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', sourcePos.x.toString())
        line.setAttribute('y1', sourcePos.y.toString())
        line.setAttribute('x2', targetPos.x.toString())
        line.setAttribute('y2', targetPos.y.toString())
        line.setAttribute('stroke', style.color || '#64748b')
        line.setAttribute('stroke-width', style.thickness?.toString() || '1.5')
        line.setAttribute('stroke-opacity', style.opacity?.toString() || '0.4')
        if (style.style === 'dashed') {
          line.setAttribute('stroke-dasharray', '5,5')
        }
        svg.appendChild(line)
      })

      // Draw meta-nodes
      metaNodes.forEach((metaNode) => {
        const pos = metaNodePositions.get(metaNode.id)
        if (!pos) return

        const childCount = metaNode.childNodeIds.length
        const cols = Math.ceil(Math.sqrt(childCount)) * 2
        const gridWidth = cols * 100
        const gridHeight = (gridWidth * 2) / 3

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
        rect.setAttribute('x', (pos.x - gridWidth / 2).toString())
        rect.setAttribute('y', (pos.y - gridHeight / 2).toString())
        rect.setAttribute('width', gridWidth.toString())
        rect.setAttribute('height', gridHeight.toString())
        rect.setAttribute('fill', 'rgba(59, 130, 246, 0.05)')
        rect.setAttribute('stroke', '#3b82f6')
        rect.setAttribute('stroke-width', '2')
        rect.setAttribute('stroke-dasharray', '8,4')
        rect.setAttribute('rx', '8')
        svg.appendChild(rect)

        // Add label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', pos.x.toString())
        text.setAttribute('y', (pos.y - gridHeight / 2 - 10).toString())
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('fill', '#94a3b8')
        text.setAttribute('font-size', '12')
        text.setAttribute('font-family', 'system-ui, -apple-system, sans-serif')
        text.textContent = metaNode.label
        svg.appendChild(text)
      })

      // Draw nodes with proper card styling
      nodes.forEach((node) => {
        const pos = nodePositions.get(node.id)
        if (!pos) return

        const style = nodeStyles.get(node.id) || {}

        // Get size from style or use defaults
        const sizeMultiplier = style.sizeMultiplier || 1
        const baseWidth = 120
        const baseHeight = 60
        const width = baseWidth * sizeMultiplier
        const height = baseHeight * sizeMultiplier

        // Get shape from style
        const shape = style.shape || 'rect'

        // Get colors from style
        const bgColor = style.backgroundColor || '#1e293b'
        const borderColor = style.borderColor || '#0891b2'
        const textColor = style.textColor || '#e2e8f0'
        const borderWidth = style.borderWidth || 2

        // Create node group
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')

        // Draw shape based on type
        if (shape === 'circle') {
          const radius = Math.min(width, height) / 2
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          circle.setAttribute('cx', pos.x.toString())
          circle.setAttribute('cy', pos.y.toString())
          circle.setAttribute('r', radius.toString())
          circle.setAttribute('fill', bgColor)
          circle.setAttribute('stroke', borderColor)
          circle.setAttribute('stroke-width', borderWidth.toString())
          g.appendChild(circle)
        } else if (shape === 'diamond') {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          const d = `M ${pos.x} ${pos.y - height/2} L ${pos.x + width/2} ${pos.y} L ${pos.x} ${pos.y + height/2} L ${pos.x - width/2} ${pos.y} Z`
          path.setAttribute('d', d)
          path.setAttribute('fill', bgColor)
          path.setAttribute('stroke', borderColor)
          path.setAttribute('stroke-width', borderWidth.toString())
          g.appendChild(path)
        } else if (shape === 'triangle') {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          const d = `M ${pos.x} ${pos.y - height/2} L ${pos.x + width/2} ${pos.y + height/2} L ${pos.x - width/2} ${pos.y + height/2} Z`
          path.setAttribute('d', d)
          path.setAttribute('fill', bgColor)
          path.setAttribute('stroke', borderColor)
          path.setAttribute('stroke-width', borderWidth.toString())
          g.appendChild(path)
        } else if (shape === 'star') {
          const outerRadius = Math.min(width, height) / 2
          const innerRadius = outerRadius * 0.4
          let pathD = ''
          for (let i = 0; i < 5; i++) {
            const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2
            const innerAngle = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2
            const outerX = pos.x + outerRadius * Math.cos(outerAngle)
            const outerY = pos.y + outerRadius * Math.sin(outerAngle)
            const innerX = pos.x + innerRadius * Math.cos(innerAngle)
            const innerY = pos.y + innerRadius * Math.sin(innerAngle)
            if (i === 0) {
              pathD += `M ${outerX} ${outerY} `
            } else {
              pathD += `L ${outerX} ${outerY} `
            }
            pathD += `L ${innerX} ${innerY} `
          }
          pathD += 'Z'
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          path.setAttribute('d', pathD)
          path.setAttribute('fill', bgColor)
          path.setAttribute('stroke', borderColor)
          path.setAttribute('stroke-width', borderWidth.toString())
          g.appendChild(path)
        } else if (shape === 'ellipse') {
          const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')
          ellipse.setAttribute('cx', pos.x.toString())
          ellipse.setAttribute('cy', pos.y.toString())
          ellipse.setAttribute('rx', (width / 2).toString())
          ellipse.setAttribute('ry', (height / 2).toString())
          ellipse.setAttribute('fill', bgColor)
          ellipse.setAttribute('stroke', borderColor)
          ellipse.setAttribute('stroke-width', borderWidth.toString())
          g.appendChild(ellipse)
        } else {
          // Default: rounded rectangle
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
          rect.setAttribute('x', (pos.x - width / 2).toString())
          rect.setAttribute('y', (pos.y - height / 2).toString())
          rect.setAttribute('width', width.toString())
          rect.setAttribute('height', height.toString())
          rect.setAttribute('fill', bgColor)
          rect.setAttribute('stroke', borderColor)
          rect.setAttribute('stroke-width', borderWidth.toString())
          rect.setAttribute('rx', '6')
          g.appendChild(rect)
        }

        // Add node label with better text handling
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        text.setAttribute('x', pos.x.toString())
        text.setAttribute('y', pos.y.toString())
        text.setAttribute('text-anchor', 'middle')
        text.setAttribute('dominant-baseline', 'middle')
        text.setAttribute('fill', textColor)
        text.setAttribute('font-size', (10 * sizeMultiplier).toString())
        text.setAttribute('font-weight', '600')
        text.setAttribute('font-family', 'system-ui, -apple-system, sans-serif')

        // Truncate text if too long
        const maxChars = Math.floor(width / 7)
        const displayText = node.label.length > maxChars ? node.label.slice(0, maxChars) + '...' : node.label
        text.textContent = displayText
        g.appendChild(text)

        svg.appendChild(g)
      })

      // Convert SVG to string
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svg)
      const blob = new Blob([svgString], { type: 'image/svg+xml' })

      // Download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported as ${filename}.svg (${Math.round(viewWidth)}x${Math.round(viewHeight)}px, ${nodes.length} nodes)`)
    } catch (error) {
      console.error('SVG export error:', error)
      toast.error('Failed to export as SVG')
    }
  }, [])

  /**
   * Export canvas region as PNG
   */
  const exportCanvasRegion = useCallback(async (
    sourceCanvas: HTMLCanvasElement,
    x: number,
    y: number,
    width: number,
    height: number,
    filename = 'raptorgraph-export',
    scale = 2
  ) => {
    try {
      // Create export canvas sized exactly to the region
      const exportCanvas = document.createElement('canvas')
      exportCanvas.width = width * scale
      exportCanvas.height = height * scale

      const ctx = exportCanvas.getContext('2d')
      if (!ctx) {
        toast.error('Failed to create export context')
        return
      }

      // Scale for high resolution and draw the source region
      ctx.scale(scale, scale)
      ctx.drawImage(
        sourceCanvas,
        x, y, width, height,  // source region
        0, 0, width, height   // destination (full canvas)
      )

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        exportCanvas.toBlob(resolve, 'image/png', 1.0)
      })

      if (!blob) {
        toast.error('Failed to generate image')
        return
      }

      // Download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported as ${filename}.png (${exportCanvas.width}x${exportCanvas.height}px)`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export graph')
    }
  }, [])

  /**
   * Export full graph as PNG by rendering all nodes and edges to a new canvas
   */
  const exportFullGraphAsPNG = useCallback(async (
    nodes: GraphNode[],
    edges: GraphEdge[],
    metaNodes: MetaNode[],
    nodePositions: Map<string, { x: number; y: number }>,
    metaNodePositions: Map<string, { x: number; y: number }>,
    nodeStyles: Map<string, any>,
    edgeStyles: Map<string, any>,
    filename = 'raptorgraph-export',
    scale = 2
  ) => {
    try {
      // Calculate bounds of all nodes
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity

      nodePositions.forEach((pos) => {
        minX = Math.min(minX, pos.x - 100)
        maxX = Math.max(maxX, pos.x + 100)
        minY = Math.min(minY, pos.y - 100)
        maxY = Math.max(maxY, pos.y + 100)
      })

      metaNodePositions.forEach((pos) => {
        minX = Math.min(minX, pos.x - 200)
        maxX = Math.max(maxX, pos.x + 200)
        minY = Math.min(minY, pos.y - 200)
        maxY = Math.max(maxY, pos.y + 200)
      })

      if (!isFinite(minX)) {
        toast.error('No nodes to export')
        return
      }

      const padding = 50
      const viewWidth = maxX - minX + padding * 2
      const viewHeight = maxY - minY + padding * 2

      // Create canvas with high resolution
      const canvas = document.createElement('canvas')
      canvas.width = viewWidth * scale
      canvas.height = viewHeight * scale

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        toast.error('Failed to create export context')
        return
      }

      // Scale for high resolution
      ctx.scale(scale, scale)

      // Translate to center the graph
      ctx.translate(-minX + padding, -minY + padding)

      // Draw dark background
      ctx.fillStyle = '#0f172a'
      ctx.fillRect(minX - padding, minY - padding, viewWidth, viewHeight)

      // Draw edges first
      edges.forEach((edge) => {
        const sourcePos = nodePositions.get(edge.source)
        const targetPos = nodePositions.get(edge.target)
        if (!sourcePos || !targetPos) return

        const style = edgeStyles.get(edge.id) || {}

        ctx.beginPath()
        ctx.moveTo(sourcePos.x, sourcePos.y)
        ctx.lineTo(targetPos.x, targetPos.y)
        ctx.strokeStyle = style.color || '#64748b'
        ctx.lineWidth = style.thickness || 1.5
        ctx.globalAlpha = style.opacity || 0.4

        if (style.style === 'dashed') {
          ctx.setLineDash([5, 5])
        } else {
          ctx.setLineDash([])
        }

        ctx.stroke()
        ctx.globalAlpha = 1
      })

      // Draw meta-nodes
      metaNodes.forEach((metaNode) => {
        const pos = metaNodePositions.get(metaNode.id)
        if (!pos) return

        const childCount = metaNode.childNodeIds.length
        const cols = Math.ceil(Math.sqrt(childCount)) * 2
        const gridWidth = cols * 100
        const gridHeight = (gridWidth * 2) / 3

        // Draw border rectangle
        ctx.strokeStyle = '#3b82f6'
        ctx.lineWidth = 2
        ctx.setLineDash([8, 4])
        ctx.fillStyle = 'rgba(59, 130, 246, 0.05)'
        ctx.beginPath()
        ctx.roundRect(
          pos.x - gridWidth / 2,
          pos.y - gridHeight / 2,
          gridWidth,
          gridHeight,
          8
        )
        ctx.fill()
        ctx.stroke()
        ctx.setLineDash([])

        // Draw label
        ctx.fillStyle = '#94a3b8'
        ctx.font = '12px system-ui, -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(metaNode.label, pos.x, pos.y - gridHeight / 2 - 10)
      })

      // Draw nodes
      nodes.forEach((node) => {
        const pos = nodePositions.get(node.id)
        if (!pos) return

        const style = nodeStyles.get(node.id) || {}

        // Get style properties
        const sizeMultiplier = style.sizeMultiplier || 1
        const baseWidth = 120
        const baseHeight = 60
        const width = baseWidth * sizeMultiplier
        const height = baseHeight * sizeMultiplier
        const shape = style.shape || 'rect'
        const bgColor = style.backgroundColor || '#1e293b'
        const borderColor = style.borderColor || '#0891b2'
        const textColor = style.textColor || '#e2e8f0'
        const borderWidth = style.borderWidth || 2

        ctx.save()

        // Draw shape based on type
        ctx.fillStyle = bgColor
        ctx.strokeStyle = borderColor
        ctx.lineWidth = borderWidth

        if (shape === 'circle') {
          const radius = Math.min(width, height) / 2
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        } else if (shape === 'diamond') {
          ctx.beginPath()
          ctx.moveTo(pos.x, pos.y - height / 2)
          ctx.lineTo(pos.x + width / 2, pos.y)
          ctx.lineTo(pos.x, pos.y + height / 2)
          ctx.lineTo(pos.x - width / 2, pos.y)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        } else if (shape === 'triangle') {
          ctx.beginPath()
          ctx.moveTo(pos.x, pos.y - height / 2)
          ctx.lineTo(pos.x + width / 2, pos.y + height / 2)
          ctx.lineTo(pos.x - width / 2, pos.y + height / 2)
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        } else if (shape === 'star') {
          const outerRadius = Math.min(width, height) / 2
          const innerRadius = outerRadius * 0.4
          ctx.beginPath()
          for (let i = 0; i < 5; i++) {
            const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2
            const innerAngle = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2
            const outerX = pos.x + outerRadius * Math.cos(outerAngle)
            const outerY = pos.y + outerRadius * Math.sin(outerAngle)
            const innerX = pos.x + innerRadius * Math.cos(innerAngle)
            const innerY = pos.y + innerRadius * Math.sin(innerAngle)
            if (i === 0) ctx.moveTo(outerX, outerY)
            else ctx.lineTo(outerX, outerY)
            ctx.lineTo(innerX, innerY)
          }
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        } else if (shape === 'ellipse') {
          ctx.beginPath()
          ctx.ellipse(pos.x, pos.y, width / 2, height / 2, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        } else {
          // Default: rounded rectangle
          ctx.beginPath()
          ctx.roundRect(pos.x - width / 2, pos.y - height / 2, width, height, 6)
          ctx.fill()
          ctx.stroke()
        }

        // Draw label
        ctx.fillStyle = textColor
        ctx.font = `600 ${10 * sizeMultiplier}px system-ui, -apple-system, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const maxChars = Math.floor(width / 7)
        const displayText = node.label.length > maxChars ? node.label.slice(0, maxChars) + '...' : node.label
        ctx.fillText(displayText, pos.x, pos.y)

        ctx.restore()
      })

      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/png', 1.0)
      })

      if (!blob) {
        toast.error('Failed to generate image')
        return
      }

      // Download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported as ${filename}.png (${canvas.width}x${canvas.height}px, ${nodes.length} nodes)`)
    } catch (error) {
      console.error('PNG export error:', error)
      toast.error('Failed to export as PNG')
    }
  }, [])

  return {
    exportAsPNG,
    exportWithDimensions,
    exportAsSVG,
    exportCanvasRegion,
    exportFullGraphAsPNG,
  }
}
