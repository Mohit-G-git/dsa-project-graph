let wasmModule = null;
let wasmLoaded = false;

export async function initWasm() {
  if (wasmLoaded) return true;

  const candidates = [
    "/backend/temporal_graph.js",
    "/backend/temporal_graph_bundle.js",
    "/backend/build/temporal_graph.js",
    "/backend/graph.js",
    "/backend/bindings.js",
  ];

  for (const p of candidates) {
    try {
      const res = await fetch(p, { method: "GET" });
      if (!res.ok) continue;
      await loadScript(p);
      if (window.Module) {
        wasmModule = window.Module;
        wasmLoaded = true;
        return true;
      }
    } catch (err) {
      // try next
    }
  }
  return false;
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = Array.from(document.getElementsByTagName("script")).find(
      (s) => s.src && s.src.endsWith(src)
    );
    if (existing) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

export async function fetchGraph() {
  try {
    const res = await fetch("/api/graph");
    if (res.ok) return await res.json();
  } catch (err) {}

  if (wasmLoaded && wasmModule) {
    try {
      if (typeof wasmModule.getGraphJSON === "function") {
        const j = wasmModule.getGraphJSON();
        return JSON.parse(j);
      }
      if (wasmModule.TemporalGraph) {
        const TG = wasmModule.TemporalGraph;
        const tg = new TG();
        if (typeof tg.toJSON === "function") {
          const js = tg.toJSON();
          try {
            tg.delete && tg.delete();
          } catch {}
          return typeof js === "string" ? JSON.parse(js) : js;
        }
        try {
          tg.delete && tg.delete();
        } catch {}
      }
    } catch (err) {}
  }

  throw new Error("No backend graph available (HTTP or WASM).");
}

export async function runBFS({ start, startTime = 0, graph }) {
  try {
    const res = await fetch("/api/bfs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, startTime }),
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  if (wasmLoaded && wasmModule) {
    try {
      if (typeof wasmModule.runBFS === "function") {
        const result = wasmModule.runBFS(start, startTime);
        if (typeof result === "string") return JSON.parse(result);
        return result;
      }
      if (wasmModule.TemporalGraph) {
        const TG = wasmModule.TemporalGraph;
        const tg = new TG();
        if (graph && typeof tg.addNode === "function") {
          try {
            for (const n of graph.nodes || []) tg.addNode(n.id || n);
            for (const e of graph.edges || []) {
              const t = typeof e.time === "undefined" ? 0 : e.time;
              if (typeof tg.addEdge === "function")
                tg.addEdge(e.source, e.target, t);
            }
          } catch {}
        }
        if (typeof tg.temporalBFS === "function") {
          const res = tg.temporalBFS(start, startTime);
          try {
            tg.delete && tg.delete();
          } catch {}
          return res;
        }
        try {
          tg.delete && tg.delete();
        } catch {}
      }
    } catch (err) {}
  }

  if (!graph || !start)
    throw new Error("No backend available and insufficient data for local BFS");
  const q = [start];
  const visited = new Set([start]);
  const out = [];
  while (q.length) {
    const u = q.shift();
    out.push(u);
    for (const e of graph.edges || []) {
      if (e.source === u && !visited.has(e.target)) {
        visited.add(e.target);
        q.push(e.target);
      }
    }
  }
  return { fallback: true, order: out };
}
