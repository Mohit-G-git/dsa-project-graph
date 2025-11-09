/**
 * Check if an edge is active at given time
 */
function isEdgeActive(edge, time) {
  return time >= edge.time && time <= (edge.endTime ?? Infinity);
}

/**
 * Get active edges from a node at given time
 */
function getActiveEdges(graph, node, time) {
  return graph.edges.filter((e) => e.source === node && isEdgeActive(e, time));
}

/**
 * Temporal BFS
 */
export function temporalBFS(graph, startNode, time) {
  const visited = new Set([startNode]);
  const queue = [startNode];
  const traversal = [];
  const activeEdges = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    traversal.push(current);

    // Get active edges from this node
    const edges = getActiveEdges(graph, current, time);
    for (const edge of edges) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
        activeEdges.add(edge.source + "-" + edge.target);
      }
    }
  }

  return {
    nodes: Array.from(visited),
    edges: Array.from(activeEdges),
    order: traversal,
  };
}

/**
 * Temporal DFS
 */
export function temporalDFS(graph, startNode, time) {
  const visited = new Set();
  const traversal = [];
  const activeEdges = new Set();

  function dfs(node) {
    visited.add(node);
    traversal.push(node);

    const edges = getActiveEdges(graph, node, time);
    for (const edge of edges) {
      if (!visited.has(edge.target)) {
        activeEdges.add(edge.source + "-" + edge.target);
        dfs(edge.target);
      }
    }
  }

  dfs(startNode);

  return {
    nodes: Array.from(visited),
    edges: Array.from(activeEdges),
    order: traversal,
  };
}
