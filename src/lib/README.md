# RaptorGraph Library (lib/) - Core Utilities and Algorithms

This directory contains core utility functions and algorithms that power RaptorGraph's functionality. These are independent of React and can be used in any context.

## Directory Structure

```
lib/
├── layouts/                    # 14 graph layout algorithms
│   └── README.md
├── physics/                    # Force-directed physics engine
│   ├── forceDirected.ts
│   └── README.md
├── dataProcessor.ts            # CSV to graph conversion
├── grouping.ts                 # Meta-node generation and visibility
├── spatialHash.ts              # Spatial indexing for physics
├── graph-algorithms.ts         # Graph analysis utilities
├── convexHull.ts               # Convex hull for grouping visualization
├── bubbleSets.ts               # Bubble set construction
├── styleEvaluator.ts           # Rule evaluation for templates
├── multiValueParser.ts         # Parsing CSV multi-value cells
├── projectIO.ts                # Project file save/load
├── viewport.ts                 # Canvas viewport transformation
├── utils.ts                    # General utilities
└── README.md
```

## Core Utilities

### dataProcessor.ts
**Purpose**: Convert CSV files into graph nodes and edges

**Key Functions**:
- `processCSVFile(file: CSVFile): {nodes, edges}`

**How It Works**:
1. Reads all rows from parsed CSV
2. Creates nodes from node_id columns
3. Merges attributes from attribute columns
4. Creates edges from link_to columns
5. Creates stub nodes automatically for referenced but undefined nodes

**Key Features**:
- **Multi-column node IDs**: Multiple node_id columns supported
- **Stub Node Promotion**: Auto-created nodes become regular nodes when uploaded
- **Attribute Merging**: Attributes from multiple rows merge into arrays
- **Smart Link Resolution**: Handles linking to nodes that don't exist yet (creates stubs)
- **Source File Tracking**: Records which CSV files contributed to each node

**Example**:
```typescript
const { nodes, edges } = processCSVFile(csvFile)
// nodes contain attributes from CSV columns
// edges created from link_to relationships
// Stub nodes created for any referenced but undefined targets
```

**Related Files**:
- `multiValueParser.ts` - Handles multi-value cell parsing (semicolon/comma separated)
- `stores/csvStore.ts` - Manages uploaded CSV files

### grouping.ts
**Purpose**: Create meta-nodes (groupings) and manage group visibility

**Key Functions**:
- `generateMetaNodes(nodes, config): MetaNode[]` - Create grouping structure
- `getVisibleNodesWithGrouping(nodes, metaNodes): visibleNodes` - Get visible nodes
- `calculateMetaNodePosition(metaNode, nodes, positions): {x, y}` - Center of group
- `transformEdgesForGrouping(edges, visibleNodes): edges` - Filter visible edges
- `applyGridLayoutToGroups(nodes, metaNodes, canvasWidth, canvasHeight): positions` - Grid arrangement

**Grouping Modes**:

1. **Legacy Single-Layer Grouping**:
   ```typescript
   {
     enabled: true,
     groupByAttribute: 'department',
     autoCollapse: false
   }
   ```

2. **Multi-Layer Combination Grouping**:
   ```typescript
   {
     enabled: true,
     layers: [
       { id: 'layer1', attribute: 'department', order: 0 },
       { id: 'layer2', attribute: 'region', order: 1 }
     ],
     autoCollapse: true
   }
   ```

**Visibility Logic**:
- Collapsed meta-nodes hide all children
- Nested meta-nodes respect parent collapse state
- Edges only shown if both endpoints visible

**Meta-Node Positioning**:
- Position = average of child node positions
- After layout, used to position grouping rectangles
- Can be manually repositioned

**Complex Scenario Handling**:
- **Multi-group Nodes**: Nodes with multiple attribute values in array
- **Conflict Resolution**: Nodes with >1 values excluded from single-value groups
- **Nested Combinations**: Layer N+1 groups the meta-nodes from layer N

**Example**:
```typescript
const metaNodes = generateMetaNodes(nodes, {
  enabled: true,
  groupByAttribute: 'team',
  autoCollapse: false
})

const visibleNodes = getVisibleNodesWithGrouping(nodes, metaNodes)
const visibleEdges = transformEdgesForGrouping(edges, visibleNodes)
```

### graph-algorithms.ts
**Purpose**: Graph analysis and querying utilities

**Key Functions**:
- `buildAdjacencyList(nodes, edges): adjacency` - Faster neighbor lookup
- `findConnectedComponent(nodeId, adjacency): nodeIds` - Find connected subgraph
- `getNodeDegree(nodeId, adjacency): number` - Neighbor count
- `getCommonNeighbors(nodeId1, nodeId2, adjacency): nodeIds` - Shared neighbors
- `getShortestPath(from, to, adjacency): path` - BFS shortest path
- `getEgoNetwork(nodeId, radius, adjacency): subgraph` - Neighborhood at distance
- `detectCommunities(nodes, edges): communities` - Cluster detection

**Adjacency List**:
Built from edges for O(1) neighbor lookup instead of O(E) edge scanning.

```typescript
const adj = buildAdjacencyList(nodes, edges)
// Map<nodeId, Set<neighborNodeIds>>

const neighbors = adj.get('node1')  // O(1) lookup
const degree = neighbors?.size      // Neighbor count
```

**Shortest Path**:
Uses BFS for unweighted graphs, returns sequence of node IDs.

```typescript
const path = getShortestPath('start', 'end', adjacency)
// ['start', 'a', 'b', 'end']
```

**Ego Network**:
Shows node and neighbors within N hops, useful for focus visualization.

**Community Detection**:
Simple greedy algorithm, not optimized for performance. Use for small graphs or pre-computed results.

### spatialHash.ts
**Purpose**: Spatial indexing for fast location queries

**Key Component**: `SpatialHashGrid` class

**How It Works**:
- Divides 2D space into square cells
- Maps nodes to cells based on position
- Queries only nearby cells instead of all nodes

**Complexity**:
- Insert: O(1)
- Query: O(1) average, O(N) worst case
- Build: O(N)

**Usage in Physics Engine**:
Reduces repulsion force calculation from O(N²) to O(N log N).

```typescript
const grid = new SpatialHashGrid(500)  // 500px cells
grid.build(nodes)

const nearby = grid.getNearby(x, y, radius)  // O(log N) instead of O(N)
```

**Parameters**:
- Cell size: Larger cells = fewer cells to check, more nodes per cell
- Query radius: Usually set to repulsionRadius in physics params

### convexHull.ts
**Purpose**: Compute convex hull for grouping visualization

**Key Functions**:
- `computeConvexHull(points): hullPoints` - Graham scan algorithm
- `expandHull(hull, padding): expandedHull` - Add padding around hull
- `isPointInHull(point, hull): boolean` - Point-in-polygon test

**Used For**:
- Drawing grouping boundaries
- Checking if node is in group visualization
- Creating grouping container shapes

**Algorithm**: Graham scan O(N log N)

**Example**:
```typescript
const metaNode = {...}
const childPositions = childNodes.map(n => positions.get(n.id))
const hull = computeConvexHull(childPositions)
const expanded = expandHull(hull, 20)  // 20px padding

// Draw polygon with expanded hull points
```

### styleEvaluator.ts
**Purpose**: Evaluate rules against nodes and edges

**Key Functions**:
- `evaluateNodeRules(node, rules): appliedRules` - Check which rules match
- `evaluateEdgeRules(edge, rules): appliedRules` - Check edge rules
- `evaluateCondition(value, condition): boolean` - Single condition check

**Condition Operators**:
- `equals` / `not_equals`: String comparison
- `contains` / `not_contains`: Substring check
- `regex_match` / `regex_not_match`: Regex matching
- `exists` / `not_exists`: Attribute presence
- `empty` / `not_empty`: Empty string check

**Rule Evaluation Process**:
1. Filter rules by target (node/edge) and enabled status
2. Check each condition against node/edge data
3. Collect matching rules (highest priority first)
4. Return matched rules for action application

**Rule Actions Applied Elsewhere**:
- `apply_card_template`: Template store applies template
- `apply_edge_template`: Template store applies template
- `apply_font_template`: Template store applies template
- `add_tag`: UI adds tag to node

**Example**:
```typescript
const rules = [
  {
    id: '1',
    name: 'Highlight important',
    enabled: true,
    target: 'nodes',
    condition: { attribute: 'priority', operator: 'equals', value: 'high' },
    action: 'apply_card_template',
    actionParams: { templateId: 'important-template' }
  }
]

const matchedRules = evaluateNodeRules(node, rules)
// Returns rules where condition matches
```

### bubbleSets.ts
**Purpose**: Create bubble set visualization for grouping

**Key Functions**:
- `createBubbleSet(nodes, edges): outline` - Compute bubble outline
- `interpolateBubbleSetOutline(outline): smoothedOutline` - Smooth the shape

**Used For**:
- Visualizing grouping boundaries with organic bubble shape
- Alternative to convex hull (softer appearance)

**Algorithm**: Based on bubble set research by Speckmann et al.

### multiValueParser.ts
**Purpose**: Parse CSV cells with multiple values

**Key Functions**:
- `parseMultiValue(text): values[]` - Parse semicolon/comma separated values

**Separators Recognized**:
- Semicolon (;) - Primary
- Comma (,) - Secondary
- Whitespace trimmed

**Usage**:
In data processor when reading attribute columns with multiple values.

```typescript
parseMultiValue('value1; value2; value3')
// Returns ['value1', 'value2', 'value3']
```

### projectIO.ts
**Purpose**: Save and load complete RaptorGraph projects

**Key Functions**:
- `saveProjectToFile(project, filename): void` - Export to JSON file
- `loadProjectFromFile(file): project` - Import from JSON file
- `compressProject(project): compressed` - Size optimization
- `decompressProject(compressed): project` - Decompress

**Project Format**:
```typescript
interface ProjectState {
  version: string
  name: string
  description?: string
  csvFiles: CSVFile[]
  nodes: GraphNode[]
  edges: GraphEdge[]
  cardTemplates: CardTemplate[]
  edgeTemplates: EdgeTemplate[]
  fontTemplates: FontTemplate[]
  styleRules: StyleRule[]
  layoutConfig: LayoutConfig
  groupingConfig?: GroupingConfig
  metaNodes?: MetaNode[]
  timestamps: { createdAt, modifiedAt }
}
```

**Compression Strategies**:
- Removes redundant template data
- Compresses node/edge arrays
- Uses more efficient JSON representations

**Usage**:
```typescript
// Save
const project = projectStore.getState()
saveProjectToFile(project, 'my-graph.json')

// Load
const file = await selectFile()
const loaded = await loadProjectFromFile(file)
projectStore.setState(loaded)
```

### viewport.ts
**Purpose**: Canvas coordinate transformation (screen ↔ world)

**Key Class**: `Viewport`

**Transformations**:
- **Screen coords**: Mouse position on canvas (0,0 at top-left)
- **World coords**: Graph space coordinates (0,0 at center typically)

**Key Methods**:
- `screenToWorld(screenX, screenY): {worldX, worldY}` - Convert screen to graph
- `worldToScreen(worldX, worldY): {screenX, screenY}` - Convert graph to screen
- `zoom(factor)` - Scale view
- `pan(dx, dy)` - Move view
- `getTransform()` - Current viewport state

**Used For**:
- Mouse event handling (converting clicks to graph coordinates)
- Rendering (transforming world positions to screen for drawing)
- Hitbox detection (is mouse over this node?)

**Example**:
```typescript
const viewport = new Viewport(canvasElement)

// User clicks canvas at pixel (100, 150)
const worldPos = viewport.screenToWorld(100, 150)
// Now can check if click hit any node near worldPos

// Render a node at world position
const screenPos = viewport.worldToScreen(nodeX, nodeY)
canvas.drawNode(screenPos.screenX, screenPos.screenY)
```

### utils.ts
**Purpose**: General utility functions

**Functions**:
- `generateId()`: Create unique ID (UUID or simple hash)
- `debounce(fn, delay)`: Debounce function calls
- `throttle(fn, delay)`: Throttle function calls
- `deepClone(obj)`: Deep copy objects
- `mergeArrays(a, b)`: Merge without duplicates
- `calculateDistance(p1, p2)`: Euclidean distance
- `clamp(value, min, max)`: Constrain value to range
- `lerp(a, b, t)`: Linear interpolation
- `formatBytes(bytes)`: Human-readable file size
- `formatDuration(ms)`: Human-readable duration

## Data Flow Diagram

```
User Input
   |
   v
CSV File
   |
   +---> dataProcessor.ts
   |        |
   |        v
   +---> Node + Edge Arrays
            |
            +---> graphStore (persisted)
            |
            +---> grouping.ts (if enabled)
            |        |
            |        v
            |     metaNodes + visibility
            |
            +---> graph-algorithms.ts
            |        |
            |        v
            |     adjacency list, paths, etc.
            |
            +---> layouts/*
            |        |
            |        v
            |     node positions
            |
            +---> physics/forceDirected.ts (optional)
            |        |
            |        v
            |     refined positions
            |
            +---> spatialHash.ts (physics optimization)
            |
            +---> viewport.ts
                   |
                   v
            Canvas Rendering
```

## Performance Considerations

### For Large Graphs (>1000 nodes)
1. **Build adjacency list** once, reuse for queries
2. **Use spatial hashing** instead of checking all nodes
3. **Lazy evaluate rules** only for visible nodes
4. **Cache layout results** avoid recalculating

### Memory Usage
- Node/Edge arrays: ~100 bytes per node
- Adjacency list: ~50 bytes per edge
- Spatial hash grid: ~1KB per 1000 nodes
- Total: 500 nodes ≈ 100KB + CSV data

### Algorithmic Complexity
| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Build adjacency | O(N + E) | One-time cost |
| Query neighbors | O(1) average | Using adjacency list |
| Find shortest path | O(N + E) | BFS algorithm |
| Convex hull | O(N log N) | Graham scan |
| Evaluate rules | O(R * N) | R = number of rules |
| Build spatial hash | O(N log N) | Tree construction |
| Query spatial hash | O(log N) | Average case |

## Adding New Utilities

1. Create new file: `src/lib/myUtility.ts`
2. Export main functions
3. Add JSDoc comments for all public functions
4. Add TypeScript interfaces for complex types
5. Consider performance implications
6. Write usage examples in comments
7. Link from this README

## Related Documentation
- Physics algorithms: `physics/README.md`
- Layout algorithms: `layouts/README.md`
- Types: `types/index.ts`
- Data stores: `stores/README.md`

## References and Citations
- Spatial hashing: Common graphics technique
- Convex hull: Graham scan (Graham, 1972)
- Bubble sets: Speckmann et al., 2009
- Community detection: Greedy modularity optimization
- Graph algorithms: Standard computer science texts
