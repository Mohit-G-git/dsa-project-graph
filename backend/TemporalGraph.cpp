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

// A* using an admissible heuristic computed from BFS hop-distance
// multiplied by the minimum active edge weight at time t. If no
// active edges are present or min weight is 0, the heuristic is 0
// and A* behaves like Dijkstra.
PathResult TemporalGraph::astar(int start, int target, int t) const {
    PathResult res;
    if (start <= 0 || start > nNodes) return res;
    const long long INF = numeric_limits<long long>::max() / 4;

    // 1) Build reverse adjacency for active edges at time t to compute
    // hop-distance from every node to the target (BFS on reverse graph).
    vector<vector<int>> revAdj(nNodes + 1);
    long long minActiveWeight = INF;
    for (const auto &e : edges) {
        if (e.start <= t && t <= e.end) {
            // reverse edge for BFS-from-target
            if (e.dst >= 1 && e.dst <= nNodes && e.src >= 1 && e.src <= nNodes)
                revAdj[e.dst].push_back(e.src);
            if (e.weight >= 0 && e.weight < minActiveWeight) minActiveWeight = e.weight;
        }
    }
    if (minActiveWeight == INF) minActiveWeight = 0; // no active edges

    // 2) BFS from target on reversed active graph to get hop distances
    vector<int> hopDist(nNodes + 1, -1);
    if (target >= 1 && target <= nNodes) {
        queue<int> q;
        hopDist[target] = 0;
        q.push(target);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int v : revAdj[u]) {
                if (hopDist[v] == -1) {
                    hopDist[v] = hopDist[u] + 1;
                    q.push(v);
                }
            }
        }
    }

    // 3) A* search
    // g = cost from start to node
    vector<long long> g(nNodes + 1, INF);
    vector<int> parent(nNodes + 1, -1);

    // priority by f = g + h
    using PQItem = pair<long long,int>;
    struct Cmp { bool operator()(const PQItem &a, const PQItem &b) const { return a.first > b.first; } };
    priority_queue<PQItem, vector<PQItem>, Cmp> open;

    auto heuristic = [&](int node)->long long {
        if (node < 1 || node > nNodes) return 0;
        if (hopDist[node] == -1) return 0; // unknown/unreachable -> heuristic 0
        if (minActiveWeight <= 0) return 0; // avoid multiplying by 0
        return (long long)hopDist[node] * minActiveWeight;
    };

    g[start] = 0;
    open.emplace(g[start] + heuristic(start), start);

    while (!open.empty()) {
        PQItem topItem = open.top(); open.pop();
        long long f = topItem.first;
        int u = topItem.second;
        if (u == target) break;
        // If f > g[u] + h(u) then this is an outdated entry; skip
        long long curF = g[u] + heuristic(u);
        if (f != curF) continue;

        for (const auto &neighbor : neighbors(u, t)) {
            int v = neighbor.first;
            int w = neighbor.second;
            if (g[u] + w < g[v]) {
                g[v] = g[u] + w;
                parent[v] = u;
                open.emplace(g[v] + heuristic(v), v);
            }
        }
    }

    if (g[target] == INF) {
        res.found = false;
        return res;
    }

    res.found = true;
    res.cost = g[target];
    int cur = target;
    while (cur != -1) {
        res.path.push_back(cur);
        cur = parent[cur];
    }
    reverse(res.path.begin(), res.path.end());
    return res;
}

int TemporalGraph::nodeCount() const { return nNodes; }
size_t TemporalGraph::edgeCount() const { return edges.size(); }