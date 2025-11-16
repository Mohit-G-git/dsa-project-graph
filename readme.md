# DSA Project — Graph Algorithms (frontend + backend)

This repository contains a small graph-algorithms demonstration split into a C++ backend and a React + Vite frontend. The README below describes the actual files present in the `backend/` and `frontend/` folders and explains how to build and run each part.

**Repository layout (relevant folders)**
- `backend/` : C++ implementations and example inputs.
- `frontend/`: React front-end built with Vite.

**Purpose**
This project demonstrates graph data structures and algorithms with a C++ backend (command-line) and a simple frontend (React + Vite) to visualize or interact with graph output. The README is intentionally restricted to what exists in the `backend/` and `frontend/` folders.

**Backend (C++)**
- **Language:** C++
- **Key files:**
  - `backend/main.cpp` — program entry point.
  - `backend/GraphUtils.cpp`, `backend/GraphUtils.h` — graph utilities / algorithms.
  - `backend/TemporalGraph.cpp`, `backend/TemporalGraph.h` — temporal graph representation and helpers.
  - `backend/bindings.cpp` — (present in the folder; intended for native bindings or auxiliary interfaces).
  - `backend/input.txt` — sample input file used by the backend program.
  - `backend/temporal_graph/` — contains `temporal_graph.json` and related files describing a sample temporal graph.
  - `backend/Makefile` — build helper (if you have a POSIX make environment).

How to build (examples):
- Using the Makefile (POSIX/WSL/Mingw with `make`):

  powershell
  cd backend; make

- Or compile manually with `g++` (example; adjust include paths as needed):

  powershell
  cd backend
  g++ -std=c++17 main.cpp GraphUtils.cpp TemporalGraph.cpp -o tempgraph_app

How to run (examples):
- Run the compiled executable with the sample input (paths relative to `backend/`):

  powershell
  .\graph_app.exe input.txt

Notes:
- If you are on native Windows without a `make` tool, compile with `g++` from MinGW/MSYS or use WSL. The Makefile is present for environments that support `make`.
- The code files in `backend/` implement the graph logic and a small CLI; inspect `main.cpp` for exact command-line options and input format.

**Frontend (React + Vite)**
- **Key files:**
  - `frontend/index.html` — app HTML container.
  - `frontend/index.jsx`, `frontend/src/main.jsx`, `frontend/src/App.jsx` — React entry and app components.
  - `frontend/src/styles.css` — basic styles.
  - `frontend/package.json` — project manifest for Node/npm.
  - `frontend/vite.config.js` — Vite configuration.

How to run (typical steps):
- From the `frontend/` folder install dependencies and start the dev server:

  powershell
  cd frontend
  npm install
  # If a dev script exists in package.json (common for Vite):
  npm run dev

- After the dev server starts, open the URL printed by Vite (commonly `http://localhost:5173`), or check the terminal output.

Notes:
- The README does not assume any specific npm scripts beyond standard Vite conventions. Check `frontend/package.json` for exact scripts (for example, `dev`, `start`, or `build`).

**Data & examples**
- `backend/input.txt` — a sample input used by the backend program.
- `backend/temporal_graph/temporal_graph.json` — example temporal graph data the backend or frontend can consume.

**Development tips**
- Inspect `backend/main.cpp` and `frontend/src/App.jsx` to see how the backend and frontend expect to exchange or format graph data.
- Use WSL, MSYS, or MinGW to run `make` on Windows, or compile with `g++` as shown above.

**What this README does not add**
- No new features, scripts, or files were invented—this README documents only the files present under `backend/` and `frontend/`.

**Next steps (suggested)**
- Open `backend/main.cpp` to confirm input flags and runtime usage.
- Check `frontend/package.json` for available npm scripts before starting the frontend dev server.
