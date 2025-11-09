import React, { useState } from "react";
import { parseGraphTxt } from "../services/parser";

export default function Controls({ onAddNode, onAddEdge, onLoadJson, onRunBFS }) {
  const [nodeId, setNodeId] = useState("");
  const [src, setSrc] = useState("");
  const [dst, setDst] = useState("");
  const [weight, setWeight] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [bfsStart, setBfsStart] = useState("");
  const [bfsTime, setBfsTime] = useState(0);

  function handleFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        // If .txt file, parse as graph txt format
        if (f.name.toLowerCase().endsWith('.txt')) {
          const parsed = parseGraphTxt(ev.target.result);
          onLoadJson(parsed);
          return;
        }
        // Otherwise try as JSON
        const parsed = JSON.parse(ev.target.result);
        onLoadJson(parsed);
      } catch (err) {
        alert(err.message || "Failed to parse file");
      }
    };
    reader.readAsText(f);
  }

  return (
    <div className="card">
      <h3>Controls</h3>

      <div>
        <h4>Add node</h4>
        <input value={nodeId} onChange={e => setNodeId(e.target.value)} placeholder="node id" />
        <button className="button" onClick={() => { onAddNode(nodeId.trim()); setNodeId(""); }}>Add Node</button>
      </div>

      <hr />

      <div>
        <h4>Add edge</h4>
        <input value={src} onChange={e => setSrc(e.target.value)} placeholder="source id" />
        <input value={dst} onChange={e => setDst(e.target.value)} placeholder="target id" />
        <input value={weight} onChange={e => setWeight(e.target.value)} placeholder="weight (number)" />
        <input value={startTime} onChange={e => setStartTime(e.target.value)} placeholder="start time (number)" />
        <input value={endTime} onChange={e => setEndTime(e.target.value)} placeholder="end time (number)" />
        <button className="button" onClick={() => {
          const w = weight === "" ? undefined : Number(weight);
          const s = startTime === "" ? undefined : Number(startTime);
          const eTime = endTime === "" ? undefined : Number(endTime);
          onAddEdge(src.trim(), dst.trim(), w, s, eTime);
          setSrc(""); setDst(""); setWeight(""); setStartTime(""); setEndTime("");
        }}>Add Edge</button>
      </div>

      <hr />

      <div>
        <h4>Load / Export</h4>
        <input type="file" accept=".txt,.json" onChange={handleFile} />
        <p style={{ color: "var(--muted)" }}>
          Supported formats:
          <br />• TXT: first line "n m duration", then m lines "source target weight startTime endTime"
          <br />• JSON: {"{ nodes: [{id,label}], edges: [{source,target,time}] }"}
        </p>
      </div>

      <hr />

      <div>
        <h4>Temporal Graph Traversal</h4>
        <input value={bfsStart} onChange={e => setBfsStart(e.target.value)} placeholder="start node id" />
        <input value={bfsTime} type="number" onChange={e => setBfsTime(Number(e.target.value))} placeholder="time t" />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="button" onClick={() => onRunBFS(bfsStart.trim(), bfsTime)}>Run BFS</button>
          <button 
            className="button secondary" 
            onClick={() => onRunBFS(bfsStart.trim(), bfsTime, 'dfs')}
          >
            Run DFS
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.9em", marginTop: 8 }}>
          Shows nodes reachable at time t when edge (u,v) exists if t is between edge's start and end time.
        </p>
      </div>
    </div>
  );
}
