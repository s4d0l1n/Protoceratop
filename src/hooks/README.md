# React Hooks - RaptorGraph Custom Hooks

This directory contains custom React hooks that encapsulate RaptorGraph-specific functionality. These hooks bridge React components with the core libraries and stores.

## Hook Overview

### useGraphExport.ts
**Purpose**: Export graph visualization as PNG or SVG

**Key Functions**:
- `exportAsPNG(canvas, filename?, scale?)` - High-resolution PNG export
- `exportAsSVG(canvas, filename?)` - Vector SVG export
- `exportCanvasRegion(canvas, x, y, w, h, filename?)` - Selective export
- `exportWithDimensions(canvas, filename, width, height)` - Custom size export

**Features**:
- **High-Resolution Output**: Default 2x scaling for crisp images
- **Error Handling**: Toast notifications on failure
- **Format Support**: PNG and SVG formats
- **Region Selection**: Export specific canvas area
- **Custom Dimensions**: Resize export without stretching

**Implementation Notes**:
- Creates temporary canvas for scaling operations
- Uses HTML5 Canvas API for PNG (toBlob)
- Uses SVG serialization for vector export
- Automatically triggers browser download

**Usage Example**:
```typescript
import { useGraphExport } from '@/hooks/useGraphExport'

export function ExportButton() {
  const { exportAsPNG, exportAsSVG } = useGraphExport()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  return (
    <>
      <button onClick={() => exportAsPNG(canvasRef.current, 'graph')}>
        Export PNG
      </button>
      <button onClick={() => exportAsSVG(canvasRef.current, 'graph')}>
        Export SVG
      </button>
      <canvas ref={canvasRef} />
    </>
  )
}
```

**Performance**:
- PNG creation: ~100-500ms depending on resolution
- SVG creation: ~50-200ms depending on complexity
- High scale factors (>4x) may cause memory issues

### useDataProcessor.ts
**Purpose**: Process CSV files and generate graph structure

**Key Functions**:
- `processCSVFile(csvFile): {nodes, edges, summary}` - Full CSV processing
- `validateMapping(file): {valid, errors}` - Check mapping configuration
- `mergeMultipleCSVs(files): {nodes, edges}` - Combine multiple CSV files
- `updateNodeAttributes(nodeId, attributes)` - Modify node after import

**Features**:
- **CSV Parsing**: Handles quoted values, headers, various delimiters
- **Mapping Validation**: Verifies column roles and required columns
- **Stub Node Creation**: Auto-creates nodes referenced but not defined
- **Attribute Merging**: Combines attributes from multiple rows/files
- **Error Reporting**: Detailed error messages for invalid data

**CSV Import Process**:
1. User selects CSV file
2. Component calls parseCSV() to preview
3. User maps columns to roles (node_id, attribute, link_to, etc.)
4. useDataProcessor processes mapping
5. Nodes and edges generated
6. Added to graph via graphStore

**Column Roles**:
```
node_id    -> Creates or identifies nodes
attribute  -> Becomes node.attributes[name]
link_to    -> Creates edges to nodes with matching attribute
timestamp  -> node.timestamp for timeline layout
ignore     -> Column skipped entirely
```

**Error Handling**:
- No node_id column: Error (required)
- Invalid mapping: Logged with suggestions
- Malformed CSV: Parser tries recovery
- Encoding issues: Assumes UTF-8

**Example Usage**:
```typescript
import { useDataProcessor } from '@/hooks/useDataProcessor'

export function UploadPanel() {
  const { processCSVFile, validateMapping } = useDataProcessor()

  const handleUpload = (csvFile) => {
    const { nodes, edges, summary } = processCSVFile(csvFile)
    console.log(`Created ${nodes.length} nodes, ${edges.length} edges`)
  }

  return (
    <input type="file" accept=".csv" onChange={e => {
      const file = e.target.files?.[0]
      if (file) handleUpload(file)
    }} />
  )
}
```

### useProjectIO.ts
**Purpose**: Save and load RaptorGraph projects

**Key Functions**:
- `saveProject(project, filename)` - Export project to JSON file
- `loadProject(file)` - Import project from JSON file
- `exportData(format)` - Export nodes/edges in specific format (CSV, JSON)
- `getProjectStats()` - Get project summary (node count, edges, etc.)

**Project Contents**:
```typescript
{
  version: "1.0.0",
  name: "My Graph",
  description: "...",
  csvFiles: [...],        // Original CSV uploads
  nodes: [...],
  edges: [...],
  cardTemplates: [...],   // Visual styling
  edgeTemplates: [...],
  fontTemplates: [...],
  styleRules: [...],      // Conditional formatting
  layoutConfig: {...},    // Current layout settings
  groupingConfig: {...},  // Grouping configuration
  metaNodes: [...]        // Group structure
}
```

**Save Process**:
1. Gather state from all stores
2. Create ProjectState object
3. JSON serialize
4. Optional compression for size
5. Trigger download
6. Notify user with stats

**Load Process**:
1. User selects JSON file
2. Parse and validate structure
3. Check version compatibility
4. Restore all stores
5. Reset viewport and selection
6. Load layout and render

**File Format**:
- `.raptorgraph` or `.json`
- Uncompressed: 100KB-10MB depending on graph size
- Compressed: 20-50% of original

**Storage Limits**:
- Browser localStorage: 5-10MB
- File download: Unlimited
- Memory: Limited by browser RAM

**Example Usage**:
```typescript
import { useProjectIO } from '@/hooks/useProjectIO'

export function FileMenu() {
  const { saveProject, loadProject } = useProjectIO()
  const projectStore = useProjectStore()

  return (
    <>
      <button onClick={() => saveProject(projectStore.getState(), 'my-graph')}>
        Save Project
      </button>
      <input type="file" accept=".raptorgraph,.json"
        onChange={e => loadProject(e.target.files?.[0])} />
    </>
  )
}
```

### useKeyboardShortcuts.ts
**Purpose**: Register and handle keyboard shortcuts

**Key Features**:
- **Global Shortcuts**: Registered at app level
- **Contextual Shortcuts**: Different shortcuts in different panels
- **Conflict Detection**: Warns about duplicate shortcuts
- **Customizable**: User can modify shortcuts in settings
- **Accessibility**: Shows help overlay

**Built-in Shortcuts**:
| Key | Action | Context |
|-----|--------|---------|
| Ctrl+S | Save project | Global |
| Ctrl+O | Open project | Global |
| Ctrl+Z | Undo | Global (if supported) |
| Ctrl+Y | Redo | Global (if supported) |
| Ctrl+F | Search/Filter | Global |
| Ctrl+Plus | Zoom in | Canvas |
| Ctrl+Minus | Zoom out | Canvas |
| Ctrl+0 | Reset zoom | Canvas |
| Delete | Delete node | With selection |
| Esc | Clear selection | Global |
| ? | Show help | Global |

**Implementation Pattern**:
```typescript
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export function MyComponent() {
  useKeyboardShortcuts({
    'Ctrl+A': () => selectAll(),
    'Ctrl+D': () => deleteSelected(),
    'Escape': () => clearSelection()
  })

  return <div>...</div>
}
```

**Event Handling**:
- Prevents default browser behavior for custom shortcuts
- Checks if focus is on input (ignores shortcuts in text fields)
- Stops propagation to prevent double-triggering
- Only active when component mounted

**Conflict Resolution**:
- Later registrations override earlier ones
- Component-level shortcuts supersede global
- Panel-level shortcuts override background

**Custom Shortcuts**:
```typescript
// In settings store
const shortcuts = {
  'export': 'Ctrl+E',
  'layout_switch': 'Ctrl+L'
  // User can modify these
}
```

## Hook Patterns and Best Practices

### Dependency Management
```typescript
// BAD: Recreates function on every render
export function MyComponent() {
  const { exportAsPNG } = useGraphExport()
  return <button onClick={() => exportAsPNG(canvas, 'file')}>Export</button>
}

// GOOD: Callback wrapped in useCallback
export function MyComponent() {
  const { exportAsPNG } = useGraphExport()
  const handleExport = useCallback(() => {
    exportAsPNG(canvasRef.current, 'file')
  }, [exportAsPNG])
  return <button onClick={handleExport}>Export</button>
}
```

### Error Handling
```typescript
// Hooks provide error handling internally
// Components receive results via return values or state
const { exportAsPNG } = useGraphExport()

// This function handles errors internally
await exportAsPNG(canvas, 'file')
// Toast notifications shown on failure automatically
```

### Memory Management
```typescript
// Cleanup on unmount if needed
useEffect(() => {
  const unsubscribe = setupListener()
  return () => unsubscribe()  // Cleanup
}, [])
```

## Integration with Stores

All hooks integrate with Zustand stores:

```
Component
   |
   v
Hook (useGraphExport, useDataProcessor, etc.)
   |
   +---> Store State (useGraphStore, etc.)
   |
   v
Result / Side Effect
```

**Example Data Flow**:
```typescript
// 1. User clicks upload
<input onChange={handleFileSelect} />

// 2. Hook processes CSV
const { nodes, edges } = useDataProcessor().processCSVFile(csvFile)

// 3. Updates store
const { mergeNodes, mergeEdges } = useGraphStore()
mergeNodes(nodes)
mergeEdges(edges)

// 4. Component re-renders with new data
const { nodes, edges } = useGraphStore()  // Now updated
```

## Performance Considerations

### Heavy Operations
- **CSV Processing**: 50-500ms for large files (100k+ rows)
- **PNG Export**: 100-500ms depending on canvas size
- **Project Save**: 100-200ms for large projects
- **Project Load**: 200-500ms including store restoration

### Optimization Strategies
1. **Debounce exports**: Don't trigger on every state change
2. **Lazy process CSVs**: Process in background or chunks
3. **Stream large projects**: Process large files in chunks
4. **Cache results**: Memoize expensive calculations

### Memory Impact
- CSV processing: Temporary arrays, freed after processing
- Exports: Creates temporary canvas, freed after blob creation
- Projects: Stored in memory as JSON, optimize before saving

## Error Scenarios

### CSV Processing
- **Missing node_id**: Error message, can't create graph
- **Encoding issues**: Attempts UTF-8 recovery
- **Invalid delimiters**: Assumes comma/semicolon
- **Empty file**: Warning, creates empty graph

### Exports
- **No canvas**: Error toast
- **Memory exceeded**: Reduce scale factor
- **Unsupported format**: Falls back to PNG

### Project Load
- **Corrupted file**: Validation error
- **Version mismatch**: Warning, attempts compatibility
- **Missing dependencies**: Falls back to defaults

## Testing

Example test patterns:
```typescript
// Test CSV processing
it('should process CSV file correctly', () => {
  const csvFile = { /* mock */ }
  const { nodes, edges } = processCSVFile(csvFile)
  expect(nodes).toHaveLength(5)
  expect(edges).toHaveLength(3)
})

// Test export
it('should export as PNG', async () => {
  const canvas = document.createElement('canvas')
  await exportAsPNG(canvas, 'test')
  // Check if download triggered
})
```

## Creating New Hooks

1. Create file: `src/hooks/useMyHook.ts`
2. Follow React hooks rules (only call in components)
3. Use custom naming pattern: `useXxx`
4. Export from this README
5. Add type definitions
6. Document with JSDoc

**Template**:
```typescript
import { useCallback, useState } from 'react'

/**
 * Custom hook for [purpose]
 *
 * @example
 * const { action } = useMyHook()
 * action()
 */
export function useMyHook() {
  const [state, setState] = useState(null)

  const action = useCallback(() => {
    // Implementation
  }, [])

  return { state, action }
}
```

## Related Files
- Data processing: `lib/dataProcessor.ts`
- Project IO: `lib/projectIO.ts`
- Stores: `stores/`
- Main component: `components/graph/G6Graph.tsx`
