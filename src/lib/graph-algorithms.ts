/**
 * Finds the shortest path between two nodes in a graph using Breadth-First Search (BFS).
 * Assumes an unweighted graph.
 *
 * @param startNodeId The ID of the starting node.
 * @param endNodeId The ID of the ending node.
 * @param nodes The array of all nodes in the graph.
 * @param edges The array of all edges in the graph.
 * @returns An array of edge IDs representing the shortest path, or an empty array if no path is found.
 */
export function findShortestPath(
  startNodeId: string,
  endNodeId: string,
  nodes: { id: string }[],
  edges: { id: string; source: string; target: string }[]
): string[] {
  if (startNodeId === endNodeId) {
    return [];
  }

  // Build adjacency list
  const adj = new Map<string, { nodeId: string; edgeId: string }[]>();
  edges.forEach(edge => {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    if (!adj.has(edge.target)) adj.set(edge.target, []);
    adj.get(edge.source)!.push({ nodeId: edge.target, edgeId: edge.id });
    adj.get(edge.target)!.push({ nodeId: edge.source, edgeId: edge.id });
  });

  const queue: string[] = [startNodeId];
  const visited = new Set<string>([startNodeId]);
  // `predecessor` stores how we reached a node: predecessor[node] = {fromNodeId, viaEdgeId}
  const predecessor = new Map<string, { nodeId: string; edgeId: string }>();

  while (queue.length > 0) {
    const currentNodeId = queue.shift()!;

    if (currentNodeId === endNodeId) {
      // Path found, reconstruct it by backtracking
      const pathEdgeIds: string[] = [];
      let curr = endNodeId;
      while (curr !== startNodeId) {
        const pred = predecessor.get(curr);
        if (!pred) {
          // Should not happen if path is found
          return [];
        }
        pathEdgeIds.push(pred.edgeId);
        curr = pred.nodeId;
      }
      return pathEdgeIds.reverse();
    }

    for (const neighbor of (adj.get(currentNodeId) || [])) {
      if (!visited.has(neighbor.nodeId)) {
        visited.add(neighbor.nodeId);
        predecessor.set(neighbor.nodeId, { nodeId: currentNodeId, edgeId: neighbor.edgeId });
        queue.push(neighbor.nodeId);
      }
    }
  }

  return []; // No path found
}
