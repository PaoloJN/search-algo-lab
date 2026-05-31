import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";
import type { AlgorithmName, Metrics } from "@/atoms/selections";
import aStar from "./astar";
import dijkstra from "./dijkstra";
import bidirectional from "./bidirectional";

export type AlgorithmResult = { found: boolean; pathLen: number };

export type AlgorithmFn = (
    startNode: Node,
    endNode: Node,
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    speed: number,
    onMetrics?: (m: Metrics) => void,
) => Promise<AlgorithmResult>;

export const algorithms: Record<AlgorithmName, AlgorithmFn> = {
    "A*": aStar,
    Dijkstra: dijkstra,
    Bidirectional: bidirectional,
};

export const algorithmNames = Object.keys(algorithms) as AlgorithmName[];
