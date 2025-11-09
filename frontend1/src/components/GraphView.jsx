import React, { useMemo } from "react";

export default function GraphView({ 
  nodes = [], 
  edges = [], 
  highlightedNodes = new Set(), 
  highlightedEdges = new Set(),
  traversalOrder = []
}) {
  const size = 800;
  const cx = size / 2;
  const cy = size / 2;
  const radius = Math.min(cx, cy) - 80;

  const positions = useMemo(() => {
    const out = {};
    const n = Math.max(1, nodes.length);
    nodes.forEach((node, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      out[node.id] = {
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        label: node.label ?? node.id
      };
    });
    return out;
  }, [nodes]);

  return (
    <div className="card">
      <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#60a5fa" />
          </marker>
          <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#22c55e" />
          </marker>
        </defs>

        {edges.map((e, idx) => {
          const s = positions[e.source];
          const t = positions[e.target];
          if (!s || !t) return null;
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const pad = 18;
          const sx = s.x + (dx/dist)*pad;
          const sy = s.y + (dy/dist)*pad;
          const tx = t.x - (dx/dist)*pad;
          const ty = t.y - (dy/dist)*pad;
          return (
            <g key={idx}>
              <line 
                x1={sx} y1={sy} 
                x2={tx} y2={ty} 
                stroke={highlightedEdges.has(`${e.source}-${e.target}`) ? "#22c55e" : "#2b6cb0"} 
                strokeWidth={highlightedEdges.has(`${e.source}-${e.target}`) ? 3 : 2}
                strokeOpacity={highlightedEdges.size > 0 && !highlightedEdges.has(`${e.source}-${e.target}`) ? 0.3 : 1}
                markerEnd={`url(#${highlightedEdges.has(`${e.source}-${e.target}`) ? 'arrow-active' : 'arrow'})`} 
              />
              <text x={(sx+tx)/2} y={(sy+ty)/2 - 6} fontSize="12" fill="#94a3b8" textAnchor="middle">
                {(() => {
                  const parts = [];
                  if (typeof e.weight !== 'undefined') parts.push(`w:${e.weight}`);
                  const start = (typeof e.time !== 'undefined') ? e.time : (typeof e.startTime !== 'undefined' ? e.startTime : null);
                  const end = (typeof e.endTime !== 'undefined') ? e.endTime : null;
                  if (start !== null) parts.push(end !== null ? `${start}-${end}` : `${start}`);
                  return parts.join(' ');
                })()}
              </text>
            </g>
          );
        })}

        {nodes.map((n) => {
          const p = positions[n.id];
          if (!p) return null;
          return (
            <g key={n.id}>
              <circle 
                cx={p.x} cy={p.y} r={16} 
                fill={highlightedNodes.has(n.id) ? "#22c55e" : "#1e293b"}
                stroke={highlightedNodes.has(n.id) ? "#22c55e" : "#60a5fa"} 
                strokeWidth={highlightedNodes.has(n.id) ? 3 : 2}
                opacity={highlightedNodes.size > 0 && !highlightedNodes.has(n.id) ? 0.3 : 1}
              />
              <text 
                x={p.x} 
                y={p.y + 4} 
                fontSize="12" 
                fill="#e6eef8" 
                textAnchor="middle"
              >
                {p.label}
                {traversalOrder.includes(n.id) && 
                  <tspan x={p.x} y={p.y - 20} fill="#94a3b8" fontSize="10">
                    {traversalOrder.indexOf(n.id) + 1}
                  </tspan>
                }
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
