// This entire file will be excluded from WebAssembly builds
#ifndef __EMSCRIPTEN__

#include <iostream>
#include <string>
#include <sstream>
#include <fstream>
#include "TemporalGraph.h"
#include "GraphUtils.h"

using namespace std;

void displayMenu() {
    cout << "\n========== TEMPORAL GRAPH VISUALIZER (C++ Backend) ==========\n";
    cout << "1.  Add Node\n";
    cout << "2.  Add Edge\n";
    cout << "3.  Display Statistics\n";
    cout << "4.  Run Temporal BFS\n";
    cout << "5.  Find Shortest Temporal Path (BFS)\n";
    cout << "6.  Find Shortest Path (Dijkstra)\n";
    cout << "7.  Compute Temporal Centrality\n";
    cout << "8.  Check Temporal Connectivity\n";
    cout << "9.  Get Node Temporal Degree\n";
    cout << "10. Display Active Edges\n";
    cout << "11. Load Sample Graph\n";
    cout << "12. Generate Random Graph\n";
    cout << "13. Export to JSON\n";
    cout << "0.  Exit\n";
    cout << "=============================================================\n";
    cout << "Enter choice: ";
}

int main() {
    TemporalGraph graph;
    int choice, currentTime = 0;
    string input, src, dst;
    
    cout << "Welcome to Temporal Graph Visualizer (C++ Backend)!\n";
    cout << "Loading sample graph...\n";
    graph = loadSampleGraph();
    
    while (true) {
        displayMenu();
        cin >> choice;
        cin.ignore(); // Consume the newline character
        
        switch (choice) {
            case 1: { // Add Node
                cout << "Enter node name: ";
                getline(cin, input);
                if (graph.addNode(input)) {
                    cout << "Node added successfully!\n";
                } else {
                    cout << "Failed to add node (duplicate or limit reached).\n";
                }
                break;
            }
            
            case 2: { // Add Edge
                cout << "Enter source node: ";
                getline(cin, src);
                cout << "Enter destination node: ";
                getline(cin, dst);
                cout << "Enter timestamps (space-separated): ";
                getline(cin, input);
                
                stringstream ss(input);
                vector<int> times;
                int t;
                while (ss >> t) times.push_back(t);
                
                if (graph.addEdge(src, dst, times)) {
                    cout << "Edge added successfully!\n";
                } else {
                    cout << "Failed to add edge.\n";
                }
                break;
            }
            
            case 3: { // Display Statistics
                cout << "Enter current time: ";
                cin >> currentTime;
                graph.printStatistics(currentTime);
                break;
            }
            
            case 4: { // Temporal BFS
                cout << "Enter start node: ";
                getline(cin, input);
                cout << "Enter start time: ";
                cin >> currentTime;
                
                vector<BFSResult> result = graph.temporalBFS(input, currentTime);
                cout << "\nTemporal BFS from '" << input << "' at t=" << currentTime << ":\n";
                for (const auto& r : result) {
                    cout << r.node << " at t=" << r.time << "\n";
                }
                cout << "Total reachable: " << result.size() << " nodes\n";
                break;
            }
            
            case 5: { // Shortest Path (BFS)
                cout << "Enter start node: ";
                getline(cin, src);
                cout << "Enter end node: ";
                getline(cin, dst);
                cout << "Enter start time: ";
                cin >> currentTime;
                
                PathResult path = graph.shortestTemporalPath(src, dst, currentTime);
                if (path.arrivalTime >= 0) {
                    cout << "\nShortest temporal path (BFS):\n";
                    for (size_t i = 0; i < path.path.size(); i++) {
                        cout << path.path[i];
                        if (i < path.path.size() - 1) cout << " -> ";
                    }
                    cout << "\nArrival time: t=" << path.arrivalTime << "\n";
                } else {
                    cout << "No temporal path found.\n";
                }
                break;
            }
            
            case 6: { // Dijkstra Shortest Path
                cout << "Enter start node: ";
                getline(cin, src);
                cout << "Enter end node: ";
                getline(cin, dst);
                cout << "Enter start time: ";
                cin >> currentTime;
                
                PathResult path = graph.dijkstraShortestPath(src, dst, currentTime);
                if (path.arrivalTime >= 0) {
                    cout << "\nShortest path (Dijkstra):\n";
                    for (size_t i = 0; i < path.path.size(); i++) {
                        cout << path.path[i];
                        if (i < path.path.size() - 1) cout << " -> ";
                    }
                    cout << "\nArrival time: t=" << path.arrivalTime << "\n";
                    cout << "Total cost: " << (path.arrivalTime - currentTime) << " time units\n";
                } else {
                    cout << "No path found.\n";
                }
                break;
            }
            
            case 7: { // Centrality
                cout << "Enter current time: ";
                cin >> currentTime;
                
                map<string, int> centrality = graph.computeCentrality(currentTime);
                cout << "\nTemporal Centrality at t=" << currentTime << ":\n";
                for (const auto& c : centrality) {
                    cout << c.first << ": " << c.second << " reachable nodes\n";
                }
                break;
            }
            
            case 8: { // Connectivity
                cout << "Enter source node: ";
                getline(cin, src);
                cout << "Enter destination node: ";
                getline(cin, dst);
                cout << "Enter start time: ";
                cin >> currentTime;
                
                bool connected = graph.isTemporallyConnected(src, dst, currentTime);
                cout << src << " and " << dst << " are " 
                     << (connected ? "temporally connected" : "NOT temporally connected")
                     << " at t=" << currentTime << "\n";
                break;
            }
            
            case 9: { // Temporal Degree
                cout << "Enter node name: ";
                getline(cin, input);
                cout << "Enter current time: ";
                cin >> currentTime;
                
                auto degree = graph.getTemporalDegree(input, currentTime);
                cout << "Node '" << input << "' at t=" << currentTime << ":\n";
                cout << "In-degree: " << degree.first << "\n";
                cout << "Out-degree: " << degree.second << "\n";
                break;
            }
            
            case 10: { // Active Edges
                cout << "Enter current time: ";
                cin >> currentTime;
                
                vector<TemporalEdge> active = graph.getActiveEdges(currentTime);
                cout << "\nActive edges at t=" << currentTime << ":\n";
                for (const auto& edge : active) {
                    cout << edge.src << " -> " << edge.dst << "\n";
                }
                cout << "Total: " << active.size() << " edges\n";
                break;
            }
            
            case 11: { // Load Sample
                graph = loadSampleGraph();
                cout << "Sample graph loaded!\n";
                break;
            }
            
            case 12: { // Random Graph
                int numNodes;
                double density;
                int maxT;
                cout << "Enter number of nodes (max 50): ";
                cin >> numNodes;
                cout << "Enter edge density (0.0-1.0): ";
                cin >> density;
                cout << "Enter max time: ";
                cin >> maxT;
                
                graph = generateRandomGraph(numNodes, density, maxT);
                cout << "Random graph generated!\n";
                break;
            }
            
            case 13: { // Export JSON
                cout << graph.toJSON();
                
                ofstream file("temporal_graph.json");
                file << graph.toJSON();
                file.close();
                cout << "Graph exported to temporal_graph.json\n";
                break;
            }
            
            case 0:
                cout << "Thank you for using Temporal Graph Visualizer!\n";
                return 0;
            
            default:
                cout << "Invalid choice.\n";
        }
    }
    
    return 0;
}

#endif // __EMSCRIPTEN__