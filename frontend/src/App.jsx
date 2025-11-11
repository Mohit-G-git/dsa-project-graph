import React, { useState, useEffect, useRef } from "react";

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

  // Load graph from input.txt or use default graph
  useEffect(() => {
    // Using the exact content from your input.txt file
    const inputGraph = `3 2 10
4 5 4 0 10
2 3 5 0 10`;

    const loadGraph = () => {
      if (!edgeText.trim()) {
        console.log("Loading default graph");
        parseInputAndSet(inputGraph);
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
    // background
    ctx.fillStyle = "#071029";
    ctx.fillRect(0, 0, w, h);
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

      ctx.strokeStyle = "rgba(100,200,180,0.9)";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // weight label
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.fillStyle = "#fff";
      ctx.font = "11px monospace";
      ctx.fillText(weight.toString(), mx, my - 8);

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
      ctx.fillStyle = "rgba(100,200,180,0.95)";
      ctx.fill();
    });

    // Draw path edges with thicker lines and brighter color
    ctx.lineWidth = 4;
    pathEdges.forEach((e) => {
      const a = positions[e.src];
      const b = positions[e.dst];
      if (!a || !b) return;
      const key = `${e.src}->${e.dst}`;
      const weight = edgeWeights[key] || 1;

      ctx.strokeStyle = "rgba(255,200,50,0.95)";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // weight label - larger for path edges
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 13px monospace";
      ctx.fillText(weight.toString(), mx, my - 8);

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
      ctx.fillStyle = "rgba(255,200,50,0.95)";
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

      // Determine node size and colors with much more contrast
      let nodeRadius = 10;
      let fillColor = "#10b981";
      let borderColor = "#ffffff";
      let borderWidth = 4;
      let shadowColor = "rgba(0, 0, 0, 0.6)";
      let shadowBlur = 8;

      if (n === selected) {
        nodeRadius = 15;
        fillColor = "#ec4899";
        borderColor = "#ffffff";
        borderWidth = 4;
        shadowColor = "rgba(236, 72, 153, 0.8)";
        shadowBlur = 12;
      } else if (isPathNode) {
        nodeRadius = 15;
        fillColor = "#fbbf24";
        borderColor = "#ff8800";
        borderWidth = 5;
        shadowColor = "rgba(251, 191, 36, 0.9)";
        shadowBlur = 12;
      } else if (isActive) {
        nodeRadius = 13;
        fillColor = "#3b82f6";
        borderColor = "#ffffff";
        borderWidth = 4;
        shadowColor = "rgba(59, 130, 246, 0.7)";
        shadowBlur = 10;
      } else {
        nodeRadius = 10;
        fillColor = "#06b6d4";
        borderColor = "#ffffff";
        borderWidth = 4;
        shadowColor = "rgba(6, 182, 212, 0.6)";
        shadowBlur = 8;
      }

      // Draw outer shadow/glow effect (2 layers for more prominence)
      ctx.beginPath();
      ctx.arc(p.x, p.y, nodeRadius + 5, 0, Math.PI * 2);
      ctx.fillStyle = shadowColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, nodeRadius + 3, 0, Math.PI * 2);
      ctx.fillStyle = shadowColor;
      ctx.fill();

      // Draw main node circle with bright color
      ctx.beginPath();
      ctx.arc(p.x, p.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Draw strong outer border (dark)
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = "#000000";
      ctx.stroke();

      // Draw inner bright border
      ctx.lineWidth = borderWidth - 1.5;
      ctx.strokeStyle = borderColor;
      ctx.stroke();

      // Draw text label with better visibility - larger and bold
      ctx.fillStyle = "#000000";
      ctx.font = "bold 16px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n, p.x, p.y);
    });
  }, [positions, edges, currentTime, selected]);

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
    <div
      style={{
        fontFamily: "Inter,monospace",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ padding: 16, color: "#030303ff", textAlign: "center" }}>
        <h2>Temporal Graph Visualizer</h2>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            justifyContent: "center",
            padding: "12px ",
          }}
        >
          <button
            className="control-button reset-button"
            onClick={() => {
              setCurrentTime(0);
              setIsPlaying(false);
            }}
          >
            Reset
          </button>
          <button
            className={`control-button ${
              isPlaying ? "pause-button" : "play-button"
            }`}
            onClick={() => setIsPlaying((p) => !p)}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Speed:</span>
            <input
              type="range"
              min={100}
              max={2000}
              value={speedMs}
              onChange={(e) => setSpeedMs(Number(e.target.value))}
            />
            <span>{speedMs}ms</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Time:</span>
            <input
              type="range"
              min={0}
              max={maxTime}
              value={currentTime}
              onChange={(e) => setCurrentTime(Number(e.target.value))}
            />
            <span>t = {currentTime}</span>
          </div>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            style={{ marginLeft: 16 }}
          >
            <option value="random">Random</option>
            <option value="grid">Grid</option>
            <option value="force">Force (lite)</option>
          </select>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", gap: 12, padding: 12 }}>
        <div
          style={{
            flex: 1,
            borderRadius: 8,
            overflow: "hidden",
            background: "#071029",
            padding: 8,
          }}
        >
          <canvas
            ref={canvasRef}
            width={700}
            height={500}
            style={{
              width: "100%",
              height: "100%",
              cursor: draggedNode ? "grabbing" : "grab",
            }}
            onClick={(e) => {
              if (draggedNode) return; // Don't select if we were dragging
              const rect = e.currentTarget.getBoundingClientRect();
              const x =
                ((e.clientX - rect.left) / rect.width) * e.currentTarget.width;
              const y =
                ((e.clientY - rect.top) / rect.height) * e.currentTarget.height;
              // find node
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
              // find node
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
              // Update position with clamping to keep node on canvas
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
        <div
          style={{
            width: 340,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 12,
              background: "#082033",
              borderRadius: 8,
              color: "#dbeeff",
            }}
          >
            <div>Total nodes: {nodes.length}</div>
            <div>Total edges: {edges.length}</div>
            <div>
              Active edges:{" "}
              {edges.filter((e) => e.times.includes(currentTime)).length}
            </div>
          </div>
          <div style={{ padding: 12, background: "#082033", borderRadius: 8 }}>
            <div>
              <strong>Load / Edit edges</strong>
            </div>
            <textarea
              value={edgeText}
              onChange={(e) => setEdgeText(e.target.value)}
              placeholder={
                "paste edge list (src dst t1 t2...) or load file above"
              }
              style={{
                width: "100%",
                height: 120,
                background: "#02101a",
                color: "#fff",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={applyEdgeText}>Apply</button>
              <button
                onClick={() => {
                  // Clear everything and let useEffect reload from input.txt
                  setEdgeText("");
                  setNodes([]);
                  setEdges([]);
                  setPositions({});
                  setPathResult(null);
                  setSelected(null);
                  setTargetNode(null);
                }}
              >
                Clear
              </button>
              <button onClick={() => setSelected(null)}>Clear Selection</button>
            </div>
          </div>
          <div
            style={{
              padding: 12,
              background: "#082033",
              borderRadius: 8,
              color: "#dbeeff",
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <div>Source: {selected ?? "—"}</div>
              <div>Target: {targetNode ?? "—"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <select
                value={pathAlgo}
                onChange={(e) => setPathAlgo(e.target.value)}
              >
                <option value="bfs">BFS (earliest)</option>
                <option value="dijkstra">Dijkstra (shortest)</option>
                <option value="astar">A* (shortest)</option>
              </select>
              <button
                onClick={() => {
                  if (selected && targetNode) {
                    setCurrentTime(0);
                    setIsAutoFindPath(true);
                    setIsPlaying(true);
                  }
                }}
              >
                Find Path
              </button>
            </div>
            {pathResult && (
              <div style={{ maxHeight: 160, overflow: "auto" }}>
                {pathResult.noPath ? (
                  <div style={{ color: "#ff6b6b", fontWeight: "bold" }}>
                    No path exists
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#ffff00",
                        }}
                      >
                        t = {pathResult.path[0]?.time ?? 0}
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: "#ffd700",
                        }}
                      >
                        TOTAL WEIGHT : {pathResult.cost}
                      </div>
                      <div
                        style={{
                          fontSize: "18px",
                          color: "#60a5fa",
                          fontWeight: "500",
                        }}
                      >
                        {pathResult.path.map((r, i) => (
                          <span key={i}>
                            {r.node}
                            {i < pathResult.path.length - 1 ? " → " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
