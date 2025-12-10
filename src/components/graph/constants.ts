/**
 * Constants for G6Graph component
 */

import { PhysicsParams } from './types'

export const DEFAULT_PHYSICS_PARAMS: PhysicsParams = {
  repulsionStrength: 25000,         // How strongly nodes push apart
  attractionStrength: 0.1,          // How strongly edges pull together
  leafSpringStrength: 0.8,          // How tightly leaves stick to parents
  damping: 0.85,                    // Energy loss per frame (0-1)
  centerGravity: 0.0001,            // Very weak pull toward canvas center (almost none)
  nodeChaosFactor: 0,               // Random variation per node (0-100)
  intraClusterAttraction: 0.05,     // Cluster island layout parameter
  leafRadialForce: 0.3,             // Cluster island layout parameter
  interClusterRepulsion: 150000,    // Cluster island layout parameter
  minClusterDistance: 600,          // Cluster island layout parameter
  repulsionRadius: 2000,            // How far repulsion works (spatial hash radius)
  hubEdgeStrength: 0.001,           // How strongly hub-to-hub edges pull (0=payout, 1=normal)
  hubRepulsionBoost: 0.5,           // Extra repulsion for high-degree nodes (0=none, 1=strong)
}

export const DEFAULT_HIGHLIGHT_EDGE_SETTINGS = {
  width: 8,
  color: '#22d3ee',
  colorFade: true,
  sizeFade: false,
  animation: false,
}
