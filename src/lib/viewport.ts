export class Viewport {
  public zoom: number;
  public pan: { x: number; y: number };
  public rotation: number;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.zoom = 1;
    this.pan = { x: 0, y: 0 };
    this.rotation = 0;
  }

  // --- Getters and Setters ---
  getTransform() {
    return { zoom: this.zoom, pan: this.pan, rotation: this.rotation };
  }

  setTransform(zoom: number, pan: { x: number, y: number }, rotation: number) {
    this.zoom = zoom;
    this.pan = pan;
    this.rotation = rotation;
  }

  // --- Coordinate Transformations ---

  /**
   * Transforms screen coordinates (e.g., from a mouse event) to world coordinates.
   */
  screenToWorld(screen: { x: number; y: number }): { x: number; y: number } {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Translate to canvas center
    let worldX = screen.x - this.pan.x - centerX;
    let worldY = screen.y - this.pan.y - centerY;

    // 2. Undo rotation
    if (this.rotation !== 0) {
      const rad = -this.rotation * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      [worldX, worldY] = [worldX * cos - worldY * sin, worldX * sin + worldY * cos];
    }

    // 3. Undo zoom
    worldX /= this.zoom;
    worldY /= this.zoom;

    // 4. Translate back from center
    worldX += centerX;
    worldY += centerY;

    return { x: worldX, y: worldY };
  }

  /**
   * Transforms world coordinates (e.g., node positions) to screen coordinates.
   */
  worldToScreen(world: { x: number; y: number }): { x: number; y: number } {
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Translate to center
    let screenX = world.x - centerX;
    let screenY = world.y - centerY;

    // 2. Apply zoom
    screenX *= this.zoom;
    screenY *= this.zoom;

    // 3. Apply rotation
    if (this.rotation !== 0) {
      const rad = this.rotation * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      [screenX, screenY] = [screenX * cos - screenY * sin, screenX * sin + screenY * cos];
    }

    // 4. Apply pan and translate back
    screenX += this.pan.x + centerX;
    screenY += this.pan.y + centerY;

    return { x: screenX, y: screenY };
  }

  /**
   * Applies the viewport transform to the canvas rendering context.
   */
  applyToContext(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.canvas;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.translate(this.pan.x + width / 2, this.pan.y + height / 2);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-width / 2, -height / 2);
  }

  /**
   * Gets the visible bounds of the viewport in world coordinates.
   * Returns a bounding box that encompasses all visible area.
   * Useful for viewport culling - only rendering objects within these bounds.
   */
  getVisibleBounds(): { left: number; right: number; top: number; bottom: number } {
    const { width, height } = this.canvas;

    // Transform all four corners of the canvas to world space
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const topRight = this.screenToWorld({ x: width, y: 0 });
    const bottomLeft = this.screenToWorld({ x: 0, y: height });
    const bottomRight = this.screenToWorld({ x: width, y: height });

    // Find the bounding box that contains all corners
    // (rotation can make corners not align with axes)
    const xs = [topLeft.x, topRight.x, bottomLeft.x, bottomRight.x];
    const ys = [topLeft.y, topRight.y, bottomLeft.y, bottomRight.y];

    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys)
    };
  }

  // --- Interaction Handlers ---

  /**
   * Handles zooming logic, ensuring the point under the cursor stays fixed.
   */
  handleZoom(mouseX: number, mouseY: number, deltaY: number) {
    const worldPos = this.screenToWorld({ x: mouseX, y: mouseY });

    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(this.zoom * zoomFactor, 5));

    const newScreenPos = this.worldToScreen({ ...worldPos });

    // This calculation is incorrect without taking the new zoom into account.
    // The pan must be adjusted based on the difference between the mouse position
    // and the position of the world point *after* the zoom is applied.

    // Let's re-calculate the screen pos of the world point with the *new* zoom
    const { width, height } = this.canvas;
    const centerX = width / 2;
    const centerY = height / 2;

    let postZoomScreenX = worldPos.x - centerX;
    let postZoomScreenY = worldPos.y - centerY;

    postZoomScreenX *= newZoom;
    postZoomScreenY *= newZoom;

    if (this.rotation !== 0) {
      const rad = this.rotation * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      [postZoomScreenX, postZoomScreenY] = [postZoomScreenX * cos - postZoomScreenY * sin, postZoomScreenX * sin + postZoomScreenY * cos];
    }
    
    postZoomScreenX += this.pan.x + centerX;
    postZoomScreenY += this.pan.y + centerY;


    this.pan.x += mouseX - postZoomScreenX;
    this.pan.y += mouseY - postZoomScreenY;
    this.zoom = newZoom;
  }
}
