/**
 * Types for G6Graph component
 */

export interface NodePosition {
  x: number
  y: number
  vx: number
  vy: number
}

export interface PhysicsParams {
  repulsionStrength: number
  attractionStrength: number
  leafSpringStrength: number
  damping: number
  centerGravity: number
  nodeChaosFactor: number
  intraClusterAttraction: number
  leafRadialForce: number
  interClusterRepulsion: number
  minClusterDistance: number
  repulsionRadius: number
  hubEdgeStrength: number
  hubRepulsionBoost: number
}

export interface HighlightEdgeSettings {
  width: number
  color: string
  colorFade: boolean
  sizeFade: boolean
  animation: boolean
}

export interface DirtyLayers {
  background: boolean
  edges: boolean
  nodes: boolean
  overlay: boolean
}

export interface ViewportTransform {
  zoom: number
  pan: { x: number; y: number }
  rotation: number
}
