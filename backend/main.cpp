// This entire file will be excluded from WebAssembly builds
#ifndef __EMSCRIPTEN__

#include <iostream>
#include <string>
#include <sstream>
#include <fstream>
#include "TemporalGraph.h"

using namespace std;

// (Old interactive menu removed — CLI input/read mode used instead)

int main() {
    TemporalGraph graph;
    cout << "Temporal Graph CLI (interval-based edges)\n";
    cout << "Input format (from stdin or redirected file):\n";
    cout << "n m T\n";
    cout << "then m lines: u v weight start end\n";
    cout << "Nodes are 1..n. Edges are treated undirected by default.\n";
    cout << "After input is read you can run queries interactively.\n\n";

    int n, m, T;
    if (!(cin >> n >> m >> T)) {
        cerr << "Failed to read n m T. Exiting.\n";
        return 1;
    }
    graph.init(n);
    for (int i = 0; i < m; ++i) {
        int u, v, w, s, e;
        if (!(cin >> u >> v >> w >> s >> e)) {
            cerr << "Invalid edge line at index " << i << ", expected 5 integers.\n";
            return 1;
        }
        graph.addEdge(u, v, w, s, e, false);
    }

    cout << "Graph loaded: n=" << n << " m=" << m << " T=" << T << "\n";

    // Interactive loop: simple commands
    // Commands:
    // bfs start time
    // dfs start time
    // dijkstra start target time
    // astar start target time
    // info -> prints nodes/edges counts
    // exit

    string cmd;
    while (true) {
        cout << "\n> ";
        if (!(cin >> cmd)) break;
        if (cmd == "exit") break;
        if (cmd == "info") {
            cout << "Nodes: " << graph.nodeCount() << "\n";
            cout << "Edges: " << graph.edgeCount() << " (each undirected edge stored twice internally)\n";
            continue;
        }

        if (cmd == "bfs") {
            int s, t;
            cin >> s >> t;
            auto order = graph.bfs(s, t);
            cout << "BFS at t=" << t << ": ";
            for (size_t i = 0; i < order.size(); ++i) {
                if (i) cout << " -> ";
                cout << order[i];
            }
            cout << "\n";
            continue;
        }

        if (cmd == "dfs") {
            int s, t;
            cin >> s >> t;
            auto order = graph.dfs(s, t);
            cout << "DFS at t=" << t << ": ";
            for (size_t i = 0; i < order.size(); ++i) {
                if (i) cout << " -> ";
                cout << order[i];
            }
            cout << "\n";
            continue;
        }

        if (cmd == "dijkstra" || cmd == "astar") {
            int s, dest, t;
            cin >> s >> dest >> t;
            PathResult pr;
            if (cmd == "dijkstra") pr = graph.dijkstra(s, dest, t);
            else pr = graph.astar(s, dest, t);

            if (!pr.found) {
                cout << "No path found at t=" << t << " from " << s << " to " << dest << "\n";
            } else {
                cout << "Path (cost=" << pr.cost << "): ";
                for (size_t i = 0; i < pr.path.size(); ++i) {
                    if (i) cout << " -> ";
                    cout << pr.path[i];
                }
                cout << "\n";
            }
            continue;
        }

        cout << "Unknown command. Available: bfs, dfs, dijkstra, astar, info, exit\n";
        // flush rest of line
        string rest;
        getline(cin, rest);
    }

    cout << "Exiting.\n";
    return 0;
}

#endif // __EMSCRIPTEN__