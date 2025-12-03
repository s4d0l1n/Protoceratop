import { create } from 'zustand'

/**
 * UI state management store
 * Handles sidebar, panels, selected nodes, and UI preferences
 */

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean
  activePanel: string | null

  // Selection state
  selectedNodeId: string | null
  selectedMetaNodeId: string | null
  previousSelection: { nodeId: string | null; metaNodeId: string | null } | null
  selectedEdgeIds: string[]
  selectedNodeIds: Set<string> // Multi-selection for arrangement tools

  // Filter state
  filteredNodeIds: Set<string> | null

  // Dark mode
  darkMode: boolean

  // Loading states
  isLoading: boolean
  loadingMessage: string

  // Zoom state
  zoom: number
  panOffset: { x: number; y: number }

  // Layout state
  currentLayout: string

  // Actions
  toggleSidebar: () => void
  setActivePanel: (panelId: string | null) => void
  setSelectedNodeId: (nodeId: string | null) => void
  setSelectedMetaNodeId: (metaNodeId: string | null) => void
  goBack: () => void
  setSelectedEdgeIds: (edgeIds: string[]) => void
  setSelectedNodeIds: (nodeIds: Set<string>) => void
  toggleNodeSelection: (nodeId: string) => void
  setFilteredNodeIds: (nodeIds: Set<string> | null) => void
  toggleDarkMode: () => void
  setLoading: (isLoading: boolean, message?: string) => void
  clearSelection: () => void
  setZoom: (zoom: number) => void
  setPanOffset: (offset: { x: number; y: number }) => void
  zoomIn: (canvasWidth: number, canvasHeight: number) => void
  zoomOut: (canvasWidth: number, canvasHeight: number) => void
  resetZoom: () => void
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
