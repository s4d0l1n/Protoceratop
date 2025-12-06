# RaptorGraph Codebase Analysis

## Summary
The RaptorGraph application is a sophisticated, client-side data visualization tool with a well-designed architecture. The data flow is robust, handling complex transformations from raw CSV data into a graph structure with features like multi-value attributes and stub-node generation. State management is cleanly separated into multiple Zustand stores. The most significant finding is that the graph visualization is not built on a third-party library like G6; it is a fully custom 2D canvas renderer with its own multi-phase force-directed physics engine and a dedicated viewport management class. This custom implementation allows for advanced, tightly integrated features like dynamic styling effects, meta-node grouping, and edge-crossing visualization.

## Key Architectural Points

- **Frameworks:** React, TypeScript, Vite, Zustand.
- **Data Flow:**
    1.  **Ingestion:** User uploads a CSV via `UploadPanel.tsx`.
    2.  **Storage:** Raw data is stored in `csvStore`.
    3.  **Processing:** `useDataProcessor.ts` and `dataProcessor.ts` transform the CSV data into a graph structure (nodes and edges), intelligently creating "stub nodes" for missing links.
    4.  **Graph State:** The final graph data is held in `graphStore`.
- **State Management (Zustand):**
    - `csvStore`: Holds raw, unprocessed CSV data.
    - `graphStore`: Holds the processed node and edge data for the graph.
    - `templateStore`: Manages user-defined templates for nodes and edges.
    - `rulesStore`: Manages conditional styling rules.
    - `uiStore`: Manages transient UI state like the active panel and selected nodes.
    - `projectStore`: Manages project-level settings, like layout configurations.
    - `settingsStore`: Manages global application settings.
    - Most stores are persisted to `localStorage`.
- **Rendering and Interaction Engine (`G6Graph.tsx`):**
    - This is a fully custom component, **not a G6.js wrapper**.
    - It implements its own `requestAnimationFrame` render loop.
    - It contains a multi-phase, force-directed physics engine for node layout.
    - It now uses the `Viewport.ts` class to manage all 2D camera transformations (pan, zoom, rotation).
    - All mouse events (`handleMouseDown`, `handleMouseMove`, `handleWheel`) are handled within this component and use `Viewport.ts` for coordinate transformations, ensuring consistency.
- **Styling Engine:**
    - Styling is highly dynamic.
    - On each render frame, `styleEvaluator.ts` is called for every node and edge.
    - This evaluator checks for matching conditional rules from `rulesStore` and applies the corresponding templates from `templateStore`.
    - This allows for complex effects like highlighting, color changes based on data, and more.

## Conclusion of Review
The codebase is well-structured and the recent refactoring to introduce the `Viewport.ts` class is consistent with the existing architecture. By centralizing all coordinate transformation logic and fixing the hit detection and minimap calculations, the primary sources of the reported bugs have been addressed. The system appears robust and the fix should hold.