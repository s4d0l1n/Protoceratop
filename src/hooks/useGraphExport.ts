import { useCallback } from 'react'
import { toast } from '@/components/ui/Toast'

/**
 * Hook for exporting graph visualization as PNG
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

  return {
    exportAsPNG,
    exportWithDimensions,
  }
}
