import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";
import type { AlgorithmName } from "@/atoms/selections";
import aStar from "./astar";
import dijkstra from "./dijkstra";
import bidirectional from "./bidirectional";

export type AlgorithmFn = (
    startNode: Node,
    endNode: Node,
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    speed: number,
) => Promise<boolean>;

export const algorithms: Record<AlgorithmName, AlgorithmFn> = {
    "A*": aStar,
    Dijkstra: dijkstra,
    Bidirectional: bidirectional,
};

export const algorithmNames = Object.keys(algorithms) as AlgorithmName[];
