// This entire file will be excluded from WebAssembly builds
#ifndef __EMSCRIPTEN__

#include <iostream>
#include <string>
#include <sstream>
#include <fstream>
#include <map>
#include "TemporalGraph.h"
#include "GraphUtils.h"

using namespace std;

TemporalGraph loadGraphFromFile(const string& filename) {
    TemporalGraph graph;
    ifstream infile(filename);
    
    if (!infile.is_open()) {
        cerr << "Error: Could not open file '" << filename << "'\n";
        return graph;
    }
    
    int numNodes, numEdges, totalTime;
    infile >> numNodes >> numEdges >> totalTime;
    
    cout << "Reading graph from '" << filename << "':\n";
    cout << "  Nodes: " << numNodes << "\n";
    cout << "  Edges: " << numEdges << "\n";
    cout << "  Total Time: " << totalTime << "\n";
    
    graph.init(numNodes);
    
    for (int i = 0; i < numEdges; i++) {
        int node1, node2, weight, startTime, endTime;
        infile >> node1 >> node2 >> weight >> startTime >> endTime;
        
        // Add edge (undirected by default)
        graph.addEdge(node1, node2, weight, startTime, endTime, false);
        
        cout << "  Edge " << (i+1) << ": " << node1 << " <-> " << node2 
             << " (weight=" << weight << ", active=[" << startTime << "," << endTime << "])\n";
    }
    
    infile.close();
    cout << "Graph loaded successfully!\n";
    return graph;
}

void displayMenu() {
    cout << "\n========== TEMPORAL GRAPH VISUALIZER (C++ Backend) ==========\n";
    cout << "1.  Load Graph from File (input.txt)\n";
    cout << "2.  Load Sample Graph\n";
    cout << "3.  Generate Random Graph\n";
    cout << "4.  Display Info\n";
    cout << "5.  Run BFS\n";
    cout << "6.  Run DFS\n";
    cout << "7.  Find Shortest Path (Dijkstra)\n";
    cout << "8.  Find Shortest Path (A*)\n";
    cout << "0.  Exit\n";
    cout << "=============================================================\n";
    cout << "Enter choice: ";
}

int main() {
    TemporalGraph graph;
    int choice;
    
    cout << "Welcome to Temporal Graph Visualizer (C++ Backend)!\n";
    cout << "Loading graph from input.txt...\n";
    graph = loadGraphFromFile("input.txt");
    
    while (true) {
        displayMenu();
        cin >> choice;
        
        switch (choice) {
            case 1: { // Load Graph from File
                graph = loadGraphFromFile("input.txt");
                break;
            }
            
            case 2: { // Load Sample Graph
                graph = loadSampleGraph();
                cout << "Sample graph loaded!\n";
                break;
            }
            
            case 3: { // Generate Random Graph
                int numNodes;
                double density;
                int maxT;
                cout << "Enter number of nodes: ";
                cin >> numNodes;
                cout << "Enter edge density (0.0-1.0): ";
                cin >> density;
                cout << "Enter max time: ";
                cin >> maxT;
                
                graph = generateRandomGraph(numNodes, density, maxT);
                cout << "Random graph generated with " << numNodes << " nodes!\n";
                break;
            }
            
            case 4: { // Display Info
                cout << "\n=== Graph Information ===\n";
                cout << "Total Nodes: " << graph.nodeCount() << "\n";
                cout << "Total Edges: " << graph.edgeCount() << "\n";
                cout << "========================\n";
                break;
            }
            
            case 5: { // BFS
                int start, t;
                cout << "Enter start node (1-based): ";
                cin >> start;
                cout << "Enter time: ";
                cin >> t;
                
                auto result = graph.bfs(start, t);
                cout << "\nBFS from node " << start << " at t=" << t << ":\n";
                for (size_t i = 0; i < result.size(); i++) {
                    if (i > 0) cout << " -> ";
                    cout << result[i];
                }
                cout << "\nTotal nodes visited: " << result.size() << "\n";
                break;
            }
            
            case 6: { // DFS
                int start, t;
                cout << "Enter start node (1-based): ";
                cin >> start;
                cout << "Enter time: ";
                cin >> t;
                
                auto result = graph.dfs(start, t);
                cout << "\nDFS from node " << start << " at t=" << t << ":\n";
                for (size_t i = 0; i < result.size(); i++) {
                    if (i > 0) cout << " -> ";
                    cout << result[i];
                }
                cout << "\nTotal nodes visited: " << result.size() << "\n";
                break;
            }
            
            case 7: { // Dijkstra
                int start, target, t;
                cout << "Enter start node (1-based): ";
                cin >> start;
                cout << "Enter target node: ";
                cin >> target;
                cout << "Enter time: ";
                cin >> t;
                
                PathResult path = graph.dijkstra(start, target, t);
                if (path.found) {
                    cout << "\nShortest path from " << start << " to " << target << ":\n";
                    for (size_t i = 0; i < path.path.size(); i++) {
                        if (i > 0) cout << " -> ";
                        cout << path.path[i];
                    }
                    cout << "\nTotal cost: " << path.cost << "\n";
                } else {
                    cout << "No path found!\n";
                }
                break;
            }
            
            case 8: { // A*
                int start, target, t;
                cout << "Enter start node (1-based): ";
                cin >> start;
                cout << "Enter target node: ";
                cin >> target;
                cout << "Enter time: ";
                cin >> t;
                
                PathResult path = graph.astar(start, target, t);
                if (path.found) {
                    cout << "\nShortest path from " << start << " to " << target << " (A*):\n";
                    for (size_t i = 0; i < path.path.size(); i++) {
                        if (i > 0) cout << " -> ";
                        cout << path.path[i];
                    }
                    cout << "\nTotal cost: " << path.cost << "\n";
                } else {
                    cout << "No path found!\n";
                }
                break;
            }
            
            case 0:
                cout << "Thank you for using Temporal Graph Visualizer!\n";
                return 0;
            
            default:
                cout << "Invalid choice.\n";
        }
    }
}

#endif // __EMSCRIPTEN__