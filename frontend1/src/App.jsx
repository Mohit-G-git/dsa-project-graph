import React, { useEffect, useState, useCallback } from "react";
import GraphView from "./components/GraphView.jsx";
import Controls from "./components/Controls.jsx";
import * as api from "./services/api.js";
import { temporalBFS, temporalDFS } from "./services/algorithms.js";

export default function App() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [log, setLog] = useState("");
  const [wasmReady, setWasmReady] = useState(false);
  const [traversal, setTraversal] = useState(null);

  useEffect(() => {
    api.initWasm()
      .then(ok => {
        setWasmReady(ok);
        if (ok) setLog(l => (l ? l + "\n" : "") + "WASM module loaded.");
      })
      .catch(err => {
        setLog(l => (l ? l + "\n" : "") + "WASM init failed: " + (err && err.message ? err.message : err));
      });
  }, []);

  const loadFromBackend = useCallback(async () => {
    setLog("Fetching graph from backend...");
    try {
      const g = await api.fetchGraph();
      if (!g) {
        setLog("Backend did not return graph JSON.");
        return;
      }
      setGraph({
        nodes: Array.isArray(g.nodes) ? g.nodes.map(n => (typeof n === "string" ? { id: n, label: n } : n)) : [],
        edges: Array.isArray(g.edges) ? g.edges : []
      });
      setLog("Graph loaded from backend.");
    } catch (err) {
      setLog("Error fetching backend graph: " + (err.message || err));
    }
  }, []);

  const addNode = useCallback((id) => {
    if (!id) return;
    setGraph(g => {
      if (g.nodes.find(n => n.id === id)) return g;
      return { ...g, nodes: [...g.nodes, { id, label: id }] };
    });
  }, []);

  const addEdge = useCallback((src, dst, weight, startTime, endTime) => {
    if (!src || !dst) return;
    setGraph(g => {
      const exists = g.edges.find(e =>
        e.source === src && e.target === dst &&
        (typeof weight === 'undefined' ? true : e.weight === weight) &&
        (typeof startTime === 'undefined' ? true : ((e.time === startTime) || (e.startTime === startTime))) &&
        (typeof endTime === 'undefined' ? true : e.endTime === endTime)
      );
      if (exists) return g;
      const edge = { source: src, target: dst };
      if (typeof weight !== 'undefined') edge.weight = weight;
      if (typeof startTime !== 'undefined') { edge.time = startTime; edge.startTime = startTime; }
      if (typeof endTime !== 'undefined') edge.endTime = endTime;

      // ensure nodes exist so edges are visible in the graph
      const nodes = [...g.nodes];
      if (!nodes.find(n => n.id === src)) nodes.push({ id: src, label: src });
      if (!nodes.find(n => n.id === dst)) nodes.push({ id: dst, label: dst });

      return { ...g, nodes, edges: [...g.edges, edge] };
    });
  }, []);

  const loadJson = useCallback((obj) => {
    if (!obj) return;
    const nodes = Array.isArray(obj.nodes) ? obj.nodes.map(n => typeof n === "string" ? { id: n, label: n } : n) : [];
    const edges = Array.isArray(obj.edges) ? obj.edges : [];
    setGraph({ nodes, edges });
    setLog("Graph loaded from file.");
  }, []);

  const runBFS = useCallback(async (start, time = 0, mode = 'bfs') => {
    if (!start) {
      setLog("Please enter a start node");
      return;
    }
    if (!graph.nodes.find(n => n.id === start)) {
      setLog(`Start node "${start}" not found in graph`);
      return;
    }

    setLog(`Running ${mode.toUpperCase()}...`);
    try {
      // Try backend first
      try {
        const res = await api.runBFS({ start, startTime: time, graph });
        setTraversal({
          nodes: new Set(res.order || []),
          edges: new Set(),
          order: res.order || []
        });
        setLog(`${mode.toUpperCase()} result: ` + JSON.stringify(res));
        return;
      } catch (err) {
        // Fall back to local implementation
      }

      // Local temporal traversal
      const result = mode === 'dfs' 
        ? temporalDFS(graph, start, time)
        : temporalBFS(graph, start, time);

      setTraversal({
        nodes: new Set(result.nodes),
        edges: new Set(result.edges),
        order: result.order
      });

      setLog(
        `${mode.toUpperCase()} at time ${time}:\n` +
        `Visited ${result.nodes.length} nodes in order: ${result.order.join(' → ')}`
      );
    } catch (err) {
      setLog(`${mode.toUpperCase()} error: ` + (err.message || err));
      setTraversal(null);
    }
  }, [graph]);

  return (
    <div className="app">
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>DSA Graph Frontend</h1>
          <p>Interface to visualize and run algorithms on your backend temporal graph.</p>
        </div>
        <div>
          <button className="button" onClick={loadFromBackend}>Load from backend</button>
        </div>
      </header>

      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <div style={{ flex: 1 }}>
          <GraphView 
            nodes={graph.nodes} 
            edges={graph.edges}
            highlightedNodes={traversal?.nodes ?? new Set()}
            highlightedEdges={traversal?.edges ?? new Set()}
            traversalOrder={traversal?.order ?? []}
          />
        </div>

        <aside style={{ width: 340 }}>
          <Controls
            onAddNode={addNode}
            onAddEdge={addEdge}
            onLoadJson={loadJson}
            onRunBFS={runBFS}
          />

          <div className="card" style={{ marginTop: 12 }}>
            <h3>Status</h3>
            <p style={{ color: "var(--muted)", margin: 0 }}>WASM loaded: {wasmReady ? "yes" : "no"}</p>
            <pre style={{ whiteSpace: "pre-wrap", marginTop: 8, color: "var(--muted)" }}>{log}</pre>
          </div>
        </aside>
      </div>
    </div>
  );
}
