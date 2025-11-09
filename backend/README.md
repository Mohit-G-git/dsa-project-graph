# Temporal Graph Backend (C++)

A high-performance C++ implementation of temporal graph algorithms with optional WebAssembly support.

## Features

### Core Data Structures
- **TemporalEdge**: Edges with multiple timestamps
- **TemporalGraph**: Graph with up to 50 nodes
- **BFSResult**: Node-time pairs for traversal results
- **PathResult**: Path with arrival time

### Algorithms Implemented

1. **Temporal BFS** (`temporalBFS`)
   - Breadth-first search respecting temporal ordering
   - Returns all reachable nodes with arrival times

2. **Shortest Temporal Path** (`shortestTemporalPath`)
   - BFS-based earliest arrival path
   - Finds path with minimum arrival time

3. **Dijkstra Shortest Path** (`dijkstraShortestPath`) ⭐ NEW
   - Priority queue-based optimal path finding
   - Minimizes total time cost (considers waiting times)
   - More accurate than BFS for complex temporal networks
   - **Time Complexity**: O((V + E) log V)

4. **Temporal Centrality** (`computeCentrality`)
   - Computes reachability for each node
   - Identifies important nodes in the network

5. **Temporal Connectivity** (`isTemporallyConnected`)
   - Checks if a path exists between two nodes

6. **Temporal Degree** (`getTemporalDegree`)
   - In-degree and out-degree at specific time

### Utility Functions
- `getActiveEdges(time)`: Get edges active at specific time
- `getActiveNodes(time)`: Get nodes active at specific time
- `toJSON()`: Export graph to JSON format
- `printStatistics(time)`: Display graph statistics

## Build Instructions

### Native Build (CLI Application)

Using Make:
```bash
cd backend
make
./temporal_graph
```

Manual compilation:
```bash
cd backend
g++ -std=c++17 -O2 main.cpp TemporalGraph.cpp GraphUtils.cpp -o temporal_graph
./temporal_graph
```

### WebAssembly Build (for Frontend)

Requires Emscripten SDK:
```bash
cd backend
emcc -std=c++17 -lembind \
  bindings.cpp TemporalGraph.cpp GraphUtils.cpp \
  -o temporal_graph.js \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="TemporalGraphModule" \
  -O3
```

## Usage Example

```cpp
#include "TemporalGraph.h"
#include "GraphUtils.h"

int main() {
    // Create graph
    TemporalGraph graph;
    
    // Add nodes
    graph.addNode("A");
    graph.addNode("B");
    graph.addNode("C");
    
    // Add temporal edges
    graph.addEdge("A", "B", {0, 2, 4});  // A->B at times 0, 2, 4
    graph.addEdge("B", "C", {1, 3, 5});  // B->C at times 1, 3, 5
    
    // Run Dijkstra's algorithm
    PathResult path = graph.dijkstraShortestPath("A", "C", 0);
    
    if (path.arrivalTime >= 0) {
        std::cout << "Path found: ";
        for (const auto& node : path.path) {
            std::cout << node << " ";
        }
        std::cout << "\nArrival time: " << path.arrivalTime << std::endl;
        std::cout << "Total cost: " << (path.arrivalTime - 0) << std::endl;
    }
    
    return 0;
}
```

## Dijkstra vs BFS Comparison

| Feature | BFS (`shortestTemporalPath`) | Dijkstra (`dijkstraShortestPath`) |
|---------|------------------------------|-------------------------------------|
| **Strategy** | First path found | Optimal path with min cost |
| **Cost Metric** | Hop count | Total time elapsed |
| **Waiting Time** | Not optimized | Optimized |
| **Use Case** | Fast, simple paths | Best quality paths |
| **Time Complexity** | O(V + E) | O((V + E) log V) |

## CLI Menu Options

```
1.  Add Node
2.  Add Edge
3.  Display Statistics
4.  Run Temporal BFS
5.  Find Shortest Temporal Path (BFS)
6.  Find Shortest Path (Dijkstra)      ⭐ NEW
7.  Compute Temporal Centrality
8.  Check Temporal Connectivity
9.  Get Node Temporal Degree
10. Display Active Edges
11. Load Sample Graph
12. Generate Random Graph
13. Export to JSON
0.  Exit
```

## File Structure

```
backend/
├── TemporalGraph.h          # Main class header
├── TemporalGraph.cpp        # Implementation (includes Dijkstra)
├── GraphUtils.h             # Utility functions header
├── GraphUtils.cpp           # Sample/random graph generators
├── main.cpp                 # CLI application
├── bindings.cpp             # WebAssembly bindings
├── Makefile                 # Build configuration
└── temporal_graph.json      # Sample graph data
```

## Dependencies

- C++17 or later
- Standard Template Library (STL)
- For WebAssembly: Emscripten SDK

## License

MIT License
