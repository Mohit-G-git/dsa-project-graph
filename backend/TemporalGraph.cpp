#include "TemporalGraph.h"
#include <iostream>
#include <algorithm>
#include <sstream>
#include <cmath>
#include <map>
#include <queue>
#include <tuple> // For shortestTemporalPath

using namespace std;

// ==================== TEMPORAL GRAPH CLASS ====================

TemporalGraph::TemporalGraph() : maxTime(0) {}

// Add node
bool TemporalGraph::addNode(const string& nodeName) {
    if (find(nodes.begin(), nodes.end(), nodeName) == nodes.end()) {
        if (nodes.size() < 50) {
            nodes.push_back(nodeName);
            return true;
        }
    }
    return false;
}

// Add edge
bool TemporalGraph::addEdge(const string& src, const string& dst, const vector<int>& times) {
    bool srcExists = find(nodes.begin(), nodes.end(), src) != nodes.end();
    bool dstExists = find(nodes.begin(), nodes.end(), dst) != nodes.end();
    
    if (!srcExists || !dstExists || times.empty()) {
        return false;
    }
    
    edges.push_back(TemporalEdge(src, dst, times));
    
    int maxEdgeTime = *max_element(times.begin(), times.end());
    if (maxEdgeTime > maxTime) {
        maxTime = maxEdgeTime;
    }
    
    return true;
}

// Get active edges at specific time
vector<TemporalEdge> TemporalGraph::getActiveEdges(int currentTime) const {
    vector<TemporalEdge> active;
    for (const auto& edge : edges) {
        if (find(edge.times.begin(), edge.times.end(), currentTime) != edge.times.end()) {
            active.push_back(edge);
        }
    }
    return active;
}

// Get active nodes at specific time
set<string> TemporalGraph::getActiveNodes(int currentTime) const {
    set<string> activeNodes;
    vector<TemporalEdge> active = getActiveEdges(currentTime);
    for (const auto& edge : active) {
        activeNodes.insert(edge.src);
        activeNodes.insert(edge.dst);
    }
    return activeNodes;
}

// ==================== TEMPORAL BFS ====================
vector<BFSResult> TemporalGraph::temporalBFS(const string& startNode, int startTime) const {
    if (find(nodes.begin(), nodes.end(), startNode) == nodes.end()) {
        return vector<BFSResult>();
    }
    
    set<string> visited;
    queue<BFSResult> q;
    vector<BFSResult> result;
    
    q.push(BFSResult(startNode, startTime));
    
    while (!q.empty()) {
        BFSResult current = q.front();
        q.pop();
        
        string key = current.node + "-" + to_string(current.time);
        
        if (visited.find(key) != visited.end()) {
            continue;
        }
        
        visited.insert(key);
        result.push_back(current);
        
        // Find neighbors at this time or later
        for (const auto& edge : edges) {
            if (edge.src == current.node) {
                // Find next available time >= current time
                for (int t : edge.times) {
                    if (t >= current.time) {
                        q.push(BFSResult(edge.dst, t));
                        break; // Take first available time
                    }
                }
            }
        }
    }
    
    return result;
}

// ==================== SHORTEST TEMPORAL PATH ====================
PathResult TemporalGraph::shortestTemporalPath(const string& start, const string& end, int startTime) const {
    if (find(nodes.begin(), nodes.end(), start) == nodes.end() ||
        find(nodes.begin(), nodes.end(), end) == nodes.end()) {
        return PathResult();
    }
    
    map<string, pair<vector<string>, int>> visited;
    queue<tuple<string, int, vector<string>>> q;
    
    vector<string> initialPath = {start};
    q.push(make_tuple(start, startTime, initialPath));
    
    while (!q.empty()) {
        auto current = q.front();
        q.pop();
        
        string node = get<0>(current);
        int time = get<1>(current);
        vector<string> path = get<2>(current);
        
        if (node == end) {
            return PathResult(path, time);
        }
        
        string key = node + "-" + to_string(time);
        if (visited.find(key) != visited.end()) {
            continue;
        }
        
        visited[key] = make_pair(path, time);
        
        // Explore neighbors
        for (const auto& edge : edges) {
            if (edge.src == node) {
                for (int t : edge.times) {
                    if (t >= time) {
                        vector<string> newPath = path;
                        newPath.push_back(edge.dst);
                        q.push(make_tuple(edge.dst, t, newPath));
                        break;
                    }
                }
            }
        }
    }
    
    return PathResult(); // No path found
}

// ==================== DIJKSTRA SHORTEST PATH ====================
// Dijkstra's algorithm for temporal graphs
// Finds the path with minimum total time cost (considering waiting times)
PathResult TemporalGraph::dijkstraShortestPath(const string& start, const string& end, int startTime) const {
    if (find(nodes.begin(), nodes.end(), start) == nodes.end() ||
        find(nodes.begin(), nodes.end(), end) == nodes.end()) {
        return PathResult();
    }
    
    // Priority queue: (cost, time, node, path)
    // cost = total time elapsed (arrival_time - start_time)
    priority_queue<tuple<int, int, string, vector<string>>, 
                   vector<tuple<int, int, string, vector<string>>>,
                   greater<tuple<int, int, string, vector<string>>>> pq;
    
    // Track best cost to reach each (node, time) pair
    map<pair<string, int>, int> bestCost;
    
    vector<string> initialPath = {start};
    pq.push(make_tuple(0, startTime, start, initialPath));
    bestCost[make_pair(start, startTime)] = 0;
    
    while (!pq.empty()) {
        auto current = pq.top();
        pq.pop();
        
        int currentCost = get<0>(current);
        int currentTime = get<1>(current);
        string currentNode = get<2>(current);
        vector<string> currentPath = get<3>(current);
        
        // If we reached the destination, return the path
        if (currentNode == end) {
            return PathResult(currentPath, currentTime);
        }
        
        // Skip if we've already found a better path to this state
        auto key = make_pair(currentNode, currentTime);
        if (bestCost.find(key) != bestCost.end() && bestCost[key] < currentCost) {
            continue;
        }
        
        // Explore all outgoing edges from current node
        for (const auto& edge : edges) {
            if (edge.src == currentNode) {
                // Find the next available time for this edge (>= currentTime)
                for (int edgeTime : edge.times) {
                    if (edgeTime >= currentTime) {
                        int newCost = edgeTime - startTime; // Total elapsed time
                        auto nextKey = make_pair(edge.dst, edgeTime);
                        
                        // Only explore if this is a better path
                        if (bestCost.find(nextKey) == bestCost.end() || 
                            bestCost[nextKey] > newCost) {
                            
                            bestCost[nextKey] = newCost;
                            
                            vector<string> newPath = currentPath;
                            newPath.push_back(edge.dst);
                            
                            pq.push(make_tuple(newCost, edgeTime, edge.dst, newPath));
                        }
                        
                        break; // Only consider the earliest available time
                    }
                }
            }
        }
    }
    
    return PathResult(); // No path found
}

// ==================== TEMPORAL CENTRALITY ====================
map<string, int> TemporalGraph::computeCentrality(int currentTime) const {
    map<string, int> centrality;
    
    for (const auto& node : nodes) {
        vector<BFSResult> reachable = temporalBFS(node, currentTime);
        centrality[node] = reachable.size() - 1; // Exclude the node itself
    }
    
    return centrality;
}

// ==================== TEMPORAL CONNECTIVITY ====================
bool TemporalGraph::isTemporallyConnected(const string& src, const string& dst, int startTime) const {
    vector<BFSResult> reachable = temporalBFS(src, startTime);
    for (const auto& r : reachable) {
        if (r.node == dst) return true;
    }
    return false;
}

// ==================== TEMPORAL DEGREE ====================
pair<int, int> TemporalGraph::getTemporalDegree(const string& node, int currentTime) const {
    int inDegree = 0;
    int outDegree = 0;
    
    for (const auto& edge : edges) {
        if (find(edge.times.begin(), edge.times.end(), currentTime) != edge.times.end()) {
            if (edge.src == node) outDegree++;
            if (edge.dst == node) inDegree++;
        }
    }
    
    return make_pair(inDegree, outDegree);
}

// ==================== EXPORT TO JSON ====================
string TemporalGraph::toJSON() const {
    stringstream ss;
    ss << "{\n";
    ss << "  \"nodes\": [";
    for (size_t i = 0; i < nodes.size(); i++) {
        ss << "\"" << nodes[i] << "\"";
        if (i < nodes.size() - 1) ss << ", ";
    }
    ss << "],\n";
    
    ss << "  \"edges\": [\n";
    for (size_t i = 0; i < edges.size(); i++) {
        ss << "    {\n";
        ss << "      \"src\": \"" << edges[i].src << "\",\n";
        ss << "      \"dst\": \"" << edges[i].dst << "\",\n";
        ss << "      \"times\": [";
        for (size_t j = 0; j < edges[i].times.size(); j++) {
            ss << edges[i].times[j];
            if (j < edges[i].times.size() - 1) ss << ", ";
        }
        ss << "]\n";
        ss << "    }";
        if (i < edges.size() - 1) ss << ",";
        ss << "\n";
    }
    ss << "  ],\n";
    ss << "  \"maxTime\": " << maxTime << "\n";
    ss << "}\n";
    
    return ss.str();
}

// ==================== STATISTICS ====================
void TemporalGraph::printStatistics(int currentTime) const {
    cout << "\n=== Graph Statistics at t=" << currentTime << " ===\n";
    cout << "Total Nodes: " << nodes.size() << "/50\n";
    cout << "Total Edges: " << edges.size() << "\n";
    
    set<string> activeNodes = getActiveNodes(currentTime);
    vector<TemporalEdge> activeEdges = getActiveEdges(currentTime);
    
    cout << "Active Nodes: " << activeNodes.size() << "\n";
    cout << "Active Edges: " << activeEdges.size() << "\n";
    cout << "Max Time: " << maxTime << "\n";
    if (nodes.size() > 1) {
        cout << "Graph Density: " << fixed 
             << (edges.size() / (double)(nodes.size() * (nodes.size() - 1))) << "\n";
    } else {
        cout << "Graph Density: 0\n";
    }
    cout << "=====================================\n\n";
}

// ==================== GETTERS ====================
const vector<string>& TemporalGraph::getNodes() const { return nodes; }
const vector<TemporalEdge>& TemporalGraph::getEdges() const { return edges; }
int TemporalGraph::getMaxTime() const { return maxTime; }
size_t TemporalGraph::getNodeCount() const { return nodes.size(); }
size_t TemporalGraph::getEdgeCount() const { return edges.size(); }