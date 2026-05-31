import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";
import manhattanDistance from "../manhattanDistance";
import createPriorityQueue from "../priorityQueue";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type NodeMark = "open" | "closed" | "path";

export default async function aStar(
    startNode: Node,
    endNode: Node,
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    speed: number,
): Promise<boolean> {
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

    async function reconstructPath(end: Node) {
        const path: Node[] = [];
        let current: Node | null = end;
        while (current !== null) {
            path.unshift(current);
            current = current.previousNode;
        }

        for (const node of path) {
            if (speed !== 0) await sleep(50);
            updateGrid(node, "path");
        }
    }

    const openSet = createPriorityQueue<Node>();
    const inOpenSet = new Set<number>();
    startNode.gCost = 0;
    startNode.hCost = manhattanDistance(startNode, endNode);
    startNode.fCost = startNode.gCost + startNode.hCost;
    openSet.enqueue(startNode, startNode.fCost);
    inOpenSet.add(startNode.id);

    while (!openSet.isEmpty()) {
        if (speed !== 0) await sleep(speed);

        const currentNode = openSet.dequeue();
        if (!currentNode) break;
        inOpenSet.delete(currentNode.id);

        if (currentNode.x === endNode.x && currentNode.y === endNode.y) {
            await reconstructPath(endNode);
            return true;
        }

        updateGrid(currentNode, "closed");

        for (const neighbor of currentNode.neighbors) {
            const tentativeGCost = currentNode.gCost + 1;
            if (tentativeGCost < neighbor.gCost) {
                neighbor.previousNode = currentNode;
                neighbor.gCost = tentativeGCost;
                neighbor.hCost = manhattanDistance(neighbor, endNode);
                neighbor.fCost = neighbor.gCost + neighbor.hCost;

                if (!inOpenSet.has(neighbor.id) && !neighbor.isWall) {
                    openSet.enqueue(neighbor, neighbor.fCost);
                    inOpenSet.add(neighbor.id);
                    updateGrid(neighbor, "open");
                }
            }
        }
    }

    return true;
}
