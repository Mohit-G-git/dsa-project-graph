#ifndef TEMPORAL_GRAPH_H
#define TEMPORAL_GRAPH_H

#include <vector>
#include <string>
#include <set>
#include <queue>
#include <map>
#include <utility> // For std::pair

// ==================== DATA STRUCTURES ====================

struct TemporalEdge {
    std::string src;
    std::string dst;
    std::vector<int> times;
    
    TemporalEdge() {}
    TemporalEdge(std::string s, std::string d, std::vector<int> t) 
        : src(s), dst(d), times(t) {}
};

struct BFSResult {
    std::string node;
    int time;
    
    BFSResult(std::string n, int t) : node(n), time(t) {}
};

struct PathResult {
    std::vector<std::string> path;
    int arrivalTime;
    
    PathResult() : arrivalTime(-1) {}
    PathResult(std::vector<std::string> p, int t) : path(p), arrivalTime(t) {}
};

// ==================== TEMPORAL GRAPH CLASS ====================

class TemporalGraph {
private:
    std::vector<std::string> nodes;
    std::vector<TemporalEdge> edges;
    int maxTime;
    
public:
    TemporalGraph();
    
    bool addNode(const std::string& nodeName);
    bool addEdge(const std::string& src, const std::string& dst, const std::vector<int>& times);
    
    std::vector<TemporalEdge> getActiveEdges(int currentTime) const;
    std::set<std::string> getActiveNodes(int currentTime) const;
    
    // Algorithms
    std::vector<BFSResult> temporalBFS(const std::string& startNode, int startTime) const;
    PathResult shortestTemporalPath(const std::string& start, const std::string& end, int startTime) const;
    PathResult dijkstraShortestPath(const std::string& start, const std::string& end, int startTime) const;
    std::map<std::string, int> computeCentrality(int currentTime) const;
    bool isTemporallyConnected(const std::string& src, const std::string& dst, int startTime) const;
    std::pair<int, int> getTemporalDegree(const std::string& node, int currentTime) const;
    
    // Utilities
    std::string toJSON() const;
    void printStatistics(int currentTime) const;
    
    // Getters
    const std::vector<std::string>& getNodes() const;
    const std::vector<TemporalEdge>& getEdges() const;
    int getMaxTime() const;
    size_t getNodeCount() const;
    size_t getEdgeCount() const;
};

#endif // TEMPORAL_GRAPH_H