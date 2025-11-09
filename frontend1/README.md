# Frontend for dsa-project-graph

Install and run:

1. Open a terminal and run:
   - cd c:\\Users\\mkg31\\OneDrive\\Desktop\\dsa-project-graph\\frontend
   - npm install
   - npm run dev

Notes:

- The frontend will attempt to communicate with your backend by:
  1. HTTP endpoints (/api/graph, /api/bfs)
  2. Loading a WebAssembly/embind bundle placed under frontend/public/backend/
  3. Falling back to local JS implementations for visualization and BFS.
- Do not modify any files in the backend folder.
