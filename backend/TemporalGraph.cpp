#include "TemporalGraph.h"
#include <queue>
#include <stack>
#include <algorithm>
#include <limits>
#include <unordered_map>

using namespace std;

TemporalGraph::TemporalGraph() : nNodes(0) {}

void TemporalGraph::init(int n) {
    nNodes = n;
    edges.clear();
}

void TemporalGraph::addEdge(int u, int v, int weight, int startTime, int endTime, bool directed) {
    if (u <= 0 || v <= 0 || u > nNodes || v > nNodes) return;
    if (startTime > endTime) return;
    edges.emplace_back(u, v, weight, startTime, endTime);
    if (!directed) {
        // add reverse edge for undirected behavior
        edges.emplace_back(v, u, weight, startTime, endTime);
    }
}

vector<pair<int,int>> TemporalGraph::neighbors(int u, int t) const {
    vector<pair<int,int>> nbrs;
    for (const auto& e : edges) {
        if (e.src == u && e.start <= t && t <= e.end) {
            nbrs.emplace_back(e.dst, e.weight);
        }
    }
    return nbrs;
}

vector<int> TemporalGraph::bfs(int start, int t) const {
    vector<int> order;
    if (start <= 0 || start > nNodes) return order;
    vector<char> vis(nNodes + 1, 0);
    queue<int> q;
    q.push(start);
    vis[start] = 1;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (const auto& neighbor : neighbors(u, t)) {
            int v = neighbor.first;
            if (!vis[v]) {
                vis[v] = 1;
                q.push(v);
            }
        }
    }
    return order;
}

vector<int> TemporalGraph::dfs(int start, int t) const {
    vector<int> order;
    if (start <= 0 || start > nNodes) return order;
    vector<char> vis(nNodes + 1, 0);
    stack<int> st;
    st.push(start);
    while (!st.empty()) {
        int u = st.top(); st.pop();
        if (vis[u]) continue;
        vis[u] = 1;
        order.push_back(u);
        // push neighbors in reverse order for deterministic-ish traversal
        auto nbrs = neighbors(u, t);
        for (auto it = nbrs.rbegin(); it != nbrs.rend(); ++it) {
            if (!vis[it->first]) st.push(it->first);
        }
    }
    return order;
}

PathResult TemporalGraph::dijkstra(int start, int target, int t) const {
    PathResult res;
    if (start <= 0 || start > nNodes) return res;
    const long long INF = numeric_limits<long long>::max() / 4;
    vector<long long> dist(nNodes + 1, INF);
    vector<int> parent(nNodes + 1, -1);
    using P = pair<long long,int>;
    priority_queue<P, vector<P>, greater<P>> pq;
    dist[start] = 0;
    pq.emplace(0, start);
    while (!pq.empty()) {
        auto topPair = pq.top(); pq.pop();
        long long d = topPair.first;
        int u = topPair.second;
        if (d != dist[u]) continue;
        if (u == target) break;
        for (const auto& neighbor : neighbors(u, t)) {
            int v = neighbor.first;
            int w = neighbor.second;
            long long nd = d + w;
            if (nd < dist[v]) {
                dist[v] = nd;
                parent[v] = u;
                pq.emplace(nd, v);
            }
        }
    }
    if (dist[target] == INF) {
        res.found = false;
        return res;
    }
    // rebuild path
    res.found = true;
    res.cost = dist[target];
    int cur = target;
    while (cur != -1) {
        res.path.push_back(cur);
        cur = parent[cur];
    }
    reverse(res.path.begin(), res.path.end());
    return res;
}

// A* with zero heuristic (works like Dijkstra). Placeholder for future heuristics.
PathResult TemporalGraph::astar(int start, int target, int t) const {
    return dijkstra(start, target, t);
}

int TemporalGraph::nodeCount() const { return nNodes; }
size_t TemporalGraph::edgeCount() const { return edges.size();}