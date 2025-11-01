#ifndef GRAPH_UTILS_H
#define GRAPH_UTILS_H

#include "TemporalGraph.h"

// Load sample graph
TemporalGraph loadSampleGraph();

// Generate random graph
TemporalGraph generateRandomGraph(int numNodes, double edgeDensity, int maxTime);

#endif // GRAPH_UTILS_H