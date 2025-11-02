#include "GraphUtils.h"
#include "TemporalGraph.h"
#include <vector>
#include <ctime>
#include <algorithm>
#include <cstdlib> // For rand()

using namespace std;

// Load a small numeric sample graph (nodes 1..10)
TemporalGraph loadSampleGraph() {
    TemporalGraph graph;
    int n = 10;
    graph.init(n);

    // Add edges: u v weight start end (undirected)
    graph.addEdge(1, 2, 1, 0, 5);
    graph.addEdge(1, 3, 2, 0, 2);
    graph.addEdge(2, 4, 3, 1, 4);
    graph.addEdge(3, 4, 1, 2, 4);
    graph.addEdge(4, 5, 2, 3, 6);
    graph.addEdge(5, 6, 1, 5, 7);
    graph.addEdge(6, 7, 2, 6, 8);
    graph.addEdge(7, 8, 1, 7, 9);
    graph.addEdge(2, 5, 2, 4, 6);
    graph.addEdge(3, 6, 3, 5, 6);
    graph.addEdge(1, 5, 5, 8, 9);
    graph.addEdge(8, 9, 1, 8, 10);
    graph.addEdge(9, 10, 1, 9, 10);
    graph.addEdge(4, 8, 2, 6, 8);

    return graph;
}

// Generate random graph
TemporalGraph generateRandomGraph(int numNodes, double edgeDensity, int maxTime) {
    TemporalGraph graph;
    int n = min(numNodes, 1000); // allow larger but safe limit
    graph.init(n);

    srand((unsigned)time(0));
    for (int i = 1; i <= n; ++i) {
        for (int j = i+1; j <= n; ++j) {
            double r = rand() / (double)RAND_MAX;
            if (r < edgeDensity) {
                int w = rand() % 10 + 1;
                int s = rand() % (maxTime + 1);
                int e = s + (rand() % (maxTime - s + 1));
                graph.addEdge(i, j, w, s, e, false);
            }
        }
    }

    return graph;
}