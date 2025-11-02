#ifndef GRAPH_UTILS_H
#define GRAPH_UTILS_H

#include "TemporalGraph.h"

// Load sample graph (numeric nodes 1..n)
TemporalGraph loadSampleGraph();

// Generate random graph with given node count, edge density and max time
TemporalGraph generateRandomGraph(int numNodes, double edgeDensity, int maxTime);

#endif // GRAPH_UTILS_H