# RaptorGraph Source Code Documentation

Welcome to the RaptorGraph codebase! This is a comprehensive graph visualization application built with React, TypeScript, Canvas, and advanced physics-based layout algorithms.

## Project Overview

RaptorGraph is an interactive web application for visualizing complex relationships in CSV data. Key features include:

- **CSV Import**: Load relational data from CSV files with flexible column mapping
- **Graph Rendering**: Fast canvas-based rendering with multi-layer architecture
- **Physics Simulation**: 4-phase force-directed layout with spatial hashing optimization
- **14 Layout Algorithms**: From force-directed to hierarchical to timeline layouts
- **Visual Customization**: Card templates, edge templates, font templates with effects
- **Conditional Styling**: Rule-based template application with regex support
- **Grouping & Hierarchies**: Multi-layer meta-node grouping with collapse/expand
- **Export**: PNG (high-res) and SVG vector export
- **Project Save/Load**: Complete project serialization to JSON
- **Responsive UI**: Dark mode, zoom/pan, keyboard shortcuts

## Directory Structure

```
src/
├── App.tsx                      # Main React component and app entry
├── main.tsx                     # React DOM render entry point
├── index.css                    # Global styles
│
├── types/
│   └── index.ts                 # All TypeScript type definitions
│
├── stores/                      # Zustand state management
│   ├── README.md                # Store documentation
│   ├── graphStore.ts            # Graph data (nodes, edges, meta-nodes)
│   ├── uiStore.ts               # UI state (selection, viewport, panels)
│   ├── projectStore.ts          # Project metadata and layout config
│   ├── templateStore.ts         # Visual templates (cards, edges, fonts)
│   ├── rulesStore.ts            # Conditional styling rules
│   ├── csvStore.ts              # CSV uploads and mappings
│   └── settingsStore.ts         # Application settings
│
├── lib/                         # Core libraries and algorithms
│   ├── README.md                # Library documentation
│   │
│   ├── physics/
│   │   ├── README.md            # Physics engine documentation
│   │   └── forceDirected.ts     # 4-phase physics simulation
│   │
│   ├── layouts/                 # 14 graph layout algorithms
│   │   ├── README.md            # Layout algorithm guide
│   │   ├── forceLayout.ts       # bigbang & force algorithms
│   │   ├── hierarchicalLayout.ts # hierarchical, fcose, dagre
│   │   ├── timelineLayout.ts    # Timeline with swimlanes
│   │   ├── radialLayout.ts      # Radial tree layout
│   │   ├── concentricLayout.ts  # Concentric circles
│   │   ├── circleLayout.ts      # Simple circle layout
│   │   ├── gridLayout.ts        # Grid layout
│   │   ├── clusterIslandLayout.ts # Cluster island visualization
│   │   ├── fruchtermanLayout.ts # Fruchterman-Reingold physics
│   │   ├── kamadaKawaiLayout.ts # Stress minimization layout
│   │   ├── spectralLayout.ts    # Eigenvalue-based layout
│   │   ├── treeLayout.ts        # Hierarchical tree layout
│   │   ├── sugiyamaLayout.ts    # Layered DAG layout
│   │   └── randomLayout.ts      # Random positioning
│   │
│   ├── dataProcessor.ts         # CSV to graph conversion
│   ├── grouping.ts              # Meta-node generation and visibility
│   ├── spatialHash.ts           # Spatial indexing for physics
│   ├── graph-algorithms.ts      # Graph analysis (paths, components, etc.)
│   ├── styleEvaluator.ts        # Rule evaluation for templates
│   ├── convexHull.ts            # Convex hull for group boundaries
│   ├── bubbleSets.ts            # Bubble set visualization
│   ├── multiValueParser.ts      # Multi-value CSV cell parsing
│   ├── projectIO.ts             # Project save/load
│   ├── viewport.ts              # Canvas coordinate transformation
│   └── utils.ts                 # General utilities
│
├── hooks/                       # React custom hooks
│   ├── README.md                # Hooks documentation
│   ├── useGraphExport.ts        # PNG/SVG export
│   ├── useDataProcessor.ts      # CSV processing
│   ├── useProjectIO.ts          # Project file I/O
│   └── useKeyboardShortcuts.ts  # Keyboard shortcuts
│
├── components/
│   ├── graph/                   # Graph rendering components
│   │   ├── G6Graph.tsx          # Main canvas-based renderer
│   │   ├── G6Graph.canvas.tsx   # Canvas drawing utilities
│   │   ├── PhysicsPanel.tsx     # Physics parameter controls
│   │   ├── HighlightPanel.tsx   # Edge highlighting settings
│   │   ├── Minimap.tsx          # Minimap visualization
│   │   ├── constants.ts         # Physics defaults and constants
│   │   └── types.ts             # Component-specific types
│   │
│   ├── ui/                      # UI panels and components
│   │   ├── UploadPanel.tsx      # CSV upload interface
│   │   ├── ColumnMapper.tsx     # CSV column role mapping
│   │   ├── NodeDetailPanel.tsx  # Node properties viewer
│   │   ├── CardTemplatePanel.tsx # Card template UI
│   │   ├── CardTemplateEditor.tsx # Card template editor
│   │   ├── EdgeTemplatePanel.tsx # Edge template UI
│   │   ├── EdgeTemplateEditor.tsx # Edge template editor
│   │   ├── FontTemplatePanel.tsx # Font template UI
│   │   ├── FontTemplateEditor.tsx # Font template editor
│   │   ├── RulesPanel.tsx       # Style rules UI
│   │   ├── RuleEditor.tsx       # Rule editor
│   │   ├── LayoutPanel.tsx      # Layout selection and config
│   │   ├── LayoutSwitcher.tsx   # Quick layout switcher
│   │   ├── LayoutPresets.tsx    # Layout preset configurations
│   │   ├── GroupingPanel.tsx    # Meta-node grouping UI
│   │   ├── SearchFilterPanel.tsx # Search and filtering
│   │   ├── SettingsPanel.tsx    # Application settings
│   │   ├── ArrangementToolbar.tsx # Node arrangement tools
│   │   ├── FileUploadZone.tsx   # Drag-and-drop file upload
│   │   ├── LoadingSpinner.tsx   # Loading indicator
│   │   ├── Toast.tsx            # Toast notifications
│   │   └── (other UI components)
│   │
│   └── layout/
│       ├── Header.tsx           # Top navigation bar
│       └── Sidebar.tsx          # Left sidebar with panels
│
└── utils/                       # (Directory for future utilities)
```

## Data Architecture

### Core Data Model

```
GraphNode {
  id: string              // Unique identifier
  label: string           // Display name
  attributes: Record<>    // CSV-derived attributes
  tags: string[]          // Categorization tags
  sourceFiles: string[]   // CSV sources
  isStub: boolean         // Auto-created flag
  cardTemplateId?: string // Applied visual template
  x?, y?: number          // Preset position
  timestamp?: number      // Timeline support
}

GraphEdge {
  id: string              // Unique identifier (source-target)
  source: string          // Source node ID
  target: string          // Target node ID
  label?: string          // Connection label
  edgeTemplateId?: string // Applied edge template
  sourceAttribute?: string // Origin attribute
  targetAttribute?: string // Target attribute
}

MetaNode {
  id: string                 // Unique identifier
  label: string              // Group display name
  groupByAttribute: string   // Grouping attribute
  groupValue: string         // Attribute value
  childNodeIds: string[]     // Child nodes
  collapsed: boolean         // Visibility state
  layer: number              // Nesting level
  x?, y?: number             // Calculated position
}
```

### State Management Flow

```
User Interaction
    |
    v
React Component
    |
    +---> Zustand Store (useGraphStore, useUIStore, etc.)
    |        |
    |        v
    |     LocalStorage (persistence)
    |
    v
Render Loop
    |
    +---> Layout Algorithm (layouts/)
    |
    +---> Physics Engine (physics/forceDirected.ts)
    |
    +---> Canvas Rendering (components/graph/G6Graph.tsx)
```

## Key Subsystems

### 1. Graph Rendering (Canvas-Based)
**Location**: `components/graph/G6Graph.tsx`

High-performance canvas rendering with layered architecture:
- **Background Layer**: Swimlanes, static elements
- **Edge Layer**: Connection lines
- **Node Layer**: Node shapes, cards, labels
- **Overlay Layer**: Selection highlights, hover effects

**Performance**: 60 FPS for graphs up to 1000 nodes via:
- Dirty layer tracking (only redraw changed layers)
- Motion detection (skip redraw if nothing moved)
- Spatial hashing (physics O(N log N) instead of O(N²))
- Viewport culling (don't draw off-screen nodes)

### 2. Physics Engine (Force-Directed Layout)
**Location**: `lib/physics/forceDirected.ts`

4-phase physics simulation for organic layout:
- **Phase 1 (0-25%)**: Explosion - spread leaves away
- **Phase 2 (25-50%)**: Retraction - pull leaves back
- **Phase 3 (50-75%)**: Spacing - enforce collisions
- **Phase 4 (75-100%)**: Snap - final positioning

**Forces**:
1. Attractive springs (edges)
2. Electrostatic repulsion
3. Leaf-parent magnetic attraction
4. Hub gravity (cluster pulling)
5. Center gravity (canvas bounds)

**Optimization**: Spatial hashing reduces O(N²) repulsion to O(N log N)

### 3. CSV Import Pipeline
**Location**: `hooks/useDataProcessor.ts` → `lib/dataProcessor.ts`

Process:
1. User uploads CSV file
2. Component parses preview
3. User maps columns to roles:
   - `node_id`: Creates/identifies nodes
   - `attribute`: Node properties
   - `link_to`: Creates edges
   - `timestamp`: Timeline support
4. Data processor creates nodes and edges
5. Stub nodes auto-created for referenced but undefined targets
6. Graph merged into store

### 4. Visual Styling System
**Location**: `stores/templateStore.ts` → `lib/styleEvaluator.ts`

Three template types:
- **Card Templates**: Node shape, color, icon, size, effects
- **Edge Templates**: Line style, color, width, arrows
- **Font Templates**: Text styling and effects

Rule-based application:
1. User creates rules with conditions
2. Rule evaluator checks each node/edge
3. Matching templates applied
4. Templates support visual effects (shadow, glow, pulse, RGB cycle)

### 5. Layout Algorithms (14 Total)
**Location**: `lib/layouts/`

**Categories**:
- **Force-Directed**: bigbang (optimized), force, fruchterman, kamada-kawai
- **Hierarchical**: hierarchical, dagre, sugiyama, tree, fcose
- **Radial**: radial, concentric, circle
- **Grid**: grid
- **Temporal**: timeline
- **Clustered**: clusterIsland
- **Other**: spectral, random, preset

**Selection Guide**:
- Unknown structure → `bigbang` or `force`
- Trees → `hierarchical` or `radial`
- DAGs → `dagre` or `sugiyama`
- Timeline data → `timeline`
- All nodes equally important → `circle` or `grid`

### 6. Grouping and Hierarchies
**Location**: `lib/grouping.ts`

Multi-layer meta-node system:
- Single-layer: Group by one attribute
- Multi-layer: Combine multiple attributes (nested groups)
- Collapse/expand groups to hide children
- Visibility cascading (collapsed parent hides children)

### 7. Project Persistence
**Location**: `lib/projectIO.ts` → `hooks/useProjectIO.ts`

Complete project serialization:
- Graph structure (nodes, edges, meta-nodes)
- All templates (card, edge, font)
- Style rules
- Layout configuration
- CSV source files
- Metadata (timestamps, version)

File format: JSON (uncompressed or compressed)
Browser storage: LocalStorage + file downloads

## Important Concepts

### Stub Nodes
Nodes that are referenced but not explicitly defined in CSV.
- Created during CSV import when link_to finds non-existent targets
- Marked with `isStub: true`
- Promoted to regular nodes when found in later CSV uploads
- Useful for discovering missing data

### Meta-Nodes
Virtual grouping nodes that organize the graph:
- Contain child node IDs
- Have calculated positions (average of children)
- Can be collapsed to hide children
- Support nested/multi-layer configurations
- Don't affect edge connections (edges still point to original nodes)

### Adjacency List
Optimized data structure for neighbor lookups:
```
Map<nodeId, Set<neighborNodeIds>>
```
Built once per graph update, used for:
- Physics calculations (neighbor detection)
- Graph algorithms (traversal)
- Edge counting (determining leaf vs hub)

### Viewport Coordinate System
Two coordinate systems:
- **Screen**: Canvas pixel coordinates (0,0 at top-left)
- **World**: Graph coordinates (typically centered)

Transformed by viewport object for:
- Mouse event handling
- Canvas rendering
- Hitbox detection

### Dirty Layer System
Optimization to avoid redrawing unchanged content:
- Tracks which canvas layers need update
- Only redraws dirty layers
- Motion detection skips render if nothing moved
- Typically saves 80-90% of redraw calls

## Performance Characteristics

### Graph Size Limits
| Size | Performance | Notes |
|------|-------------|-------|
| <100 nodes | Instant layout | Any algorithm works |
| 100-500 nodes | 1-5s layout | Use bigbang or hierarchical |
| 500-1000 nodes | 5-30s layout | Spatial hashing critical |
| 1000+ nodes | 30s+ layout | Consider grid or circle |
| 10000+ nodes | Very slow | Need optimization |

### Time Complexity Summary
| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Build adjacency list | O(N + E) | One-time, reused |
| Physics frame | O(N log N) | With spatial hashing |
| Layout algorithm | O(N log N) - O(N²) | Varies by algorithm |
| Rule evaluation | O(R * N) | R = rules count |
| Render frame | O(V) | V = visible nodes |
| Export to PNG | O(1) | Async, doesn't block |

## Development Workflow

### Adding a New Feature

1. **Define Types** (if new data type)
   - Add to `types/index.ts`
   - Document in comments

2. **Create Store State** (if needs persistence)
   - Add to appropriate store in `stores/`
   - Use Zustand patterns

3. **Implement Logic** (if core algorithm)
   - Create in `lib/`
   - Make independent of React

4. **Create Hook** (if component integration needed)
   - Create in `hooks/`
   - Wrap library with React patterns

5. **Build UI Component** (if user-facing)
   - Create in `components/`
   - Connect to stores/hooks
   - Add to appropriate panel

6. **Document**
   - Add comments explaining logic
   - Update relevant README.md files

### Common Tasks

**Add new CSV column role**:
1. Update `ColumnRole` type in `types/index.ts`
2. Handle in `dataProcessor.ts`
3. Update UI in `ColumnMapper.tsx`

**Add new layout algorithm**:
1. Create `layoutName.ts` in `layouts/`
2. Add to `LayoutType` union
3. Import in layout selector panel
4. Update `layouts/README.md`

**Add new visual template option**:
1. Add field to `CardTemplate` / `EdgeTemplate` / `FontTemplate`
2. Update template editor component
3. Update canvas rendering in `G6Graph.tsx`
4. Update template store

**Adjust physics parameters**:
1. Modify `DEFAULT_PHYSICS_PARAMS` in `components/graph/constants.ts`
2. Physics panel automatically updates UI sliders
3. Test with PhysicsPanel debug view

## Browser Compatibility

### Required Features
- HTML5 Canvas (required)
- ES2020+ JavaScript
- LocalStorage (for persistence)
- Typed Arrays (for physics math)
- Workers (optional, for background processing)

### Tested On
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Known Limitations
- IE11: Not supported (no ES2020)
- Mobile Safari: Touch gestures limited
- Firefox: Some subtle rendering differences

## Performance Optimization Tips

1. **For Large Graphs**:
   - Use simpler layout (grid, circle)
   - Reduce physics iterations
   - Enable filtering to work with subsets
   - Consider web workers for physics

2. **For Smooth Interaction**:
   - Keep physics running at 60 FPS
   - Use debouncing for user input
   - Cache expensive calculations
   - Lazy-load large CSV files

3. **For Memory**:
   - Clear unused data
   - Use efficient data structures (Map/Set over array)
   - Consider compression for large projects
   - Monitor localStorage usage

## Testing

The codebase doesn't currently have a comprehensive test suite. Adding tests would improve:
- Layout algorithm correctness
- Physics simulation validation
- CSV parsing edge cases
- Rule evaluation logic
- Store state management

## Next Steps for Documentation Readers

1. **Understanding the Main Flow**:
   - Read `App.tsx` to see component hierarchy
   - Follow import chain to understand data flow

2. **For Rendering Knowledge**:
   - Study `components/graph/G6Graph.tsx`
   - Understand canvas layer architecture

3. **For Physics Deep Dive**:
   - Read `lib/physics/README.md`
   - Study `forceDirected.ts` implementation

4. **For Adding Features**:
   - Find similar existing feature
   - Follow same patterns
   - Update README documentation

## Key Files for Quick Reference

- **Type Definitions**: `types/index.ts`
- **Main Component**: `components/graph/G6Graph.tsx`
- **Physics Engine**: `lib/physics/forceDirected.ts`
- **Data Processing**: `lib/dataProcessor.ts`
- **Graph Store**: `stores/graphStore.ts`
- **UI Store**: `stores/uiStore.ts`
- **Viewport**: `lib/viewport.ts`
- **CSS Styling**: `index.css`

## Troubleshooting

**Graph won't layout**:
- Check nodes have valid x,y or graph algorithm is assigned
- Verify edges reference valid node IDs
- Check physics parameters aren't too extreme

**Performance issues**:
- Check graph size (>1000 nodes needs optimization)
- Verify spatial hash cell size (should be ~2x query radius)
- Look at FPS counter in PhysicsPanel

**Rules not applying**:
- Check rule enabled and condition matches
- Verify template exists
- Look at rule order (earlier rules have priority)

**Export issues**:
- For PNG: Check canvas has been rendered
- For SVG: Verify all fonts are available
- Check browser memory isn't exceeded

## Additional Resources

- Canvas rendering: MDN Web Docs - Canvas API
- Zustand: https://github.com/pmndrs/zustand
- React hooks: React Official Documentation
- Graph algorithms: Introduction to Algorithms (CLRS)
- Force-directed layout: Fruchterman & Reingold 1991

## License and Attribution

RaptorGraph implementation with custom physics engine and multi-phase layout.
Key algorithm references in respective README files.

---

Last Updated: December 2025
Version: 1.0.0
