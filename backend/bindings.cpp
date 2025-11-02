// This entire file is only included in WebAssembly builds
#ifdef __EMSCRIPTEN__

#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include "TemporalGraph.h"
#include "GraphUtils.h"

using namespace emscripten;
using namespace std;

// ==================== WEBASSEMBLY BINDINGS ====================

// Need to register vector<BFSResult> and PathResult to pass them to JS
// Note: You may need to bind these structs if you get compile errors
// For now, we bind the main class and functions.
// Let's bind BFSResult and PathResult for completeness.

EMSCRIPTEN_BINDINGS(temporal_graph_structs) {
    
    value_object<BFSResult>("BFSResult")
        .field("node", &BFSResult::node)
        .field("time", &BFSResult::time);
        
    value_object<PathResult>("PathResult")
        .field("path", &PathResult::path)
        .field("arrivalTime", &PathResult::arrivalTime);
        
    // Register std::vector<BFSResult>
    register_vector<BFSResult>("VectorBFSResult");
    // Register std::vector<string>
    register_vector<string>("VectorString");
    // Register map<string, int>
    register_map<string, int>("MapStringInt");
}


EMSCRIPTEN_BINDINGS(temporal_graph_main) {
    class_<TemporalGraph>("TemporalGraph")
        .constructor<>()
        .function("addNode", &TemporalGraph::addNode)
        .function("addEdge", &TemporalGraph::addEdge)
        .function("temporalBFS", &TemporalGraph::temporalBFS)
        .function("shortestTemporalPath", &TemporalGraph::shortestTemporalPath)
        .function("dijkstraShortestPath", &TemporalGraph::dijkstraShortestPath)
        .function("computeCentrality", &TemporalGraph::computeCentrality)
        .function("isTemporallyConnected", &TemporalGraph::isTemporallyConnected)
        .function("getTemporalDegree", &TemporalGraph::getTemporalDegree)
        .function("getActiveEdges", &TemporalGraph::getActiveEdges)
        .function("getActiveNodes", &TemporalGraph::getActiveNodes)
        .function("getNodeCount", &TemporalGraph::getNodeCount)
        .function("getEdgeCount", &TemporalGraph::getEdgeCount)
        .function("toJSON", &TemporalGraph::toJSON)
        .function("getNodes", &TemporalGraph::getNodes)
        .function("getEdges", &TemporalGraph::getEdges)
        .function("getMaxTime", &TemporalGraph::getMaxTime);
    
    function("loadSampleGraph", &loadSampleGraph);
    function("generateRandomGraph", &generateRandomGraph);
    
    // We also need to bind TemporalEdge to return it
    value_object<TemporalEdge>("TemporalEdge")
        .field("src", &TemporalEdge::src)
        .field("dst", &TemporalEdge::dst)
        .field("times", &TemporalEdge::times);
        
    register_vector<TemporalEdge>("VectorTemporalEdge");
    register_vector<int>("VectorInt");
    register_set<string>("SetString");
    register_pair<int, int>("PairIntInt");
}

#endif // __EMSCRIPTEN__