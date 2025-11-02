#ifndef TEMPORAL_GRAPH_H
#define TEMPORAL_GRAPH_H

#include <vector>
#include <string>
#include <limits>
//#include <optional>
#include <utility>  // Added for std::pair

struct TemporalEdge {
    int src;    // 1-based index
    int dst;    // 1-based index
    int weight; // non-negative weight
    int start;  // inclusive start time
    int end;    // inclusive end time

    TemporalEdge() : src(0), dst(0), weight(0), start(0), end(0) {}
    TemporalEdge(int s, int d, int w, int st, int en)
        : src(s), dst(d), weight(w), start(st), end(en) {}
};

struct PathResult {
    std::vector<int> path; // sequence of node indices (1-based)
    long long cost;        // total weight (for weighted algorithms)
    bool found;
    
    PathResult() : cost(std::numeric_limits<long long>::max()), found(false) {}
};

class TemporalGraph {
public:
    TemporalGraph();

    // Build/reset graph with n nodes
    void init(int n);

    // Add edge (undirected by default)
    void addEdge(int u, int v, int weight, int startTime, int endTime, bool directed = false);

    // Get neighbors active at time t
    std::vector<std::pair<int, int>> neighbors(int u, int t) const; // (v, weight)

    // Algorithms at a fixed time t (only edges with start<=t<=end are considered)
    std::vector<int> bfs(int start, int t) const;
    std::vector<int> dfs(int start, int t) const;
    PathResult dijkstra(int start, int target, int t) const;
    PathResult astar(int start, int target, int t) const; // heuristic = 0 (placeholder)

    // Utilities
    int nodeCount() const;
    size_t edgeCount() const;

private:
    int nNodes;
    std::vector<TemporalEdge> edges;
};

#endif // TEMPORAL_GRAPH_H