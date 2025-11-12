import React, { useState, useEffect, useRef } from "react";
import "./styles.css";

// Temporal graph visualizer for input.txt format:
// First line: numNodes numEdges maxTime
// Edge lines: src dst weight startTime endTime

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const inf = Number.MAX_SAFE_INTEGER;

export default function App() {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [positions, setPositions] = useState({});
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTime, setMaxTime] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(800);
  const [layout, setLayout] = useState("random");

  // Canvas dimensions
  const canvasWidth = 700; // Reduced from 900
  const canvasHeight = 500; // Reduced from 650
  const [selected, setSelected] = useState(null);
  const [pathResult, setPathResult] = useState(null);
  const [pathAlgo, setPathAlgo] = useState("bfs");
  const [edgeText, setEdgeText] = useState("");
  const [targetNode, setTargetNode] = useState(null);
  const [edgeWeights, setEdgeWeights] = useState({});
  const [isAutoFindPath, setIsAutoFindPath] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);

  // Generate random graph
  function generateRandomGraph(numNodes = 50, maxTime = 20) {
    const nodeList = Array.from({ length: numNodes }, (_, i) => (i + 1).toString());
    const edgeList = [];
    const weights = {};
    
    // Create edges with ~10% density for better visibility
    const edgeDensity = 0.1;
    let edgeCount = 0;
    
    for (let i = 0; i < numNodes; i++) {
      for (let j = 0; j < numNodes; j++) {
        if (i !== j && Math.random() < edgeDensity) {
          const src = nodeList[i];
          const dst = nodeList[j];
          
          // Random weight between 1 and 10
          const weight = Math.floor(Math.random() * 10) + 1;
          
          // Generate random temporal intervals where edge exists
          // Each edge appears and disappears at different times
          const times = [];
          const numIntervals = Math.floor(Math.random() * 3) + 1; // 1-3 intervals
          
          for (let interval = 0; interval < numIntervals; interval++) {
            // Random start time
            const startTime = Math.floor(Math.random() * maxTime);
            // Random duration (1-5 time units)
            const duration = Math.floor(Math.random() * 5) + 1;
            
            // Add all time points in this interval
            for (let t = startTime; t < Math.min(startTime + duration, maxTime); t++) {
              if (!times.includes(t)) {
                times.push(t);
              }
            }
          }
          
          // Sort times
          times.sort((a, b) => a - b);
          
          // Only add edge if it has at least one time point
          if (times.length > 0) {
            edgeList.push({ src, dst, times });
            weights[`${src}->${dst}`] = weight;
            edgeCount++;
          }
        }
      }
    }
    
    setNodes(nodeList);
    setEdges(edgeList);
    setEdgeWeights(weights);
    setMaxTime(maxTime);
    setCurrentTime(0);
    setPathResult(null);
    setSelected(null);
    setTargetNode(null);
    
    console.log(`Generated random graph: ${numNodes} nodes, ${edgeCount} edges with dynamic temporal behavior`);
    
    // Force layout update
    setTimeout(() => {
      setLayout((prev) => (prev === "random" ? "force" : "random"));
    }, 100);
  }

  // Load graph from input.txt or use default random graph
  useEffect(() => {
    const loadGraph = () => {
      if (!edgeText.trim()) {
        console.log("Loading default random graph with 50 nodes");
        generateRandomGraph(50, 20);
      }
    };

    loadGraph();
  }, [edgeText]); // Re-run when edgeText changes

  function parseInputAndSet(text) {
    console.log("Parsing input:", text); // Debug log
    if (!text) return;
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    console.log("Parsed lines:", lines); // Debug log
    if (lines.length === 0) return;

    // Parse header line: numNodes numEdges maxTime
    const header = lines[0].split(/\s+/).map(Number);
    console.log("Header:", header); // Debug log
    if (header.length < 3 || header.some(isNaN)) {
      console.error("Invalid header format");
      return;
    }

    const [numNodes, numEdges, maxT] = header;
    setMaxTime(maxT);

    // First collect all node numbers from edges
    const nodeSet = new Set();
    const parsedEdges = [];
    const weights = {};

    // Parse edges and collect unique nodes
    for (let i = 1; i < lines.length && parsedEdges.length < numEdges; i++) {
      const parts = lines[i].split(/\s+/);
      if (parts.length < 4) continue; // need at least src, dst, weight, one time

      const src = parts[0];
      const dst = parts[1];
      const weight = parseInt(parts[2]);
      const times = parts.slice(3).map(Number);

      if (isNaN(weight) || times.some(isNaN)) continue;
      const validTimes = times.filter((t) => t >= 0 && t <= maxT);
      if (validTimes.length === 0) continue;

      // Add nodes to set and parse edge
      nodeSet.add(src);
      nodeSet.add(dst);
      console.log(
        `Parsed edge: ${src} -> ${dst}, weight: ${weight}, times: [${validTimes}]`
      );
      parsedEdges.push({ src, dst, times: validTimes });
      weights[`${src}->${dst}`] = weight;
    }

    // Create final node list, ensuring numbers 1 through numNodes are included
    const finalNodeSet = new Set(
      [...Array(numNodes)].map((_, i) => (i + 1).toString())
    );
    nodeSet.forEach((n) => finalNodeSet.add(n));

    // Convert to sorted array
    const nodeList = Array.from(finalNodeSet).sort(
      (a, b) => parseInt(a) - parseInt(b)
    );

    setNodes(nodeList);
    setEdges(parsedEdges);
    setEdgeWeights(weights);
    console.log("Set nodes:", nodeList); // Add this
    console.log("Set edges:", parsedEdges); // Add this
    console.log("Set weights:", weights); // Add this

    // Force a layout update - Add this block
    setTimeout(() => {
      setLayout((prev) => (prev === "random" ? "force" : "random"));
    }, 100);
  }

  function generatePositions(nodeList, mode) {
    const canvas = canvasRef.current;
    const w = canvas ? canvas.width : 700;
    const h = canvas ? canvas.height : 500;
    const pos = {};
    if (mode === "grid") {
      const cols = Math.ceil(Math.sqrt(nodeList.length));
      const rows = Math.ceil(nodeList.length / cols);
      const cellW = (w - 80) / cols;
      const cellH = (h - 80) / rows;
      nodeList.forEach((n, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        pos[n] = {
          x: clamp(40 + col * cellW + cellW / 2, 40, w - 40),
          y: clamp(40 + row * cellH + cellH / 2, 40, h - 40),
        };
      });
    } else if (mode === "random") {
      nodeList.forEach(
        (n) =>
          (pos[n] = {
            x: 40 + Math.random() * (w - 80),
            y: 40 + Math.random() * (h - 80),
          })
      );
    } else {
      // light force: random init + few iterations of repulsion/attraction
      nodeList.forEach(
        (n) =>
          (pos[n] = {
            x: 40 + Math.random() * (w - 80),
            y: 40 + Math.random() * (h - 80),
          })
      );
      const iters = 40;
      for (let it = 0; it < iters; it++) {
        const forces = {};
        nodeList.forEach((n) => (forces[n] = { x: 0, y: 0 }));
        // repulsion
        for (let i = 0; i < nodeList.length; i++)
          for (let j = i + 1; j < nodeList.length; j++) {
            const a = nodeList[i],
              b = nodeList[j];
            const dx = pos[b].x - pos[a].x,
              dy = pos[b].y - pos[a].y;
            const d = Math.sqrt(dx * dx + dy * dy) + 0.1;
            const f = 2000 / (d * d);
            forces[a].x -= (dx / d) * f;
            forces[a].y -= (dy / d) * f;
            forces[b].x += (dx / d) * f;
            forces[b].y += (dy / d) * f;
          }
        // attraction along edges
        edges.forEach((e) => {
          if (!pos[e.src] || !pos[e.dst]) return;
          const dx = pos[e.dst].x - pos[e.src].x,
            dy = pos[e.dst].y - pos[e.src].y;
          const d = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const f = d * d * 0.0001;
          forces[e.src].x += (dx / d) * f;
          forces[e.src].y += (dy / d) * f;
          forces[e.dst].x -= (dx / d) * f;
          forces[e.dst].y -= (dy / d) * f;
        });
        // apply
        nodeList.forEach((n) => {
          pos[n].x = clamp(pos[n].x + forces[n].x * 0.02, 40, w - 40);
          pos[n].y = clamp(pos[n].y + forces[n].y * 0.02, 40, h - 40);
        });
      }
    }
    return pos;
  }

  // redraw canvas when dependencies change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // Clean white background
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, w, h);
    
    // Subtle grid pattern
    ctx.strokeStyle = "#f0f0f0";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // draw edges active at currentTime
    const active = edges.filter((e) => e.times.includes(currentTime));

    // Separate path edges from non-path edges
    const pathEdges = [];
    const nonPathEdges = [];

    active.forEach((e) => {
      const isPath = pathResult?.path.some(
        (step, i) =>
          i < pathResult.path.length - 1 &&
          step.node === e.src &&
          pathResult.path[i + 1].node === e.dst
      );
      if (isPath) {
        pathEdges.push(e);
      } else {
        nonPathEdges.push(e);
      }
    });

    // Draw non-path edges first
    ctx.lineWidth = 2;
    nonPathEdges.forEach((e) => {
      const a = positions[e.src];
      const b = positions[e.dst];
      if (!a || !b) return;
      const key = `${e.src}->${e.dst}`;
      const weight = edgeWeights[key] || 1;

      ctx.strokeStyle = "#d1d5db";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // weight label with background
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(mx - 12, my - 14, 24, 18);
      ctx.strokeStyle = "#e5e7eb";
      ctx.strokeRect(mx - 12, my - 14, 24, 18);
      ctx.fillStyle = "#6b7280";
      ctx.font = "600 11px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(weight.toString(), mx, my - 5);

      // arrow
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const ax = b.x - 12 * Math.cos(ang);
      const ay = b.y - 12 * Math.sin(ang);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(
        ax - 8 * Math.cos(ang - Math.PI / 6),
        ay - 8 * Math.sin(ang - Math.PI / 6)
      );
      ctx.lineTo(
        ax - 8 * Math.cos(ang + Math.PI / 6),
        ay - 8 * Math.sin(ang + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = "#9ca3af";
      ctx.fill();
    });

    // Draw path edges with emphasis
    ctx.lineWidth = 3;
    pathEdges.forEach((e) => {
      const a = positions[e.src];
      const b = positions[e.dst];
      if (!a || !b) return;
      const key = `${e.src}->${e.dst}`;
      const weight = edgeWeights[key] || 1;

      ctx.strokeStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // weight label with emphasis
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(mx - 14, my - 15, 28, 20);
      ctx.fillStyle = "#ffffff";
      ctx.font = "600 12px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(weight.toString(), mx, my - 5);

      // arrow - larger for path edges
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      const ax = b.x - 12 * Math.cos(ang);
      const ay = b.y - 12 * Math.sin(ang);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(
        ax - 10 * Math.cos(ang - Math.PI / 6),
        ay - 10 * Math.sin(ang - Math.PI / 6)
      );
      ctx.lineTo(
        ax - 10 * Math.cos(ang + Math.PI / 6),
        ay - 10 * Math.sin(ang + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = "#1a1a1a";
      ctx.fill();
    });
    
    // draw nodes
    const activeSet = new Set(active.flatMap((e) => [e.src, e.dst]));
    const pathNodeSet = new Set(pathResult?.path.map((p) => p.node) ?? []);

    Object.keys(positions).forEach((n) => {
      const p = positions[n];
      if (!p) return;
      const isActive = activeSet.has(n);
      const isPathNode = pathNodeSet.has(n);

      // Minimalistic node styling
      let nodeRadius = 14;
      let fillColor = "#e5e7eb";
      let textColor = "#6b7280";
      let borderColor = "#9ca3af";
      let borderWidth = 2;

      if (n === selected) {
        nodeRadius = 18;
        fillColor = "#1a1a1a";
        textColor = "#ffffff";
        borderColor = "#1a1a1a";
        borderWidth = 3;
      } else if (isPathNode) {
        nodeRadius = 17;
        fillColor = "#1a1a1a";
        textColor = "#ffffff";
        borderColor = "#1a1a1a";
        borderWidth = 3;
      } else if (isActive) {
        nodeRadius = 15;
        fillColor = "#ffffff";
        textColor = "#1a1a1a";
        borderColor = "#1a1a1a";
        borderWidth = 2;
      }

      // Simple shadow
      ctx.shadowBlur = 4;
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      // Draw main node circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Draw border
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw text label - clean and minimal
      ctx.fillStyle = textColor;
      ctx.font = "600 14px Inter";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n, p.x, p.y);
    });
  }, [positions, edges, currentTime, selected, pathResult, edgeWeights]);

  // play timer
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentTime((t) => {
        if (t >= maxTime) {
          setIsPlaying(false);
          setIsAutoFindPath(false);
          return maxTime;
        }
        return t + 1;
      });
    }, speedMs);
    return () => clearInterval(id);
  }, [isPlaying, speedMs, maxTime]);

  // helper: regenerate positions on layout change or node change
  useEffect(() => {
    setPositions(generatePositions(nodes, layout));
  }, [nodes, layout]);

  // Auto-find path when time changes during playback
  useEffect(() => {
    if (isAutoFindPath && selected && targetNode) {
      findPath(selected, targetNode, pathAlgo);
    }
  }, [currentTime, isAutoFindPath, selected, targetNode, pathAlgo]);

  // Pathfinding algorithms
  function findPath(start, target, algo) {
    if (!start || !target) return;

    if (algo === "bfs") {
      // Temporal BFS - finds earliest arrival path
      const visited = new Map();
      const costMap = new Map(); // Track cost to each node
      const q = [{ node: start, time: currentTime, path: [start], cost: 0 }];
      visited.set(start, currentTime);
      costMap.set(start, 0);

      while (q.length) {
        const cur = q.shift();
        const u = cur.node;
        const t = cur.time;

        if (u === target) {
          setPathResult({
            path: cur.path.map((node, i) => ({
              node,
              time: i === 0 ? currentTime : visited.get(node),
            })),
            cost: cur.cost,
            noPath: false,
          });
          return;
        }

        edges
          .filter((e) => e.src === u)
          .forEach((e) => {
            // For static pathfinding at currentTime, only use edges available at currentTime
            if (!isAutoFindPath) {
              // Non-auto mode: look for next available time >= t
              const next = e.times.find((tt) => tt >= t);
              if (next === undefined) return;

              const weight = edgeWeights[`${e.src}->${e.dst}`] || 1;
              const newCost = cur.cost + weight;

              if (
                !visited.has(e.dst) ||
                visited.get(e.dst) > next ||
                (visited.get(e.dst) === next &&
                  (!costMap.has(e.dst) || newCost < costMap.get(e.dst)))
              ) {
                visited.set(e.dst, next);
                costMap.set(e.dst, newCost);
                q.push({
                  node: e.dst,
                  time: next,
                  path: [...cur.path, e.dst],
                  cost: newCost,
                });
              }
            } else {
              // Auto-find mode: only use edges available at currentTime
              if (!e.times.includes(currentTime)) return;

              const weight = edgeWeights[`${e.src}->${e.dst}`] || 1;
              const newCost = cur.cost + weight;

              if (
                !visited.has(e.dst) ||
                (visited.get(e.dst) > 0 &&
                  (!costMap.has(e.dst) || newCost < costMap.get(e.dst)))
              ) {
                visited.set(e.dst, 1);
                costMap.set(e.dst, newCost);
                q.push({
                  node: e.dst,
                  time: currentTime,
                  path: [...cur.path, e.dst],
                  cost: newCost,
                });
              }
            }
          });
      }
      // No path found in BFS
      setPathResult({ noPath: true, path: [], cost: null });
    } else {
      // Dijkstra/A* - finds shortest weighted path
      const dist = new Map();
      const prev = new Map();
      const timeReached = new Map();
      nodes.forEach((n) => dist.set(n, n === start ? 0 : inf));

      // Priority queue implemented as sorted array for simplicity
      const q = [{ node: start, cost: 0 }];

      const heuristic =
        algo === "astar"
          ? (node) => {
              // Manhattan distance scaled by minimum edge weight as admissible heuristic
              const p1 = positions[node];
              const p2 = positions[target];
              const minWeight = Math.min(...Object.values(edgeWeights));
              return (
                Math.abs(p1.x - p2.x) +
                (Math.abs(p1.y - p2.y) * minWeight) / 100
              );
            }
          : () => 0;

      while (q.length) {
        q.sort(
          (a, b) => a.cost + heuristic(a.node) - (b.cost + heuristic(b.node))
        );
        const cur = q.shift();
        const u = cur.node;

        if (u === target) break;
        if (cur.cost > dist.get(u)) continue;

        const t = timeReached.get(u) || currentTime;
        edges
          .filter((e) => e.src === u)
          .forEach((e) => {
            if (!isAutoFindPath) {
              // Non-auto mode: look for next available time >= t
              const next = e.times.find((tt) => tt >= t);
              if (next === undefined) return;

              const weight = edgeWeights[`${e.src}->${e.dst}`] || 1;
              const newCost = dist.get(u) + weight;

              if (newCost < dist.get(e.dst)) {
                dist.set(e.dst, newCost);
                prev.set(e.dst, u);
                timeReached.set(e.dst, next);
                q.push({ node: e.dst, cost: newCost });
              }
            } else {
              // Auto-find mode: only use edges available at currentTime
              if (!e.times.includes(currentTime)) return;

              const weight = edgeWeights[`${e.src}->${e.dst}`] || 1;
              const newCost = dist.get(u) + weight;

              if (newCost < dist.get(e.dst)) {
                dist.set(e.dst, newCost);
                prev.set(e.dst, u);
                timeReached.set(e.dst, currentTime);
                q.push({ node: e.dst, cost: newCost });
              }
            }
          });
      }

      // Reconstruct path
      const path = [];
      let current = target;
      while (current) {
        path.unshift({
          node: current,
          time: timeReached.get(current) || currentTime,
        });
        current = prev.get(current);
      }

      if (path.length > 1 && dist.get(target) !== inf) {
        setPathResult({
          path,
          cost: dist.get(target),
          noPath: false,
        });
      } else {
        // No path found
        setPathResult({ noPath: true, path: [], cost: null });
      }
    }
  }

  // UI handlers for adding edges manually (edgeText textarea)
  function applyEdgeText() {
    parseInputAndSet(edgeText);
  }

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">Temporal Graph Visualizer</h1>
        <div className="controls-container">
          <div className="control-group">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setCurrentTime(0);
                setIsPlaying(false);
              }}
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
            <button
              className={`btn ${isPlaying ? 'btn-warning' : 'btn-primary'}`}
              onClick={() => setIsPlaying((p) => !p)}
            >
              {isPlaying ? (
                <>
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Play
                </>
              )}
            </button>
          </div>
          
          <div className="slider-container">
            <span className="slider-label">Speed</span>
            <input
              type="range"
              min={100}
              max={2000}
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
              className="slider"
            />
            <span className="slider-value">{speedMs}ms</span>
          </div>
          
          <div className="slider-container">
            <span className="slider-label">Time</span>
            <input
              type="range"
              min={0}
              max={maxTime}
              value={currentTime}
              onChange={(e) => setCurrentTime(Number(e.target.value))}
              className="slider"
            />
            <span className="slider-value">t = {currentTime}</span>
          </div>
          
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            className="select"
          >
            <option value="random">Random Layout</option>
            <option value="grid">Grid Layout</option>
            <option value="force">Force Layout</option>
          </select>
        </div>
      </div>

      <div className="main-content">
        <div className="canvas-container">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={700}
              height={500}
              className="canvas"
              style={{
                cursor: draggedNode ? "grabbing" : "grab",
              }}
              onClick={(e) => {
                if (draggedNode) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x =
                  ((e.clientX - rect.left) / rect.width) * e.currentTarget.width;
                const y =
                  ((e.clientY - rect.top) / rect.height) * e.currentTarget.height;
                const found = Object.entries(positions).find(
                  ([n, p]) => Math.hypot(p.x - x, p.y - y) < 14
                );
                if (found) {
                  const node = found[0];
                  if (selected === null) {
                    setSelected(node);
                  } else if (node !== selected) {
                    setTargetNode(node);
                  } else {
                    setSelected(null);
                    setTargetNode(null);
                  }
                  setPathResult(null);
                }
              }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x =
                  ((e.clientX - rect.left) / rect.width) * e.currentTarget.width;
                const y =
                  ((e.clientY - rect.top) / rect.height) * e.currentTarget.height;
                const found = Object.entries(positions).find(
                  ([n, p]) => Math.hypot(p.x - x, p.y - y) < 14
                );
                if (found) {
                  setDraggedNode(found[0]);
                }
              }}
              onMouseMove={(e) => {
                if (!draggedNode) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x =
                  ((e.clientX - rect.left) / rect.width) * e.currentTarget.width;
                const y =
                  ((e.clientY - rect.top) / rect.height) * e.currentTarget.height;
                const newX = clamp(x, 40, e.currentTarget.width - 40);
                const newY = clamp(y, 40, e.currentTarget.height - 40);
                setPositions((prev) => ({
                  ...prev,
                  [draggedNode]: { x: newX, y: newY },
                }));
              }}
              onMouseUp={() => {
                setDraggedNode(null);
              }}
              onMouseLeave={() => {
                setDraggedNode(null);
              }}
            />
          </div>
        </div>

        <div className="sidebar">
          <div className="card">
            <h3 className="card-title">
              Graph Statistics
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Total Nodes</div>
                <div className="stat-value">{nodes.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Edges</div>
                <div className="stat-value">{edges.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Active Edges</div>
                <div className="stat-value">
                  {edges.filter((e) => e.times.includes(currentTime)).length}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Max Time</div>
                <div className="stat-value">{maxTime}</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">
              Load / Edit Graph
            </h3>
            <textarea
              value={edgeText}
              onChange={(e) => setEdgeText(e.target.value)}
              placeholder="Format: numNodes numEdges maxTime&#10;src dst weight t1 t2 t3..."
              className="textarea"
            />
            <div className="button-group">
              <button onClick={applyEdgeText} className="btn btn-success">
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Apply
              </button>
              <button
                onClick={() => {
                  setEdgeText("");
                  setNodes([]);
                  setEdges([]);
                  setPositions({});
                  setPathResult(null);
                  setSelected(null);
                  setTargetNode(null);
                }}
                className="btn btn-danger"
              >
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
              </button>
              <button onClick={() => { setSelected(null); setTargetNode(null); }} className="btn btn-secondary">
                Clear Selection
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">
              Generate Random Graph
            </h3>
            <div className="button-group">
              <button 
                onClick={() => generateRandomGraph(10, 15)} 
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                10 Nodes
              </button>
              <button 
                onClick={() => generateRandomGraph(25, 20)} 
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                25 Nodes
              </button>
            </div>
            <div className="button-group" style={{ marginTop: '0.5rem' }}>
              <button 
                onClick={() => generateRandomGraph(50, 20)} 
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                50 Nodes
              </button>
              <button 
                onClick={() => generateRandomGraph(100, 25)} 
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                100 Nodes
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">
              Pathfinding
            </h3>
            <div className="info-text">
              <span className="info-label">Source:</span>
              <span className="info-value">{selected ?? "—"}</span>
            </div>
            <div className="info-text">
              <span className="info-label">Target:</span>
              <span className="info-value">{targetNode ?? "—"}</span>
            </div>
            <div className="input-group" style={{ marginTop: '0.75rem' }}>
              <select
                value={pathAlgo}
                onChange={(e) => setPathAlgo(e.target.value)}
                className="select"
                style={{ flex: 1 }}
              >
                <option value="bfs">BFS (Earliest)</option>
                <option value="dijkstra">Dijkstra (Shortest)</option>
                <option value="astar">A* (Shortest)</option>
              </select>
              <button
                onClick={() => {
                  if (selected && targetNode) {
                    setCurrentTime(0);
                    setIsAutoFindPath(true);
                    setIsPlaying(true);
                  }
                }}
                className="btn btn-primary"
                disabled={!selected || !targetNode}
              >
                <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Find
              </button>
            </div>
            {pathResult && (
              <div className="path-result">
                {pathResult.noPath ? (
                  <div className="no-path">No path exists</div>
                ) : (
                  <div className="path-info">
                    <div className="path-time">
                      Start Time: t = {pathResult.path[0]?.time ?? 0}
                    </div>
                    <div className="path-cost">
                      Total Weight: {pathResult.cost}
                    </div>
                    <div className="path-nodes">
                      Path: {pathResult.path.map((r, i) => (
                        <span key={i}>
                          {r.node}
                          {i < pathResult.path.length - 1 ? " → " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
