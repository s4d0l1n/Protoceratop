# Graph Layout Algorithms

This directory contains 14 different graph layout algorithms, each optimized for different graph types and visualization goals.

## Layout Algorithm Matrix

| Algorithm | Best For | Complexity | Speed | Quality | File |
|-----------|----------|-----------|-------|---------|------|
| **bigbang** | General graphs with leaves/hubs | O(N log N) | Medium | Excellent | forceLayout.ts |
| **force** | All-purpose force-directed | O(N²) iterations | Slow | Good | forceLayout.ts |
| **hierarchical** | Directed acyclic graphs, trees | O(N log N) | Fast | Excellent | hierarchicalLayout.ts |
| **radial** | Center-focused trees | O(N log N) | Very Fast | Good | radialLayout.ts |
| **fcose** | Compound/nested graphs | O(N log N) | Medium | Excellent | hierarchicalLayout.ts |
| **dagre** | Directed acyclic graphs | O(N log N) | Very Fast | Excellent | hierarchicalLayout.ts |
| **timeline** | Temporal data, swimlanes | O(N log N) | Fast | Excellent | timelineLayout.ts |
| **concentric** | Radial layers | O(N log N) | Very Fast | Good | concentricLayout.ts |
| **circle** | Ring layouts | O(N) | Very Fast | Fair | circleLayout.ts |
| **grid** | Lattice/matrix data | O(N) | Very Fast | Fair | gridLayout.ts |
| **preset** | Pre-calculated positions | O(1) | Instant | Perfect | hierarchicalLayout.ts |
| **fruchterman** | Force-directed variant | O(N²) iterations | Slow | Good | fruchtermanLayout.ts |
| **kamadaKawai** | Stress minimization | O(N²) iterations | Slow | Good | kamadaKawaiLayout.ts |
| **spectral** | Eigenvalue-based | O(N³) | Very Slow | Good | spectralLayout.ts |
| **tree** | Hierarchical trees | O(N log N) | Fast | Excellent | treeLayout.ts |
| **sugiyama** | Layered graphs | O(N log N) | Fast | Excellent | sugiyamaLayout.ts |
| **random** | Testing/fallback | O(N) | Instant | Poor | randomLayout.ts |
| **clusterIsland** | Clustered graphs | O(N log N) | Medium | Excellent | clusterIslandLayout.ts |

## Quick Selection Guide

### "I need to visualize..."

**...a tree structure**
- Recommend: `hierarchical` or `tree`
- Alt: `radial` for circular style

**...a directed acyclic graph (DAG)**
- Recommend: `dagre` or `sugiyama`
- Alt: `hierarchical`

**...a general graph with unknown structure**
- Recommend: `bigbang` or `force`
- Alt: `fruchterman` for finer control

**...temporal/timeline data**
- Recommend: `timeline`
- Config: Set timelineSwimlaneAttribute, adjust spacing

**...data in clusters/communities**
- Recommend: `clusterIsland`
- Alt: `concentric` for radial clusters

**...all nodes same distance from center**
- Recommend: `concentric` or `circle`

**...grid/matrix data**
- Recommend: `grid`

**...I already have node positions**
- Recommend: `preset` (uses existing x/y coordinates)

**...just testing/debug visualization**
- Recommend: `random` (instant, shows structure)

## Detailed Algorithm Descriptions

### forceLayout.ts

#### bigbang (Primary Physics-Based Layout)
**Class**: Force-directed with 4-phase simulation
**Purpose**: General-purpose, excellent for mixed graph types

**Features**:
- 4-phase physics simulation (explosion → retraction → spacing → snap)
- Spatial hashing for performance (O(N log N))
- Special handling for leaves (low-degree) vs hubs (high-degree)
- Adaptive parameters based on phase
- Collision detection for clean layout

**When to Use**:
- Unknown graph structure
- Mixed node degrees (some hubs, many leaves)
- Want balanced, organic-looking layout
- Don't need perfect hierarchy

**Parameters**:
```typescript
LayoutConfig for bigbang uses generic physics parameters from PhysicsPanel
```

**Complexity**: O(N log N) per frame × iterations
**Time**: ~1-2 seconds for 1000 nodes

#### force (Standard Force-Directed)
**Class**: Traditional spring-embedder
**Purpose**: Classic force-directed layout

**Features**:
- Hooke's law springs for attraction
- Coulomb repulsion
- Simulated annealing for convergence
- Simple, well-understood algorithm

**When to Use**:
- Need predictable, standard behavior
- Graph is small (<500 nodes)
- Want tunable parameters

**Complexity**: O(N²) per iteration
**Time**: Slower than bigbang, good for small graphs

### hierarchicalLayout.ts

#### hierarchical (Layered Hierarchical)
**Purpose**: Show hierarchical structure in layers

**Features**:
- Assigns nodes to layers
- Positions layers horizontally or vertically
- Minimizes edge crossings
- Configurable direction (TB, BT, LR, RL)

**Parameters**:
```typescript
hierarchicalDirection: 'top-bottom' | 'bottom-top' | 'left-right' | 'right-left'
hierarchicalLevelSeparation: number    // Space between levels (px)
hierarchicalNodeSeparation: number     // Space between nodes on same level (px)
```

**When to Use**:
- Clear hierarchical structure exists
- Want to emphasize parent-child relationships
- Need clean, organized layout

**Complexity**: O(N log N)
**Time**: Very fast, instant for most graphs

#### fcose (Fast Compound Spring Embedder)
**Purpose**: Hierarchical + physics hybrid

**Features**:
- Combines force-directed physics with layer constraints
- Supports nested/compound nodes
- Spring forces within layers
- Gravity between layers

**When to Use**:
- Hierarchical structure with complex relationships
- Need physics-like organic layout with order
- Have compound/grouped nodes

**Complexity**: O(N log N)
**Time**: Medium speed

#### dagre (Directed Acyclic Graph)
**Purpose**: Optimized for DAGs

**Features**:
- Specifically designed for directed graphs
- Minimizes edge crossings
- Shows flow direction clearly
- Very efficient

**When to Use**:
- Graph is known to be acyclic
- Direction of edges matters (workflows, pipelines)
- Want best automatic layout for dependencies

**Complexity**: O(N log N)
**Time**: Very fast, ideal for real-time updates

#### preset
**Purpose**: Use pre-calculated node positions

**Features**:
- Reads x/y coordinates from GraphNode
- No calculation required
- Instant layout

**When to Use**:
- You have existing positions you want to preserve
- Loading saved graph with layout
- Want manual positioning

**Complexity**: O(1)
**Time**: Instant

### timelineLayout.ts

**Purpose**: Arrange nodes on timeline with swimlanes

**Key Concept**: X-axis = time, Y-axis = categories, swimlanes = attribute values

**Features**:
- Extracts timestamp from nodes
- Groups by swimlane attribute
- Supports relative spacing (proportional to time) or equal spacing
- Sorts swimlanes alphabetically, by count, or custom order
- Filters by time range

**Parameters**:
```typescript
timelineSwimlaneAttribute: string      // Attribute to group swimlanes by
timelineVerticalSpacing: number        // Y-space between swimlanes (px)
timelineXSpacingMultiplier: number     // Horizontal time spacing
timelineYSpacingMultiplier: number     // Vertical node spacing within swimlane
timelineSwimlaneSort: 'alphabetical' | 'count' | 'custom'
timelineSpacingMode: 'relative' | 'equal'
timelineStartTime?: number             // Min timestamp to show
timelineEndTime?: number               // Max timestamp to show
```

**When to Use**:
- Data has temporal dimension (dates, timestamps)
- Want to see time progression
- Need category/swimlane grouping
- Historical or event data

**Example**:
```typescript
// Visualize email timeline grouped by sender
{
  type: 'timeline',
  timelineSwimlaneAttribute: 'sender',
  timelineXSpacingMultiplier: 1.0,
  timelineYSpacingMultiplier: 2.0,
  timelineSwimlaneSort: 'count'
}
```

### radialLayout.ts

**Purpose**: Radial tree layout from center node

**Features**:
- Central node at origin
- Child layers at increasing radii
- Angular distribution around center
- Good for showing branching

**When to Use**:
- Tree structure with clear root
- Want circular/spiral aesthetic
- Exploring from one central node

**Complexity**: O(N log N)
**Time**: Very fast

### concentricLayout.ts

**Purpose**: Concentric circle layout by layer

**Features**:
- Groups nodes in concentric circles
- Can use node degree or custom attribute for layers
- Inner circles = higher layer
- Good for showing hierarchy as distance

**When to Use**:
- Want concentric style
- Have clear layer information
- Central node most important

**Complexity**: O(N log N)
**Time**: Very fast

### circleLayout.ts

**Purpose**: Simple circle/ring layout

**Features**:
- Arranges all nodes on a single circle
- Even distribution around circle
- Minimal visual clutter

**When to Use**:
- Want simple, clean layout
- All nodes equally important
- Showcase edge structure

**Complexity**: O(N)
**Time**: Instant

### gridLayout.ts

**Purpose**: Lattice/grid arrangement

**Features**:
- Arranges nodes in rectangular grid
- Configurable grid size
- Can sort by attribute for logical ordering

**When to Use**:
- Matrix/table-like data
- Want organized, grid-like appearance
- Regular structure

**Complexity**: O(N)
**Time**: Instant

### clusterIslandLayout.ts

**Purpose**: Islands of clustered nodes

**Features**:
- Detects clusters using community detection
- Arranges clusters as separate islands
- Positions nodes within clusters
- Shows cluster relationships

**When to Use**:
- Graph has distinct clusters/communities
- Want to emphasize grouping
- Explore dense subgraphs

**Complexity**: O(N log N)
**Time**: Medium speed

### fruchtermanLayout.ts

**Purpose**: Force-directed alternative to bigbang

**Features**:
- Classic Fruchterman-Reingold algorithm
- Temperature-based cooling
- Good convergence properties
- More predictable than bigbang

**When to Use**:
- Need reliable force-directed layout
- Graph is small to medium size
- Want different physics than bigbang

**Complexity**: O(N²) per iteration
**Time**: Slower than bigbang

### kamadaKawaiLayout.ts

**Purpose**: Stress minimization force-directed

**Features**:
- Minimizes layout stress (edge length variance)
- Good for preserving graph structure
- Slower convergence
- Excellent quality for small graphs

**When to Use**:
- Want high-quality layout
- Graph is small (<100 nodes)
- Edge lengths matter
- Don't need instant layout

**Complexity**: O(N²) or O(N³) depending on variant
**Time**: Slow, good for offline layouts

### sugiyamaLayout.ts

**Purpose**: Layered DAG layout

**Features**:
- Divides into layers
- Minimizes edge crossings
- Supports backward edges
- Configurable direction

**When to Use**:
- DAG with clear layering
- Want to show flow/hierarchy
- Need crossing minimization

**Complexity**: O(N log N)
**Time**: Fast

### treeLayout.ts

**Purpose**: Hierarchical tree layout

**Features**:
- Optimized for trees
- Clean parent-child positioning
- Configurable orientation
- Compact layout

**When to Use**:
- Data is tree-structured
- Clear parent-child relationships
- Want compact, clean layout

**Complexity**: O(N log N)
**Time**: Very fast

### spectralLayout.ts

**Purpose**: Eigenvalue-based layout

**Features**:
- Uses Laplacian eigenvectors
- Theoretically optimal in some sense
- Captures global structure
- Very slow

**When to Use**:
- Want mathematical rigor
- Graph is small (<50 nodes)
- Quality more important than speed
- Academic/research visualization

**Complexity**: O(N³) (matrix eigendecomposition)
**Time**: Very slow

### randomLayout.ts

**Purpose**: Random positioning (testing/fallback)

**Features**:
- Places nodes at random coordinates
- No meaningful arrangement
- Instant
- Shows graph structure through edges

**When to Use**:
- Debug/testing
- Comparing layout algorithms
- Need instant feedback
- Want to see if layout is missing

**Complexity**: O(N)
**Time**: Instant

## Layout Configuration

All layouts are configured via `LayoutConfig` in projectStore:

```typescript
interface LayoutConfig {
  type: LayoutType
  // Type-specific options
  hierarchicalDirection?: HierarchicalDirection
  hierarchicalLevelSeparation?: number
  hierarchicalNodeSeparation?: number

  timelineSwimlaneAttribute?: string
  timelineVerticalSpacing?: number
  timelineXSpacingMultiplier?: number
  timelineYSpacingMultiplier?: number
  timelineSwimlaneSort?: TimelineSortOrder
  timelineSpacingMode?: TimelineSpacingMode

  options?: Record<string, unknown>  // Additional custom options
}
```

## Implementation Patterns

### Basic Layout Function Signature
```typescript
export function layoutName(
  nodes: Node[],
  edges: Edge[],
  config: LayoutConfig,
  canvasWidth: number,
  canvasHeight: number
): Map<string, NodePosition> {
  // Calculate and return positions
}
```

### Typical Algorithm Steps
1. **Validation**: Check input data validity
2. **Preprocessing**: Convert edges to adjacency, compute degrees
3. **Core Algorithm**: Apply layout-specific calculations
4. **Scaling**: Scale positions to fit canvas
5. **Centering**: Center layout on canvas
6. **Return**: Map from nodeId to {x, y, vx?, vy?}

### Example: Circle Layout
```typescript
export function circleLayout(nodes: Node[], edges: Edge[],
  config: LayoutConfig, width: number, height: number) {
  const positions = new Map<string, NodePosition>()
  const radius = Math.min(width, height) / 2 - 50
  const centerX = width / 2
  const centerY = height / 2

  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI
    positions.set(node.id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      vx: 0,
      vy: 0
    })
  })

  return positions
}
```

## Performance Tips

1. **For Large Graphs (>1000 nodes)**:
   - Use `bigbang`, `dagre`, or `hierarchical`
   - Avoid `spectral`, `kamadaKawai`
   - Consider `circle` or `grid` for structure visualization

2. **For Real-Time Updates**:
   - Use `preset` to avoid recalculation
   - Or use `bigbang` with fewer iterations

3. **For Interactive Exploration**:
   - `radial` and `timeline` great for navigation
   - `concentric` good for focus-based exploration

4. **For Publication Quality**:
   - `kamadaKawai` or `sugiyama` for best results
   - Allow longer computation time

## Related Files
- `/components/ui/LayoutPanel.tsx` - UI to select layout and configure
- `/stores/projectStore.ts` - Stores layout configuration
- `/components/graph/G6Graph.tsx` - Applies layout algorithm in render loop

## Adding New Layouts

1. Create new file: `src/lib/layouts/myLayout.ts`
2. Implement function matching signature above
3. Export from this file
4. Add type to `LayoutType` union in `/types/index.ts`
5. Import and use in layout selector panel
6. Add configuration options if needed to `LayoutConfig`

## Algorithm References

- Fruchterman & Reingold: "Graph Drawing by Force-Directed Placement"
- Sugiyama et al.: "Methods and Tools for Visualizing Hierarchical Structures"
- Kamada & Kawai: "An Algorithm for Drawing General Undirected Graphs"
- Radial layouts: Based on classic tree visualization techniques
- Timeline: Custom implementation for temporal data
