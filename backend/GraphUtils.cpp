#include "GraphUtils.h"
#include <vector>
#include <string>
#include <ctime>
#include <algorithm>
#include <cstdlib> // For rand()

using namespace std;

// Load sample graph
TemporalGraph loadSampleGraph() {
    TemporalGraph graph;
    
    // Add nodes
    vector<string> sampleNodes = {"A", "B", "C", "D", "E", "F", "G", "H", "I", "J"};
    for (const auto& node : sampleNodes) {
        graph.addNode(node);
    }
    
    // Add edges
    graph.addEdge("A", "B", {0, 1, 2, 5});
    graph.addEdge("A", "C", {0, 1});
    graph.addEdge("B", "D", {1, 2, 3, 4});
    graph.addEdge("C", "D", {2, 3, 4});
    graph.addEdge("D", "E", {3, 4, 5, 6});
    graph.addEdge("E", "F", {5, 6, 7});
    graph.addEdge("F", "G", {6, 7, 8});
    graph.addEdge("G", "H", {7, 8, 9});
    graph.addEdge("B", "E", {4, 5, 6});
    graph.addEdge("C", "F", {5, 6});
    graph.addEdge("A", "E", {8, 9});
    graph.addEdge("H", "I", {8, 9, 10});
    graph.addEdge("I", "J", {9, 10});
    graph.addEdge("D", "H", {6, 7, 8});
    
    return graph;
}

// Generate random graph
TemporalGraph generateRandomGraph(int numNodes, double edgeDensity, int maxTime) {
    TemporalGraph graph;
    
    // Add nodes
    for (int i = 0; i < min(numNodes, 50); i++) {
        graph.addNode("N" + to_string(i));
    }
    
    // Add random edges
    srand(time(0));
    for (int i = 0; i < numNodes; i++) {
        for (int j = 0; j < numNodes; j++) {
            if (i != j && (rand() / (double)RAND_MAX) < edgeDensity) {
                int numTimes = rand() % 4 + 1;
                vector<int> times;
                for (int k = 0; k < numTimes; k++) {
                    times.push_back(rand() % (maxTime + 1));
                }
                sort(times.begin(), times.end());
                times.erase(unique(times.begin(), times.end()), times.end());
                
                if (!times.empty()) {
                    graph.addEdge("N" + to_string(i), "N" + to_string(j), times);
                }
            }
        }
    }
    
    return graph;
}