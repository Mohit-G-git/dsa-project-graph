import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Search,
  Trash2,
  Download,
  Zap,
  Database,
  RefreshCw,
} from "lucide-react";
import inputData from "../../backend/input.txt";

const TemporalGraphVisualizer = () => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodePositions, setNodePositions] = useState({});
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTime, setMaxTime] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const [layoutMode, setLayoutMode] = useState("force");
  const [edgeListInput, setEdgeListInput] = useState("");
  const [searchNode, setSearchNode] = useState("");
  const [stats, setStats] = useState({ activeEdges: 0, activeNodes: 0 });
  const [bfsResult, setBfsResult] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);

  useEffect(() => {
    parseInputData();
  }, []);

  const parseInputData = () => {
    const lines = inputData.trim().split("\n");
    const [nodeCount, edgeCount, parsedMaxTime] = lines[0]
      .split(" ")
      .map(Number);
    const parsedEdges = lines.slice(1).map((line) => {
      const [src, dst, weight, start, end] = line.split(" ").map(Number);
      return { src: `N${src}`, dst: `N${dst}`, times: [start, end] };
    });

    const parsedNodes = Array.from(
      new Set(parsedEdges.flatMap((edge) => [edge.src, edge.dst]))
    );

    setNodes(parsedNodes);
    setEdges(parsedEdges);
    // set the state's maxTime from the input header
    if (!isNaN(parsedMaxTime)) {
      setMaxTime(parsedMaxTime);
    }
  };

  const addNode = () => {
    if (!nodeInput || nodes.includes(nodeInput)) {
      return;
    }
    setNodes([...nodes, nodeInput]);
    setNodeInput("");
  };

  const addEdge = () => {
    const [src, dst, ...times] = edgeInput.split(",").map((s) => s.trim());
    if (
      !src ||
      !dst ||
      !times.length ||
      !nodes.includes(src) ||
      !nodes.includes(dst)
    ) {
      return;
    }

    const timesArray = times.map(Number).filter((t) => !isNaN(t));
    if (!timesArray.length) return;

    const newEdge = {
      src,
      dst,
      times: timesArray.sort((a, b) => a - b),
    };

    setEdges([...edges, newEdge]);
    setEdgeInput("");
    setMaxTime(Math.max(maxTime, ...timesArray));
  };

  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setCurrentTime(0);
    setMaxTime(10);
    setBfsResult(null);
    setSelectedNode(null);
  };

  const generateClusteredGraph = () => {
    const clusterCount = 5;
    const nodesPerCluster = Math.floor(nodes.length / clusterCount);
    const nodePositions = {};

    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;

    for (let cluster = 0; cluster < clusterCount; cluster++) {
      const centerX = width * (0.2 + 0.6 * (cluster / (clusterCount - 1)));
      const centerY = height * (0.3 + 0.4 * Math.random());
      for (let i = 0; i < nodesPerCluster; i++) {
        const nodeIndex = cluster * nodesPerCluster + i;
        if (nodeIndex >= nodes.length) break;
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 50 + 30;
        nodePositions[nodes[nodeIndex]] = {
          x: centerX + distance * Math.cos(angle),
          y: centerY + distance * Math.sin(angle),
        };
      }
    }

    return nodePositions;
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((t) => {
          if (t >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return t + 1;
        });
      }, playSpeed);
      return () => clearInterval(interval);
    }
  }, [isPlaying, playSpeed, maxTime]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, width, height);

    // Generate node positions
    const nodePositions = generateClusteredGraph();

    // Draw edges
    const activeEdges = edges.filter((edge) =>
      edge.times.includes(currentTime)
    );
    activeEdges.forEach((edge) => {
      const src = nodePositions[edge.src];
      const dst = nodePositions[edge.dst];
      if (!src || !dst) return;

      // Draw edge with glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(52, 211, 153, 0.5)";
      ctx.strokeStyle = "rgba(52, 211, 153, 0.8)";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(dst.x, dst.y);
      ctx.stroke();

      // Draw arrow
      const angle = Math.atan2(dst.y - src.y, dst.x - src.x);
      const arrowSize = 10;
      const arrowX = dst.x - 20 * Math.cos(angle);
      const arrowY = dst.y - 20 * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
        arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = "rgba(52, 211, 153, 0.8)";
      ctx.fill();
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw nodes
    const activeNodeSet = new Set(
      activeEdges.flatMap((edge) => [edge.src, edge.dst])
    );

    nodes.forEach((node) => {
      const pos = nodePositions[node];
      const isActive = activeNodeSet.has(node);
      const isSearched =
        searchNode && node.toLowerCase().includes(searchNode.toLowerCase());
      const isSelected = selectedNode === node;

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 15 : 12, 0, 2 * Math.PI);

      // Node fill color
      if (isSelected) ctx.fillStyle = "#8b5cf6";
      else if (isSearched) ctx.fillStyle = "#f59e0b";
      else if (isActive) ctx.fillStyle = "#3b82f6";
      else ctx.fillStyle = "#4b5563";

      ctx.fill();

      // Node border
      ctx.strokeStyle = isSelected ? "#c084fc" : "#6b7280";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node, pos.x, pos.y);
    });

    setStats({
      activeEdges: activeEdges.length,
      activeNodes: activeNodeSet.size,
    });
  }, [nodes, edges, currentTime, searchNode, selectedNode]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4 flex flex-col">
      <div className="mb-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Temporal Graph Visualizer
        </h1>
        <p className="text-gray-300 flex items-center gap-2">
          <Database size={16} />
          Temporal Graph Analysis
        </p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col bg-gray-800 bg-opacity-50 backdrop-blur rounded-xl p-4 shadow-2xl border border-gray-700">
          <canvas
            ref={canvasRef}
            width={900}
            height={650}
            className="w-full h-full rounded-lg"
          />

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentTime(0)}
                className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                <SkipBack size={20} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={() =>
                  setCurrentTime(Math.min(currentTime + 1, maxTime))
                }
                className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                <SkipForward size={20} />
              </button>

              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max={maxTime}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="text-xl font-mono bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2 rounded-lg font-bold">
                t = {currentTime}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold">Speed:</label>
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={playSpeed}
                onChange={(e) => setPlaySpeed(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-mono bg-gray-700 px-3 py-1 rounded">
                {(playSpeed / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        <div className="w-80 bg-gray-800 bg-opacity-50 backdrop-blur rounded-xl p-4 space-y-4 shadow-2xl border border-gray-700">
          <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-4 rounded-lg shadow-lg">
            <h3 className="font-bold mb-3 text-lg">📊 Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Nodes:</span>
                <span className="font-mono font-bold">{nodes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Edges:</span>
                <span className="font-mono font-bold">{edges.length}</span>
              </div>
              <div className="flex justify-between text-green-300">
                <span>Active Edges:</span>
                <span className="font-mono font-bold">{stats.activeEdges}</span>
              </div>
              <div className="flex justify-between text-blue-300">
                <span>Active Nodes:</span>
                <span className="font-mono font-bold">{stats.activeNodes}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Search size={16} /> Search Node
            </h3>
            <input
              type="text"
              value={searchNode}
              onChange={(e) => setSearchNode(e.target.value)}
              placeholder="Type node name..."
              className="w-full px-3 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-blue-400 outline-none transition"
            />
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Plus size={16} /> Add Node
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={nodeInput}
                onChange={(e) => setNodeInput(e.target.value)}
                placeholder="Node name"
                className="flex-1 px-3 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-blue-400 outline-none transition"
                onKeyPress={(e) => e.key === "Enter" && addNode()}
              />
              <button
                onClick={addNode}
                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Add Temporal Edge</h3>
            <input
              type="text"
              value={edgeInput}
              onChange={(e) => setEdgeInput(e.target.value)}
              placeholder="src,dst,t1,t2,t3..."
              className="w-full px-3 py-2 bg-gray-600 rounded-lg border border-gray-500 focus:border-blue-400 outline-none mb-2 transition"
              onKeyPress={(e) => e.key === "Enter" && addEdge()}
            />
            <button
              onClick={addEdge}
              className="w-full px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              Add Edge
            </button>
            <p className="text-xs text-gray-400 mt-2">
              Format: A,B,0,1,2 (src,dst,times)
            </p>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg space-y-2">
            <button
              onClick={clearGraph}
              className="w-full px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalGraphVisualizer;
