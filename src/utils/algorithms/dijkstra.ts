import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";
import type { Metrics } from "@/atoms/selections";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type NodeMark = "open" | "closed" | "path";
type MetricsReporter = (m: Metrics) => void;

export default async function dijkstra(
    startNode: Node,
    endNode: Node,
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    speed: number,
    onMetrics?: MetricsReporter,
): Promise<{ found: boolean; pathLen: number }> {
    const updateGrid = (node: Node, type: NodeMark) => {
        if ((node.isStart || node.isEnd) && type !== "path") return;
        const el = gridNodeRefs.current[node.id];
        if (!el) return;

        if (type === "open") {
            node.isOpenSet = true;
            node.isClosedSet = false;
            el.classList.add("open-set-node");
            el.classList.remove("closed-set-node");
        } else if (type === "closed") {
            node.isOpenSet = false;
            node.isClosedSet = true;
            el.classList.add("closed-set-node");
            el.classList.remove("open-set-node");
        } else {
            node.isOpenSet = false;
            node.isClosedSet = false;
            node.isPath = true;
            el.classList.add("path-node");
            if (speed !== 0) el.classList.add("animated");
            el.classList.remove("closed-set-node");
            el.classList.remove("open-set-node");
        }
    };

    const t0 = performance.now();
    let explored = 0;
    let frontierSize = 0;

    const openSetQ: Node[] = [];
    const closedSet = new Set<Node>();
    startNode.gCost = 0;
    openSetQ.push(startNode);
    frontierSize = 1;

    while (openSetQ.length > 0) {
        if (speed !== 0) {
            await sleep(speed);
            onMetrics?.({
                explored,
                frontierSize,
                pathLen: null,
                elapsedMs: Math.round(performance.now() - t0),
            });
        }

        const currentNode = openSetQ.shift();
        if (!currentNode) break;
        closedSet.add(currentNode);
        frontierSize = openSetQ.length;
        updateGrid(currentNode, "closed");
        explored++;

        if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
            const path = reconstruct(endNode);
            for (const node of path) {
                if (speed !== 0) await sleep(50);
                updateGrid(node, "path");
            }
            const elapsedMs = Math.round(performance.now() - t0);
            onMetrics?.({ explored, frontierSize, pathLen: path.length, elapsedMs });
            return { found: true, pathLen: path.length };
        }

        for (const neighbor of currentNode.neighbors) {
            if (neighbor.isWall) continue;
            if (closedSet.has(neighbor)) continue;

            const tentativeGCost = currentNode.gCost + 1;
            if (tentativeGCost < neighbor.gCost) {
                neighbor.previousNode = currentNode;
                neighbor.gCost = tentativeGCost;

                if (!openSetQ.includes(neighbor)) {
                    openSetQ.push(neighbor);
                    frontierSize = openSetQ.length;
                    updateGrid(neighbor, "open");
                }
            }
        }
    }

    const elapsedMs = Math.round(performance.now() - t0);
    onMetrics?.({ explored, frontierSize: 0, pathLen: null, elapsedMs });
    return { found: false, pathLen: 0 };
}

function reconstruct(end: Node): Node[] {
    const path: Node[] = [];
    let current: Node | null = end;
    while (current !== null) {
        path.unshift(current);
        current = current.previousNode;
    }
    return path;
}
