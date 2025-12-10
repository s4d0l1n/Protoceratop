import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GraphNode, GraphEdge, MetaNode } from '@/types'

/**
 * Graph data store - Zustand store for graph state management
 *
 * Manages the complete graph representation including:
 * - Individual nodes with attributes and metadata
 * - Edges connecting nodes with relationship information
 * - Meta-nodes (groups) for visual hierarchical organization
 * - Physics parameters for force-directed layout simulation
 *
 * PERSISTENCE: All data is persisted to localStorage via Zustand's persist middleware,
 * allowing graphs to survive page refreshes. The storage key is 'raptorgraph-graph-storage'.
 *
 * PERFORMANCE: This store intentionally avoids selectors to prevent unnecessary re-renders.
 * Components should extract only needed data before passing to children.
 *
 * RELATIONSHIPS:
 * - Nodes contain unique IDs, labels, attributes (from CSV), and tags
 * - Edges reference source/target node IDs and can have templates applied
 * - MetaNodes are virtual grouping nodes that contain child node IDs
 * - When a node is removed, connected edges are automatically cleaned up
 */

export interface PhysicsModifiers {
  /** Ideal edge length for spring forces (not currently used in physics engine) */
  edgeLength: number
  /** Spring strength multiplier (not currently used in physics engine) */
  springStrength: number
  /** Gravity toward center of canvas (0-1 range) */
  centerGravity: number
}

interface GraphState {
  // ========== GRAPH DATA STATE ==========
  /**
   * Array of all nodes in the graph
   * Each node has unique ID, label, attributes from CSV, and metadata
   */
  nodes: GraphNode[]

  /**
   * Array of all edges (connections) in the graph
   * Each edge references source and target node IDs
   */
  edges: GraphEdge[]

  /**
   * Virtual grouping nodes for hierarchical visualization
   * MetaNodes can be nested and collapsed to hide children
   */
  metaNodes: MetaNode[]

  /**
   * Physics simulation parameters (currently mostly for legacy support)
   * Active physics configuration is in PhysicsPanel and component state
   */
  physicsModifiers: PhysicsModifiers

  // ========== ACTIONS ==========

  /** Update physics parameters (legacy - currently unused) */
  setPhysicsModifiers: (modifiers: Partial<PhysicsModifiers>) => void

  /** Replace entire node array (used when loading new graph) */
  setNodes: (nodes: GraphNode[]) => void

  /** Replace entire edge array (used when loading new graph) */
  setEdges: (edges: GraphEdge[]) => void

  /** Add a single node to the graph */
  addNode: (node: GraphNode) => void

  /** Add a single edge to the graph */
  addEdge: (edge: GraphEdge) => void

  /** Update node properties (shallow merge with existing data) */
  updateNode: (nodeId: string, updates: Partial<GraphNode>) => void

  /** Update edge properties (shallow merge with existing data) */
  updateEdge: (edgeId: string, updates: Partial<GraphEdge>) => void

  /** Remove a node and all edges connected to it */
  removeNode: (nodeId: string) => void

  /** Remove a single edge */
  removeEdge: (edgeId: string) => void

  /** Clear entire graph (all nodes, edges, and meta-nodes) */
  clearGraph: () => void

  /** Query: Get node by ID (returns undefined if not found) */
  getNodeById: (nodeId: string) => GraphNode | undefined

  /** Query: Get edge by ID (returns undefined if not found) */
  getEdgeById: (edgeId: string) => GraphEdge | undefined

  /**
   * Query: Get all edges connected to a node
   * Includes both incoming and outgoing edges
   */
  getConnectedEdges: (nodeId: string) => GraphEdge[]

  /**
   * Merge nodes into existing graph with smart conflict resolution
   * - Existing nodes: merge attributes, combine tags, promote stubs
   * - New nodes: add directly to graph
   * Used when loading additional CSV files
   */
  mergeNodes: (nodes: GraphNode[]) => void

  /**
   * Merge edges into existing graph
   * - Only adds edges with new IDs (avoids duplicates)
   * Used when loading additional CSV files
   */
  mergeEdges: (edges: GraphEdge[]) => void

  // ========== META-NODE ACTIONS ==========

  /** Replace entire meta-node array (used during grouping operations) */
  setMetaNodes: (metaNodes: MetaNode[]) => void

  /**
   * Toggle collapse state of a meta-node
   * When collapsed, children are hidden from visualization
   */
  toggleMetaNodeCollapse: (metaNodeId: string) => void

  /** Query: Get meta-node by ID (returns undefined if not found) */
  getMetaNodeById: (metaNodeId: string) => MetaNode | undefined
}

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  metaNodes: [],
  physicsModifiers: {
    edgeLength: 0,
    springStrength: 0,
    centerGravity: 0,
  },

  // Actions
  setPhysicsModifiers: (modifiers) =>
    set((state) => ({
      physicsModifiers: { ...state.physicsModifiers, ...modifiers },
    })),
  setNodes: (nodes) =>
    set({ nodes }),

  setEdges: (edges) =>
    set({ edges }),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  addEdge: (edge) =>
    set((state) => ({
      edges: [...state.edges, edge],
    })),

  updateNode: (nodeId, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
    })),

  updateEdge: (edgeId, updates) =>
    set((state) => ({
      edges: state.edges.map((e) =>
        e.id === edgeId ? { ...e, ...updates } : e
      ),
    })),

  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    })),

  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    })),

  clearGraph: () =>
    set({ nodes: [], edges: [], metaNodes: [] }),

  getNodeById: (nodeId) =>
    get().nodes.find((n) => n.id === nodeId),

  getEdgeById: (edgeId) =>
    get().edges.find((e) => e.id === edgeId),

  getConnectedEdges: (nodeId) =>
    get().edges.filter((e) => e.source === nodeId || e.target === nodeId),

  mergeNodes: (newNodes) =>
    set((state) => {
      const existingIds = new Set(state.nodes.map((n) => n.id))
      const nodesToAdd = newNodes.filter((n) => !existingIds.has(n.id))
      const nodesToUpdate = newNodes.filter((n) => existingIds.has(n.id))

      const updatedNodes = state.nodes.map((existing) => {
        const update = nodesToUpdate.find((n) => n.id === existing.id)
        if (update) {
          // Merge attributes and promote stub nodes
          return {
            ...existing,
            ...update,
            attributes: { ...existing.attributes, ...update.attributes },
            tags: Array.from(new Set([...existing.tags, ...update.tags])),
            sourceFiles: Array.from(new Set([...existing.sourceFiles, ...update.sourceFiles])),
            isStub: update.isStub === false ? false : existing.isStub,
          }
        }
        return existing
      })

      return {
        nodes: [...updatedNodes, ...nodesToAdd],
      }
    }),

  mergeEdges: (newEdges) =>
    set((state) => {
      const existingIds = new Set(state.edges.map((e) => e.id))
      const edgesToAdd = newEdges.filter((e) => !existingIds.has(e.id))
      return {
        edges: [...state.edges, ...edgesToAdd],
      }
    }),

  // Meta-node actions
  setMetaNodes: (metaNodes) =>
    set({ metaNodes }),

  toggleMetaNodeCollapse: (metaNodeId) =>
    set((state) => ({
      metaNodes: state.metaNodes.map((mn) =>
        mn.id === metaNodeId ? { ...mn, collapsed: !mn.collapsed } : mn
      ),
    })),

  getMetaNodeById: (metaNodeId) =>
    get().metaNodes.find((mn) => mn.id === metaNodeId),
    }),
    {
      name: 'raptorgraph-graph-storage',
      version: 1,
    }
  )
)
