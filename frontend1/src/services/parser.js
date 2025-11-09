/**
 * Parser for the temporal graph text format.
 * Format:
 * Line 1: n m duration
 * Next m lines: source target weight startTime endTime
 */
export function parseGraphTxt(content) {
  try {
    const lines = content.trim().split("\n");
    if (lines.length === 0) throw new Error("Empty file");

    // Parse first line: n m duration
    const [n, m, duration] = lines[0].trim().split(/\s+/).map(Number);
    if (isNaN(n) || isNaN(m) || isNaN(duration)) {
      throw new Error(
        "Invalid first line format. Expected: numberOfNodes numberOfEdges duration"
      );
    }

    // Parse m edge lines
    const edges = [];
    for (let i = 1; i <= m; i++) {
      if (i >= lines.length) {
        throw new Error(`Expected ${m} edges but found only ${i - 1}`);
      }
      const [source, target, weight, startTime, endTime] = lines[i]
        .trim()
        .split(/\s+/);
      if (
        !source ||
        !target ||
        isNaN(weight) ||
        isNaN(startTime) ||
        isNaN(endTime)
      ) {
        throw new Error(
          `Invalid edge format at line ${
            i + 1
          }. Expected: source target weight startTime endTime`
        );
      }
      edges.push({
        source: source.toString(),
        target: target.toString(),
        weight: Number(weight),
        time: Number(startTime),
        endTime: Number(endTime),
      });
    }

    // Create nodes set from edges
    const nodesSet = new Set();
    edges.forEach((e) => {
      nodesSet.add(e.source);
      nodesSet.add(e.target);
    });

    return {
      nodes: Array.from(nodesSet).map((id) => ({ id, label: id })),
      edges,
      metadata: {
        expectedNodes: n,
        expectedEdges: m,
        duration,
      },
    };
  } catch (err) {
    throw new Error("Failed to parse graph txt: " + (err.message || err));
  }
}
