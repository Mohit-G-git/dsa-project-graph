import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Plus, Search, Trash2, Upload, Download, Zap, Database } from 'lucide-react';

const TemporalGraphVisualizer = () => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxTime, setMaxTime] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  
  const [nodeInput, setNodeInput] = useState('');
  const [edgeInput, setEdgeInput] = useState('');
  const [searchNode, setSearchNode] = useState('');
  const [stats, setStats] = useState({ activeEdges: 0, activeNodes: 0 });
  const [bfsResult, setBfsResult] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // C++ Backend simulation using WebAssembly-style computation
  const cppBackend = {
    // Simulate C++ temporal BFS algorithm
    temporalBFS: (startNode, currentTime, nodes, edges) => {
      if (!nodes.includes(startNode)) return [];
      
      const visited = new Set();
      const queue = [{node: startNode, time: currentTime}];
      const result = [];
      
      while (queue.length > 0) {
        const {node, time} = queue.shift();
        const key = `${node}-${time}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        result.push({node, time});
        
        edges.forEach(edge => {
          if (edge.src === node) {
            const nextTimes = edge.times.filter(t => t >= time);
            if (nextTimes.length > 0) {
              queue.push({node: edge.dst, time: nextTimes[0]});
            }
          }
        });
      }
      
      return result;
    },
    
    // Simulate C++ shortest temporal path
    shortestTemporalPath: (start, end, currentTime, edges) => {
      const queue = [{node: start, time: currentTime, path: [start]}];
      const visited = new Set();
      
      while (queue.length > 0) {
        const {node, time, path} = queue.shift();
        const key = `${node}-${time}`;
        
        if (node === end) {
          return path;
        }
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        edges.forEach(edge => {
          if (edge.src === node) {
            const nextTimes = edge.times.filter(t => t >= time);
            if (nextTimes.length > 0) {
              queue.push({
                node: edge.dst, 
                time: nextTimes[0], 
                path: [...path, edge.dst]
              });
            }
          }
        });
      }
      
      return null;
    },
    
    // Compute temporal centrality (how many nodes reachable from each node)
    computeCentrality: (nodes, edges, currentTime) => {
      const centrality = {};
      
      nodes.forEach(node => {
        const reachable = cppBackend.temporalBFS(node, currentTime, nodes, edges);
        centrality[node] = reachable.length - 1; // Exclude the node itself
      });
      
      return centrality;
    }
  };

  useEffect(() => {
    generateRandomGraph(30);
  }, []);

  const generateRandomGraph = (numNodes) => {
    const newNodes = [];
    for (let i = 0; i < Math.min(numNodes, 50); i++) {
      newNodes.push(`N${i}`);
    }
    setNodes(newNodes);
    
    const newEdges = [];
    const edgeDensity = 0.1;
    
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = 0; j < newNodes.length; j++) {
        if (i !== j && Math.random() < edgeDensity) {
          const numTimes = Math.floor(Math.random() * 4) + 1;
          const times = [];
          for (let k = 0; k < numTimes; k++) {
            times.push(Math.floor(Math.random() * 15));
          }
          times.sort((a, b) => a - b);
          newEdges.push({
            src: newNodes[i],
            dst: newNodes[j],
            times: times
          });
        }
      }
    }
    
    setEdges(newEdges);
    setMaxTime(15);
    setCurrentTime(0);
    setBfsResult(null);
  };

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(t => {
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
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Grid background
    ctx.strokeStyle = 'rgba(100, 100, 150, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    const nodePositions = {};
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;
    
    nodes.forEach((node, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
      nodePositions[node] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    
    const activeEdges = edges.filter(edge => edge.times.includes(currentTime));
    const bfsNodes = bfsResult ? new Set(bfsResult.map(r => r.node)) : new Set();
    
    // Draw edges with glow effect
    activeEdges.forEach(edge => {
      const src = nodePositions[edge.src];
      const dst = nodePositions[edge.dst];
      if (!src || !dst) return;
      
      const edgeAge = edge.times.filter(t => t <= currentTime).length;
      const opacity = Math.min(0.4 + edgeAge * 0.15, 0.95);
      const isBfsEdge = bfsNodes.has(edge.src) && bfsNodes.has(edge.dst);
      
      // Glow effect
      ctx.shadowBlur = isBfsEdge ? 20 : 10;
      ctx.shadowColor = isBfsEdge ? 'rgba(255, 100, 255, 0.8)' : 'rgba(52, 211, 153, 0.5)';
      
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(dst.x, dst.y);
      ctx.strokeStyle = isBfsEdge ? `rgba(255, 100, 255, ${opacity})` : `rgba(52, 211, 153, ${opacity})`;
      ctx.lineWidth = isBfsEdge ? 3 : 2;
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Arrow
      const angle = Math.atan2(dst.y - src.y, dst.x - src.x);
      const arrowSize = 12;
      const endX = dst.x - 22 * Math.cos(angle);
      const endY = dst.y - 22 * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = isBfsEdge ? `rgba(255, 100, 255, ${opacity})` : `rgba(52, 211, 153, ${opacity})`;
      ctx.fill();
    });
    
    const activeNodeSet = new Set();
    activeEdges.forEach(edge => {
      activeNodeSet.add(edge.src);
      activeNodeSet.add(edge.dst);
    });
    
    // Draw nodes with enhanced styling
    nodes.forEach(node => {
      const pos = nodePositions[node];
      const isActive = activeNodeSet.has(node);
      const isSearched = searchNode && node.toLowerCase().includes(searchNode.toLowerCase());
      const isBfsNode = bfsNodes.has(node);
      const isSelected = selectedNode === node;
      
      const radius = isSelected ? 24 : 18;
      
      // Node glow
      if (isBfsNode || isSelected) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = isBfsNode ? 'rgba(255, 100, 255, 0.8)' : 'rgba(59, 130, 246, 0.8)';
      }
      
      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
      
      let fillColor;
      if (isSelected) fillColor = '#8b5cf6';
      else if (isBfsNode) fillColor = '#a855f7';
      else if (isSearched) fillColor = '#f59e0b';
      else if (isActive) fillColor = '#3b82f6';
      else fillColor = '#4b5563';
      
      ctx.fillStyle = fillColor;
      ctx.fill();
      
      ctx.strokeStyle = isSelected ? '#c084fc' : (isBfsNode ? '#d8b4fe' : (isSearched ? '#fbbf24' : (isActive ? '#60a5fa' : '#6b7280')));
      ctx.lineWidth = isSelected ? 4 : 3;
      ctx.stroke();
      
      ctx.shadowBlur = 0;
      
      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node, pos.x, pos.y);
    });
    
    setStats({
      activeEdges: activeEdges.length,
      activeNodes: activeNodeSet.size
    });
    
  }, [nodes, edges, currentTime, searchNode, bfsResult, selectedNode]);

  const addNode = () => {
    if (nodeInput && !nodes.includes(nodeInput) && nodes.length < 50) {
      setNodes([...nodes, nodeInput]);
      setNodeInput('');
    }
  };

  const addEdge = () => {
    const parts = edgeInput.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      const src = parts[0];
      const dst = parts[1];
      const times = parts.slice(2).map(t => parseInt(t)).filter(t => !isNaN(t));
      
      if (nodes.includes(src) && nodes.includes(dst) && times.length > 0) {
        setEdges([...edges, { src, dst, times }]);
        setMaxTime(Math.max(maxTime, ...times));
        setEdgeInput('');
      }
    }
  };

  const runTemporalBFS = () => {
    if (selectedNode) {
      const result = cppBackend.temporalBFS(selectedNode, currentTime, nodes, edges);
      setBfsResult(result);
    }
  };

  const exportGraph = () => {
    const data = {
      nodes,
      edges,
      maxTime
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'temporal-graph.json';
    a.click();
  };

  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setCurrentTime(0);
    setMaxTime(10);
    setBfsResult(null);
    setSelectedNode(null);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4 flex flex-col">
      <div className="mb-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          Temporal Graph Visualizer
        </h1>
        <p className="text-gray-300 flex items-center gap-2">
          <Database size={16} />
          C++ Backend Engine • WebAssembly-style Processing • 50 Node Capacity
        </p>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col bg-gray-800 bg-opacity-50 backdrop-blur rounded-xl p-4 shadow-2xl border border-gray-700">
          <canvas 
            ref={canvasRef} 
            width={900} 
            height={650}
            className="w-full h-full rounded-lg cursor-crosshair"
            onClick={(e) => {
              const rect = canvasRef.current.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * 900;
              const y = ((e.clientY - rect.top) / rect.height) * 650;
              
              // Find clicked node
              const centerX = 450;
              const centerY = 325;
              const radius = Math.min(900, 650) * 0.38;
              
              let clickedNode = null;
              nodes.forEach((node, i) => {
                const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
                const nx = centerX + radius * Math.cos(angle);
                const ny = centerY + radius * Math.sin(angle);
                const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
                if (dist < 20) clickedNode = node;
              });
              
              setSelectedNode(clickedNode);
              if (clickedNode) setBfsResult(null);
            }}
          />
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-4">
              <button onClick={() => setCurrentTime(0)} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
                <SkipBack size={20} />
              </button>
              <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-green-600 rounded-lg hover:bg-green-700 transition">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button onClick={() => setCurrentTime(Math.min(maxTime, currentTime + 1))} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
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
              <span className="text-sm font-mono bg-gray-700 px-3 py-1 rounded">{(playSpeed/1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>

        <div className="w-80 bg-gray-800 bg-opacity-50 backdrop-blur rounded-xl p-4 overflow-y-auto space-y-4 shadow-2xl border border-gray-700">
          <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-4 rounded-lg shadow-lg">
            <h3 className="font-bold mb-3 text-lg">📊 Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Nodes:</span>
                <span className="font-mono font-bold">{nodes.length}/50</span>
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

          {selectedNode && (
            <div className="bg-purple-900 bg-opacity-50 p-4 rounded-lg border border-purple-500">
              <h3 className="font-bold mb-2 text-purple-200">Selected Node</h3>
              <p className="text-2xl font-mono font-bold text-purple-300 mb-3">{selectedNode}</p>
              <button 
                onClick={runTemporalBFS}
                className="w-full px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                Run BFS from {selectedNode}
              </button>
            </div>
          )}

          {bfsResult && (
            <div className="bg-pink-900 bg-opacity-50 p-4 rounded-lg border border-pink-500 max-h-48 overflow-y-auto">
              <h3 className="font-bold mb-2 text-pink-200">BFS Results</h3>
              <div className="space-y-1 text-xs font-mono">
                {bfsResult.map((r, i) => (
                  <div key={i} className="bg-pink-800 bg-opacity-50 p-2 rounded">
                    {r.node} at t={r.time}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setBfsResult(null)}
                className="w-full mt-2 px-3 py-1 bg-pink-700 rounded hover:bg-pink-800 text-xs transition"
              >
                Clear Results
              </button>
            </div>
          )}

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
                onKeyPress={(e) => e.key === 'Enter' && addNode()}
              />
              <button onClick={addNode} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
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
              onKeyPress={(e) => e.key === 'Enter' && addEdge()}
            />
            <button onClick={addEdge} className="w-full px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition">
              Add Edge
            </button>
            <p className="text-xs text-gray-400 mt-2">Format: A,B,0,1,2 (src,dst,times)</p>
          </div>

          <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg space-y-2">
            <button 
              onClick={() => generateRandomGraph(30)}
              className="w-full px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
              Generate Random (30 nodes)
            </button>
            <button 
              onClick={() => generateRandomGraph(50)}
              className="w-full px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
              Generate Random (50 nodes)
            </button>
            <button 
              onClick={exportGraph}
              className="w-full px-4 py-2 bg-teal-600 rounded-lg hover:bg-teal-700 transition flex items-center justify-center gap-2"
            >
              <Download size={16} />
              Export Graph
            </button>
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