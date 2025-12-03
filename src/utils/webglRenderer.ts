/**
 * WebGL renderer utility for graph visualization
 * Uses WebGL for shapes (nodes, edges) and Canvas 2D for text
 */

export class WebGLRenderer {
  private gl: WebGLRenderingContext | null = null
  private shaderProgram: WebGLProgram | null = null
  private positionBuffer: WebGLBuffer | null = null
  private colorBuffer: WebGLBuffer | null = null

  constructor(private canvas: HTMLCanvasElement) {
    this.initWebGL()
  }

  private initWebGL() {
    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl')

    if (!this.gl) {
      console.warn('WebGL not supported, falling back to Canvas 2D')
      return
    }

    // Vertex shader
    const vertexShaderSource = `
      attribute vec2 aPosition;
      attribute vec4 aColor;
      varying vec4 vColor;
      uniform mat3 uTransform;

      void main() {
        vec3 transformed = uTransform * vec3(aPosition, 1.0);
        gl_Position = vec4(transformed.xy, 0.0, 1.0);
        vColor = aColor;
      }
    `

    // Fragment shader
    const fragmentShaderSource = `
      precision mediump float;
      varying vec4 vColor;

      void main() {
        gl_FragColor = vColor;
      }
    `

    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource)

    if (!vertexShader || !fragmentShader) return

    // Create program
    this.shaderProgram = this.gl.createProgram()
    if (!this.shaderProgram) return

    this.gl.attachShader(this.shaderProgram, vertexShader)
    this.gl.attachShader(this.shaderProgram, fragmentShader)
    this.gl.linkProgram(this.shaderProgram)

    if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(this.shaderProgram))
      return
    }

    this.gl.useProgram(this.shaderProgram)

    // Create buffers
    this.positionBuffer = this.gl.createBuffer()
    this.colorBuffer = this.gl.createBuffer()

    // Set clear color
    this.gl.clearColor(0.06, 0.09, 0.16, 1.0) // #0f172a
  }

  private createShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null

    const shader = this.gl.createShader(type)
    if (!shader) return null

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader))
      this.gl.deleteShader(shader)
      return null
    }

    return shader
  }

  public isSupported(): boolean {
    return this.gl !== null && this.shaderProgram !== null
  }

  public clear() {
    if (!this.gl) return
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)
  }

  public setTransform(zoom: number, panX: number, panY: number, rotation: number) {
    if (!this.gl || !this.shaderProgram) return

    const width = this.canvas.width
    const height = this.canvas.height

    // Create transformation matrix
    // Convert canvas coords to clip space (-1 to 1)
    const scaleX = (2 / width) * zoom
    const scaleY = (2 / height) * zoom
    const translateX = (panX / width) * 2
    const translateY = -(panY / height) * 2

    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    // Transformation matrix (column-major for WebGL)
    const matrix = new Float32Array([
      scaleX * cos, scaleX * sin, 0,
      -scaleY * sin, scaleY * cos, 0,
      translateX, translateY, 1
    ])

    const transformLoc = this.gl.getUniformLocation(this.shaderProgram, 'uTransform')
    this.gl.uniformMatrix3fv(transformLoc, false, matrix)
  }

  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: { r: number; g: number; b: number; a: number }
  ) {
    if (!this.gl || !this.shaderProgram) return

    // Convert to center-based coordinates
    const left = x - width / 2
    const right = x + width / 2
    const top = y - height / 2
    const bottom = y + height / 2

    // Vertices for rectangle (2 triangles)
    const vertices = new Float32Array([
      left, top,
      right, top,
      left, bottom,
      right, top,
      right, bottom,
      left, bottom,
    ])

    // Colors (same for all vertices)
    const colors = new Float32Array([
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
    ])

    // Set up position attribute
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)
    const positionLoc = this.gl.getAttribLocation(this.shaderProgram, 'aPosition')
    this.gl.enableVertexAttribArray(positionLoc)
    this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0)

    // Set up color attribute
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW)
    const colorLoc = this.gl.getAttribLocation(this.shaderProgram, 'aColor')
    this.gl.enableVertexAttribArray(colorLoc)
    this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, 0, 0)

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
  }

  public drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: { r: number; g: number; b: number; a: number },
    width: number = 2
  ) {
    if (!this.gl || !this.shaderProgram) return

    // For thick lines, draw as rectangles
    const dx = x2 - x1
    const dy = y2 - y1
    const length = Math.sqrt(dx * dx + dy * dy)
    const angle = Math.atan2(dy, dx)

    const halfWidth = width / 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    // Four corners of the line rectangle
    const vertices = new Float32Array([
      x1 - halfWidth * sin, y1 + halfWidth * cos,
      x2 - halfWidth * sin, y2 + halfWidth * cos,
      x1 + halfWidth * sin, y1 - halfWidth * cos,
      x2 - halfWidth * sin, y2 + halfWidth * cos,
      x2 + halfWidth * sin, y2 - halfWidth * cos,
      x1 + halfWidth * sin, y1 - halfWidth * cos,
    ])

    const colors = new Float32Array([
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
      color.r, color.g, color.b, color.a,
    ])

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)
    const positionLoc = this.gl.getAttribLocation(this.shaderProgram, 'aPosition')
    this.gl.enableVertexAttribArray(positionLoc)
    this.gl.vertexAttribPointer(positionLoc, 2, this.gl.FLOAT, false, 0, 0)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW)
    const colorLoc = this.gl.getAttribLocation(this.shaderProgram, 'aColor')
    this.gl.enableVertexAttribArray(colorLoc)
    this.gl.vertexAttribPointer(colorLoc, 4, this.gl.FLOAT, false, 0, 0)

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
  }

  public dispose() {
    if (!this.gl) return

    if (this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer)
    }
    if (this.colorBuffer) {
      this.gl.deleteBuffer(this.colorBuffer)
    }
    if (this.shaderProgram) {
      this.gl.deleteProgram(this.shaderProgram)
    }
  }
}

/**
 * Helper to convert hex color to RGBA
 */
export function hexToRGBA(hex: string, alpha: number = 1): { r: number; g: number; b: number; a: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 1, g: 1, b: 1, a: alpha }

  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: alpha
  }
}
