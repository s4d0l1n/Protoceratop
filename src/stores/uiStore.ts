import { create } from 'zustand'

/**
 * UI State Management Store - Zustand store for UI state
 *
 * Manages all transient UI state that doesn't persist between sessions:
 * - Sidebar and panel visibility
 * - Selection state (single node/meta-node or multi-select for batch operations)
 * - Viewport state (zoom and pan)
 * - Loading indicators
 * - Dark mode preference
 *
 * NOTE: This store does NOT persist to localStorage - it resets on page refresh.
 * For persistent graph data, see graphStore.ts and projectStore.ts.
 *
 * SELECTION PATTERNS:
 * - selectedNodeId/selectedMetaNodeId: mutually exclusive primary selection
 * - selectedNodeIds: multi-select Set for batch operations (arrangement tools)
 * - previousSelection: tracks last selection for undo/back navigation
 * - Clear previous selection when switching between single and multi-select
 *
 * VIEWPORT STATE:
 * - zoom: Scale factor (1.0 = 100%, 0.1-5.0 valid range)
 * - panOffset: Canvas translation in pixels
 * - zoomIn/zoomOut maintain center point of viewport during zoom
 */

interface UIState {
  // ========== SIDEBAR AND PANELS ==========
  /** Whether sidebar is collapsed (minimized) */
  sidebarCollapsed: boolean
  /** Currently active panel ID (null if none active) */
  activePanel: string | null

  // ========== SELECTION STATE ==========
  /**
   * Primary selected node ID (mutually exclusive with selectedMetaNodeId)
   * Used for displaying node details in side panel
   */
  selectedNodeId: string | null

  /**
   * Primary selected meta-node ID (mutually exclusive with selectedNodeId)
   * Used for displaying group details in side panel
   */
  selectedMetaNodeId: string | null

  /**
   * Previous selection state for implementing back/undo navigation
   * Allows goBack() to restore prior selection
   */
  previousSelection: { nodeId: string | null; metaNodeId: string | null } | null

  /**
   * Selected edges (for highlighting connections)
   * Currently not extensively used but available for edge-focused tools
   */
  selectedEdgeIds: string[]

  /**
   * Multi-selection for batch operations (e.g., arrangement tools)
   * Separate from single selection - used by ArrangementToolbar
   * Implementation note: Using Set for O(1) contains checks
   */
  selectedNodeIds: Set<string>

  // ========== FILTER STATE ==========
  /**
   * Filtered node IDs for search/filter operations
   * null = no filter active
   * Set<string> = only show these nodes (and their edges)
   */
  filteredNodeIds: Set<string> | null

  // ========== UI PREFERENCES ==========
  /** Dark mode toggle (persisted via CSS class, not localStorage) */
  darkMode: boolean

  // ========== LOADING STATE ==========
  /** Whether a long-running operation is in progress */
  isLoading: boolean
  /** User-facing message describing current operation */
  loadingMessage: string

  // ========== VIEWPORT STATE ==========
  /** Canvas zoom level (1.0 = 100%, range 0.1-5.0) */
  zoom: number
  /** Canvas pan offset in pixels {x, y} */
  panOffset: { x: number; y: number }

  // ========== LAYOUT STATE ==========
  /** Current layout algorithm type (e.g., 'bigbang', 'force', 'hierarchical') */
  currentLayout: string

  // ========== ACTIONS ==========

  /** Toggle sidebar between expanded and collapsed */
  toggleSidebar: () => void

  /** Set active panel (null to close all panels) */
  setActivePanel: (panelId: string | null) => void

  /** Select a single node and clear meta-node selection */
  setSelectedNodeId: (nodeId: string | null) => void

  /** Select a single meta-node and clear node selection */
  setSelectedMetaNodeId: (metaNodeId: string | null) => void

  /**
   * Navigate back to previous selection
   * Restores prior selectedNodeId/selectedMetaNodeId if available
   */
  goBack: () => void

  /** Set array of selected edge IDs */
  setSelectedEdgeIds: (edgeIds: string[]) => void

  /** Set multi-select node IDs (replaces current selection) */
  setSelectedNodeIds: (nodeIds: Set<string>) => void

  /**
   * Toggle node in multi-select set
   * Add if not present, remove if present
   */
  toggleNodeSelection: (nodeId: string) => void

  /** Set filter (null = no filter, show all) */
  setFilteredNodeIds: (nodeIds: Set<string> | null) => void

  /** Toggle dark mode state */
  toggleDarkMode: () => void

  /** Set loading state with optional message */
  setLoading: (isLoading: boolean, message?: string) => void

  /** Clear all selection (nodes, edges, multi-select) */
  clearSelection: () => void

  /** Set zoom level directly */
  setZoom: (zoom: number) => void

  /** Set pan offset directly */
  setPanOffset: (offset: { x: number; y: number }) => void

  /**
   * Zoom in (1.1x multiplier) while maintaining viewport center
   * Clamped to max 5.0
   */
  zoomIn: (canvasWidth: number, canvasHeight: number) => void

  /**
   * Zoom out (0.9x multiplier) while maintaining viewport center
   * Clamped to min 0.1
   */
  zoomOut: (canvasWidth: number, canvasHeight: number) => void

  /** Reset zoom to 1.0 and pan to origin */
  resetZoom: () => void

  /** Set current layout type */
  setCurrentLayout: (layout: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarCollapsed: false,
  activePanel: null,
  selectedNodeId: null,
  selectedMetaNodeId: null,
  previousSelection: null,
  selectedEdgeIds: [],
  selectedNodeIds: new Set(),
  filteredNodeIds: null,
  darkMode: true,
  isLoading: false,
  loadingMessage: '',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  currentLayout: 'bigbang',

  // Actions
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setActivePanel: (panelId) =>
    set({ activePanel: panelId }),

  setSelectedNodeId: (nodeId) =>
    set((state) => ({
      previousSelection: { nodeId: state.selectedNodeId, metaNodeId: state.selectedMetaNodeId },
      selectedNodeId: nodeId,
      selectedMetaNodeId: null
    })),

  setSelectedMetaNodeId: (metaNodeId) =>
    set((state) => ({
      previousSelection: { nodeId: state.selectedNodeId, metaNodeId: state.selectedMetaNodeId },
      selectedMetaNodeId: metaNodeId,
      selectedNodeId: null
    })),

  goBack: () =>
    set((state) => {
      if (!state.previousSelection) return state
      return {
        selectedNodeId: state.previousSelection.nodeId,
        selectedMetaNodeId: state.previousSelection.metaNodeId,
        previousSelection: null
      }
    }),

  setSelectedEdgeIds: (edgeIds) =>
    set({ selectedEdgeIds: edgeIds }),

  setSelectedNodeIds: (nodeIds) =>
    set({ selectedNodeIds: nodeIds }),

  toggleNodeSelection: (nodeId) =>
    set((state) => {
      const newSelection = new Set(state.selectedNodeIds)
      if (newSelection.has(nodeId)) {
        newSelection.delete(nodeId)
      } else {
        newSelection.add(nodeId)
      }
      return { selectedNodeIds: newSelection }
    }),

  setFilteredNodeIds: (nodeIds) =>
    set({ filteredNodeIds: nodeIds }),

  toggleDarkMode: () =>
    set((state) => ({ darkMode: !state.darkMode })),

  setLoading: (isLoading, message = '') =>
    set({ isLoading, loadingMessage: message }),

  clearSelection: () =>
    set({ selectedNodeId: null, selectedMetaNodeId: null, selectedEdgeIds: [], selectedNodeIds: new Set() }),

  setZoom: (zoom) =>
    set({ zoom }),

  setPanOffset: (offset) =>
    set({ panOffset: offset }),

  zoomIn: (canvasWidth, canvasHeight) =>
    set((state) => {
      const zoomFactor = 1.1
      const newZoom = Math.min(5, state.zoom * zoomFactor)

      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2

      const graphX = (centerX - state.panOffset.x) / state.zoom
      const graphY = (centerY - state.panOffset.y) / state.zoom

      const newPanX = centerX - graphX * newZoom
      const newPanY = centerY - graphY * newZoom

      return { zoom: newZoom, panOffset: { x: newPanX, y: newPanY } }
    }),

  zoomOut: (canvasWidth, canvasHeight) =>
    set((state) => {
      const zoomFactor = 0.9
      const newZoom = Math.max(0.1, state.zoom * zoomFactor)

      const centerX = canvasWidth / 2
      const centerY = canvasHeight / 2

      const graphX = (centerX - state.panOffset.x) / state.zoom
      const graphY = (centerY - state.panOffset.y) / state.zoom

      const newPanX = centerX - graphX * newZoom
      const newPanY = centerY - graphY * newZoom

      return { zoom: newZoom, panOffset: { x: newPanX, y: newPanY } }
    }),

  resetZoom: () =>
    set({ zoom: 1, panOffset: { x: 0, y: 0 } }),

  setCurrentLayout: (layout) =>
    set({ currentLayout: layout }),
}))
