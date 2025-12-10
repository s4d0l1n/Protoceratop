# Physics Engine - Force-Directed Graph Layout

This directory contains the physics simulation engine for RaptorGraph's force-directed layout algorithm (specifically the "bigbang" layout with 4-phase simulation).

## Overview

The physics engine implements an advanced force-directed layout system that simulates physical forces to position nodes in a visually pleasing way. Unlike traditional force-directed approaches, this implementation uses a **4-phase simulation** to handle complex graph topologies with leaves (single-connection nodes) and hubs (highly connected nodes).

### Why 4 Phases?

Traditional force-directed layouts struggle with:
1. Leaf nodes spreading too far from parents (explosion phase)
2. Leaves not snapping close enough to parents (retraction phase)
3. Visual clutter from overlapping nodes (spacing phase)
4. Final fine-tuning of positions (snap phase)

The 4-phase approach addresses each issue sequentially.

## Core Components

### forceDirected.ts - Main Physics Engine

**Function**: `calculatePhysicsFrame(options: PhysicsEngineOptions): Map<string, NodePosition>`

Calculates one frame of physics simulation. Called repeatedly in an animation loop.

**Key Inputs**:
- `nodes`: Array of nodes to position
- `positions`: Current node positions (Map<nodeId, {x, y, vx, vy}>)
- `adjacency`: Node adjacency structure (Map<nodeId, Set<neighborIds>>)
- `physicsParams`: Physics parameters (repulsion strength, etc.)
- `iterationCount`: Current frame number (0 to maxIterations)
- `maxIterations`: Total frames for complete simulation
- `nodeRadius`: Visual radius of nodes (for collision detection)

**Returns**: Updated node positions with velocities

### Physics Forces (Order of Application)

#### 1. Attractive Springs (Edge Connections)
Implements Hooke's law for connected nodes.

**Leaf Springs** (asymmetric):
- Phase 1: Short distance (30px), strong pull (2.0x strength)
- Phase 2: Medium distance (40px), strong pull (2.0x strength)
- Phase 3: Very short distance (20px), very strong pull (8.0x strength)
- Phase 4: Snap distance (5px), extremely strong pull (20.0x strength)

**Hub-to-Hub Springs** (weak):
- Long ideal distance (500px)
- Weak force (5% of normal) to allow hubs to spread out
- Prevents hub clustering

**Formula**: F = k * (distance - idealLength)
- Where k is spring strength
- Positive force = attractive (pull together)

#### 2. Repulsive Forces (Electrostatic)
Implements Coulomb's law to prevent node overlap.

**Repulsion Components**:

a) **Base Electrostatic Repulsion**
- Uses spatial hashing for O(N log N) instead of O(N²)
- Inversely proportional to distance squared
- Formula: F = k / distance

b) **Repulsion Variation**
- Node-pair specific hash creates organic, asymmetric spacing
- Prevents grid-like regular layouts

c) **Node Chaos Factor**
- Adds controlled randomness to repulsion
- Creates more natural, less artificial layouts
- Weighted by averageRandomFactor between two nodes

d) **Leaf Repulsion Reduction**
- Only between connected leaf and parent (15% of normal)
- Allows leaves to orbit closer

e) **Hub Repulsion Boost**
- Between two hubs with >3 degree neighbors
- Multiplier: 1.0 + sqrt((degree-3)/3) * boostFactor
- Keeps high-degree nodes well separated

#### 3. Additional Leaf-Parent Attraction (Phase 2+)
Magnetic pull specifically for leaves toward their parent hub.

- Phase 2: 1.5x attraction
- Phase 3: 5.0x attraction
- Phase 4: 10.0x attraction

Implemented separately from spring forces for flexible tuning.

#### 4. Hub Attraction (Cluster Gravity)
Soft gravity toward the highest-degree neighbor (primary hub).

- Weak force (0.05 magnitude)
- Distance-proportional: F = distance * 0.05
- Keeps clusters loosely together

#### 5. Center Gravity
Global attraction toward canvas center.

- Strength: `physicsParams.centerGravity` (0-1 range)
- Distance-proportional force
- Prevents nodes from drifting off-canvas

### Spatial Hashing Optimization

**Problem**: N-body repulsion would be O(N²) = slow for large graphs

**Solution**: Spatial Hash Grid divides space into cells
- Cell size: 500px
- Query only nearby cells instead of all nodes
- Reduces complexity to O(N log N)

**Trade-off**: Nodes beyond repulsionRadius (default 2000px) don't repel each other
- Acceptable because: distant nodes naturally don't interact much
- User can adjust repulsionRadius parameter if needed

## Physics Parameters

Located in `/components/graph/constants.ts` as `DEFAULT_PHYSICS_PARAMS`:

```typescript
interface PhysicsParams {
  // Force strengths
  repulsionStrength: number        // Base electrostatic force magnitude
  attractionStrength: number       // Leaf-to-parent magnetic attraction
  leafSpringStrength: number       // Multiplier for leaf spring forces
  hubEdgeStrength: number          // Multiplier for hub-to-hub spring forces
  centerGravity: number            // Gravity toward canvas center (0-1)
  damping: number                  // Velocity damping (0-1, higher = slower)

  // Special parameters
  nodeChaosFactor: number          // Randomness in repulsion (0-100)
  hubRepulsionBoost: number        // Extra repulsion between hubs
  repulsionRadius: number          // Distance for spatial hash queries (px)
}
```

### Parameter Tuning Guide

| Parameter | Effect | Typical Range |
|-----------|--------|---|
| `repulsionStrength` | General node spacing | 1000-3000 |
| `attractionStrength` | Leaf pull to parents | 0.1-2.0 |
| `leafSpringStrength` | Leaf spring force multiplier | 0.5-2.0 |
| `hubEdgeStrength` | Hub-to-hub spring multiplier | 0.01-0.1 |
| `centerGravity` | Attraction to center | 0.0-0.5 |
| `damping` | Position update speed | 0.4-0.9 |
| `nodeChaosFactor` | Organic spacing variation | 0-50 |
| `hubRepulsionBoost` | Hub separation enhancement | 0-2.0 |
| `repulsionRadius` | Spatial hash query distance | 1000-3000px |

### Finding Good Parameters
1. Start with defaults
2. Adjust `repulsionStrength` if nodes overlap (increase) or spread too far (decrease)
3. Adjust leaf forces if leaves don't converge (increase `leafSpringStrength`)
4. Adjust `nodeChaosFactor` for more organic look (increase)
5. Adjust `hubRepulsionBoost` if hubs cluster together (increase)

## The 4-Phase Simulation

### Phase 1: Explosion (0-25% of iterations)
**Goal**: Spread leaves away from parent to explore space

- Strong leaf springs (2.0x) keep children near
- Strong repulsion spreads siblings apart
- High temperature allows large movements
- Result: Rough initial layout with spacing

### Phase 2: Retraction (25-50% of iterations)
**Goal**: Begin pulling leaves back toward parents

- Maintained leaf springs (2.0x)
- Additional leaf-parent attraction (1.5x)
- Slightly lower temperature
- Result: Leaves start moving toward hubs

### Phase 3: Spacing (50-75% of iterations)
**Goal**: Enforce collision constraints for clean layout

- Very short leaf distance (20px)
- Very strong leaf springs (8.0x)
- Even stronger leaf-parent attraction (5.0x)
- Collision detection enabled for all nodes
- Moderate temperature
- Result: Leaves cluster near parents, clean layout

### Phase 4: Final Snap (75-100% of iterations)
**Goal**: Extremely tight final positioning

- Snap distance (5px - almost touching)
- Extremely strong springs (20.0x)
- Maximum leaf-parent attraction (10.0x)
- Full collision enforcement
- Very low temperature
- Result: Final precise layout

**Collision Detection**:
- Phase 1-2: Only hub-to-hub collisions
- Phase 3-4: All node collisions (enforced distance: 4x nodeRadius)

## Performance Characteristics

### Time Complexity
- Per frame: O(N log N) due to spatial hashing
- Full simulation: O(N log N * iterations)
- Typical: 300 nodes, 300 iterations = ~1 second on modern hardware

### Memory Usage
- NodePosition map: O(N)
- Spatial hash grid: O(N)
- Adjacency map: O(N + E)
- Total: O(N + E)

### Optimization Techniques Used
1. **Spatial Hashing**: Reduces repulsion calculation from O(N²) to O(N log N)
2. **Simulated Annealing**: Temperature-based damping stabilizes layout
3. **Collision Detection**: O(N²) but only for nearby nodes, fast in practice
4. **Phase-based Approach**: Different forces per phase reduces parameter count

## Usage

### In Components
```typescript
import { calculatePhysicsFrame } from '@/lib/physics/forceDirected'

// In animation loop
const newPositions = calculatePhysicsFrame({
  nodes,
  positions: currentPositions,
  adjacency,
  physicsParams,
  nodeDeviationFactors,
  draggedNodeId,
  canvasWidth,
  canvasHeight,
  iterationCount,
  maxIterations,
  nodeRadius: 20
})
```

### Key Implementation Details
- **Velocities preserved**: vx, vy fields in NodePosition track momentum
- **Dragged nodes**: When draggedNodeId is set, that node stays fixed
- **Asymmetric forces**: Some forces (chaos, variation) are node-pair specific
- **Bounds checking**: Collisions prevent pushing nodes outside canvas
- **Grid alignment**: Preset layouts can use x/y properties to constrain positions

## Debugging and Visualization

Enable PhysicsPanel to see:
- Real-time parameter sliders
- FPS counter for performance monitoring
- Iteration progress
- Current phase indicator

## Related Files
- `/components/graph/PhysicsPanel.tsx` - UI controls for parameters
- `/components/graph/constants.ts` - Default parameter values
- `/lib/spatialHash.ts` - Spatial hashing implementation
- `/components/graph/G6Graph.tsx` - Main render loop calling physics engine

## Future Improvements
1. **GPU Physics**: Move calculations to WebGL compute shaders
2. **Web Workers**: Parallelize physics on separate threads
3. **Adaptive Damping**: Adjust damping based on convergence
4. **Force Gradients**: Use analytical gradients instead of numeric forces
5. **Constraint Solving**: Enforce geometric constraints (aligned edges, etc.)

## References
- Force-Directed Graph Drawing (Fruchterman & Reingold, 1991)
- Simulated Annealing for Graph Layout (West, 1997)
- Coulomb Repulsion Model for Node-Link Diagrams
