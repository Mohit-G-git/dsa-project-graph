// This entire file is only included in WebAssembly builds
#ifdef __EMSCRIPTEN__

#include <emscripten/emscripten.h>
#include <emscripten/bind.h>
#include "TemporalGraph.h"
#include "GraphUtils.h"

using namespace emscripten;
using namespace std;

// ==================== WEBASSEMBLY BINDINGS (updated for integer-node API) ====================

EMSCRIPTEN_BINDINGS(temporal_graph_structs) {
    // TemporalEdge { int src, dst, weight, start, end }
    value_object<TemporalEdge>("TemporalEdge")
        .field("src", &TemporalEdge::src)
        .field("dst", &TemporalEdge::dst)
        .field("weight", &TemporalEdge::weight)
        .field("start", &TemporalEdge::start)
        .field("end", &TemporalEdge::end);

    // PathResult { vector<int> path; long long cost; bool found; }
    value_object<PathResult>("PathResult")
        .field("path", &PathResult::path)
        .field("cost", &PathResult::cost)
        .field("found", &PathResult::found);

    register_vector<int>("VectorInt");
    register_vector<TemporalEdge>("VectorTemporalEdge");
}

EMSCRIPTEN_BINDINGS(temporal_graph_main) {
    class_<TemporalGraph>("TemporalGraph")
        .constructor<>()
        .function("init", &TemporalGraph::init)
        .function("addEdge", &TemporalGraph::addEdge)
<<<<<<< HEAD
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
    
=======
        .function("bfs", &TemporalGraph::bfs)
        .function("dfs", &TemporalGraph::dfs)
        .function("dijkstra", &TemporalGraph::dijkstra)
        .function("astar", &TemporalGraph::astar)
        .function("nodeCount", &TemporalGraph::nodeCount)
        .function("edgeCount", &TemporalGraph::edgeCount);

>>>>>>> a8abc21f82acae05b04d85f467b274f20a949f91
    function("loadSampleGraph", &loadSampleGraph);
    function("generateRandomGraph", &generateRandomGraph);
}

#endif // __EMSCRIPTEN__