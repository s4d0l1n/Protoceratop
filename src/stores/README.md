# RaptorGraph Stores (Zustand State Management)

This directory contains all Zustand-based state management stores for RaptorGraph. Each store manages a specific domain of application state.

## Store Overview

### graphStore.ts
**Purpose**: Core graph data management
**Persists**: Yes (localStorage key: 'raptorgraph-graph-storage')

Manages the complete graph representation:
- **Nodes**: Graph vertices with attributes, tags, and metadata
- **Edges**: Connections between nodes
- **MetaNodes**: Virtual grouping nodes for hierarchical organization
- **PhysicsModifiers**: Legacy parameters (mostly unused)

**Key Features**:
- Automatic edge cleanup when nodes are removed
- Smart node merging with conflict resolution when loading additional CSVs
- Meta-node collapse/expand for grouping
- Query methods for retrieving nodes, edges, and relationships

**Usage**:
```typescript
import { useGraphStore } from '@/stores/graphStore'

const { nodes, edges, addNode, removeNode, getConnectedEdges } = useGraphStore()
```

### uiStore.ts
**Purpose**: Transient UI state management
**Persists**: No (resets on page refresh)

Manages all UI-related state:
- **Selection**: Primary selection (node/meta-node), multi-select, edge selection
- **Viewport**: Zoom and pan state
- **Navigation**: Active panel, sidebar collapse, previous selection for back navigation
- **Preferences**: Dark mode toggle
- **Loading**: Loading indicators with messages

**Key Features**:
- Mutually exclusive primary selection (cannot select both node and meta-node)
- Multi-select support for batch operations (e.g., arrangement tools)
- Previous selection tracking for undo/back navigation
- Zoom maintains viewport center during zoom operations
- Filter support for search/filter operations

**Usage**:
```typescript
import { useUIStore } from '@/stores/uiStore'

const { selectedNodeId, setSelectedNodeId, zoom, zoomIn } = useUIStore()
```

**Selection Patterns**:
- **Single Selection**: `selectedNodeId` or `selectedMetaNodeId` (mutually exclusive)
- **Multi-Select**: `selectedNodeIds` (Set for batch operations)
- **History**: `previousSelection` (for back navigation)

### projectStore.ts
**Purpose**: Project-level metadata and configuration
**Persists**: Yes (via localStorage)

Manages project state:
- Project name and description
- Layout configuration
- Creation/modification timestamps
- Save/load operations

**Usage**:
```typescript
import { useProjectStore } from '@/stores/projectStore'

const { layoutConfig, setLayoutConfig, saveProject } = useProjectStore()
```

### templateStore.ts
**Purpose**: Visual template management
**Persists**: Yes (via localStorage)

Manages visual styling templates:
- **Card Templates**: Node styling (shape, color, icon, size)
- **Edge Templates**: Edge styling (color, width, line type, arrows)
- **Font Templates**: Text styling (font, size, color, effects)
- Default templates for each category

**Features**:
- Template creation, update, deletion
- Default template designation
- Template retrieval by ID
- Visual effects support (shadow, glow, pulse, RGB cycle)

**Usage**:
```typescript
import { useTemplateStore } from '@/stores/templateStore'

const { cardTemplates, getCardTemplateById, addCardTemplate } = useTemplateStore()
```

### rulesStore.ts
**Purpose**: Conditional styling rules
**Persists**: Yes (via localStorage)

Manages style rules for conditional formatting:
- Rule conditions (attribute matching with various operators)
- Rule actions (apply template, add tag, etc.)
- Rule priority and enable/disable

**Operators Supported**:
- equals, not_equals
- contains, not_contains
- regex_match, regex_not_match
- exists, not_exists
- empty, not_empty

**Usage**:
```typescript
import { useRulesStore } from '@/stores/rulesStore'

const { styleRules, getEnabledRules, addRule } = useRulesStore()
```

### csvStore.ts
**Purpose**: CSV file upload and mapping management
**Persists**: Yes (full CSV data + mappings persisted)

Manages CSV files and their column mappings:
- Uploaded CSV files with raw data and parsed content
- Column mappings (roles: node_id, attribute, link_to, timestamp, ignore)
- CSV parsing and metadata

**Column Roles**:
- `node_id`: Identifies nodes (can have multiple per file)
- `attribute`: Node attributes (with optional custom name)
- `link_to`: Creates edges to nodes with matching attribute
- `timestamp`: Timeline layout support
- `ignore`: Columns to skip

**Usage**:
```typescript
import { useCSVStore } from '@/stores/csvStore'

const { csvFiles, addCSVFile, updateMapping } = useCSVStore()
```

### settingsStore.ts
**Purpose**: Application-wide settings
**Persists**: Yes (via localStorage)

Manages user preferences:
- Physics simulation parameters
- UI preferences
- Performance settings
- Default behaviors

**Usage**:
```typescript
import { useSettingsStore } from '@/stores/settingsStore'

const { settings, updateSettings } = useSettingsStore()
```

## Store Architecture Patterns

### Data Flow
```
CSV Input
    |
    v
csvStore (raw data + mappings)
    |
    v
dataProcessor (processes CSV via hooks)
    |
    v
graphStore (nodes + edges created)
    |
    v
G6Graph component (renders visualization)
    |
    v
uiStore (manages viewport, selection, panels)
```

### Persistence Strategy

**Persistent Stores** (survive page refresh):
- graphStore: Graph structure and data
- projectStore: Project metadata
- templateStore: Visual templates
- rulesStore: Style rules
- csvStore: Uploaded files and mappings
- settingsStore: User preferences

**Transient Store** (resets on refresh):
- uiStore: UI state only (selection, viewport, panels)

All persistent stores use Zustand's `persist` middleware with localStorage.

## Common Patterns

### Creating a Store
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useMyStore = create<MyState>()(
  persist(
    (set, get) => ({
      // Initial state
      data: [],

      // Actions
      addData: (item) => set((state) => ({
        data: [...state.data, item]
      })),

      // Queries
      getItem: (id) => get().data.find(d => d.id === id)
    }),
    {
      name: 'raptorgraph-my-storage'
    }
  )
)
```

### Using Stores in Components
```typescript
import { useGraphStore } from '@/stores/graphStore'
import { useUIStore } from '@/stores/uiStore'

export function MyComponent() {
  // Use multiple stores
  const { nodes, edges } = useGraphStore()
  const { selectedNodeId, setSelectedNodeId } = useUIStore()

  return (
    <div>
      {nodes.map(node => (
        <div key={node.id} onClick={() => setSelectedNodeId(node.id)}>
          {node.label}
        </div>
      ))}
    </div>
  )
}
```

## Performance Considerations

### Avoiding Unnecessary Re-renders
1. **Extract only needed properties** before passing to child components
2. **Use callbacks** to prevent inline function recreation
3. **Zustand subscriptions** don't cause external re-renders (unlike Redux)

### State Update Best Practices
1. **Immutable updates**: Always create new objects/arrays
2. **Batch operations**: Use merge functions (mergeNodes) instead of multiple setNode calls
3. **Query methods**: Use store queries instead of filtering in components

## Storage Limits

LocalStorage has a 5-10MB limit per domain. Large graphs with many nodes, edges, and CSV data may exceed this. Monitor console warnings for storage quota issues.

## Development Notes

- Stores are NOT type-safe across components (TypeScript helps but relies on correct import)
- No middleware validation - invalid states can corrupt stored data
- Prefer using store methods over direct state mutations
- Consider the impact of persistence when adding large new state properties
