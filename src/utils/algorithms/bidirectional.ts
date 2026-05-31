import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";
import type { Metrics } from "@/atoms/selections";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type NodeMark = "open" | "closed" | "path";
type MetricsReporter = (m: Metrics) => void;

export default async function bidirectional(
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

    async function reconstructPath(meetForward: Node, meetBackward: Node) {
        const pathForward: Node[] = [];
        let current: Node | null = meetForward;
        while (current !== null) {
            pathForward.unshift(current);
            current = current.previousNode;
        }

        const pathBackward: Node[] = [];
        current = meetBackward;
        while (current !== null) {
            pathBackward.unshift(current);
            current = current.previousNode;
        }
        pathBackward.reverse();

        const fullPath = pathForward.concat(pathBackward);
        for (const node of fullPath) {
            if (speed !== 0) await sleep(50);
            updateGrid(node, "path");
        }
        return fullPath.length;
    }

    const visitedForwards = new Set<Node>();
    const visitedBackwards = new Set<Node>();
    const forwardsQ: Node[] = [];
    const backwardsQ: Node[] = [];

    startNode.gCost = 0;
    endNode.gCost = 0;
    forwardsQ.push(startNode);
    backwardsQ.push(endNode);
    frontierSize = 2;

    while (forwardsQ.length > 0 && backwardsQ.length > 0) {
        if (speed !== 0) {
            await sleep(speed);
            onMetrics?.({
                explored,
                frontierSize,
                pathLen: null,
                elapsedMs: Math.round(performance.now() - t0),
            });
        }

        let currentNode = forwardsQ.shift();
        if (!currentNode) break;
        visitedForwards.add(currentNode);
        updateGrid(currentNode, "closed");
        explored++;

        for (const neighbor of currentNode.neighbors) {
            if (neighbor.isWall) continue;
            if (visitedForwards.has(neighbor)) continue;

            if (visitedBackwards.has(neighbor) || backwardsQ.includes(neighbor)) {
                const pathLen = await reconstructPath(currentNode, neighbor);
                const elapsedMs = Math.round(performance.now() - t0);
                onMetrics?.({ explored, frontierSize, pathLen, elapsedMs });
                return { found: true, pathLen };
            }

            const tentativeGCost = currentNode.gCost + 1;
            if (tentativeGCost < neighbor.gCost) {
                neighbor.previousNode = currentNode;
                neighbor.gCost = tentativeGCost;

                if (!forwardsQ.includes(neighbor)) {
                    forwardsQ.push(neighbor);
                    updateGrid(neighbor, "open");
                }
            }
        }

        currentNode = backwardsQ.shift();
        if (!currentNode) break;
        visitedBackwards.add(currentNode);
        updateGrid(currentNode, "closed");
        explored++;

        for (const neighbor of currentNode.neighbors) {
            if (neighbor.isWall) continue;
            if (visitedBackwards.has(neighbor)) continue;

            if (visitedForwards.has(neighbor) || forwardsQ.includes(neighbor)) {
                const pathLen = await reconstructPath(neighbor, currentNode);
                const elapsedMs = Math.round(performance.now() - t0);
                onMetrics?.({ explored, frontierSize, pathLen, elapsedMs });
                return { found: true, pathLen };
            }

            const tentativeGCost = currentNode.gCost + 1;
            if (tentativeGCost < neighbor.gCost) {
                neighbor.previousNode = currentNode;
                neighbor.gCost = tentativeGCost;

                if (!backwardsQ.includes(neighbor)) {
                    backwardsQ.push(neighbor);
                    updateGrid(neighbor, "open");
                }
            }
        }

        frontierSize = forwardsQ.length + backwardsQ.length;
    }

    const elapsedMs = Math.round(performance.now() - t0);
    onMetrics?.({ explored, frontierSize: 0, pathLen: null, elapsedMs });
    return { found: false, pathLen: 0 };
}
