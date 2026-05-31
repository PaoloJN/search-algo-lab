import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type NodeMark = "open" | "closed" | "path";

export default async function bidirectional(
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
    }

    const visitedForwards = new Set<Node>();
    const visitedBackwards = new Set<Node>();
    const forwardsQ: Node[] = [];
    const backwardsQ: Node[] = [];

    startNode.gCost = 0;
    endNode.gCost = 0;
    forwardsQ.push(startNode);
    backwardsQ.push(endNode);

    while (forwardsQ.length > 0 && backwardsQ.length > 0) {
        if (speed !== 0) await sleep(speed);

        let currentNode = forwardsQ.shift();
        if (!currentNode) break;
        visitedForwards.add(currentNode);
        updateGrid(currentNode, "closed");

        for (const neighbor of currentNode.neighbors) {
            if (visitedForwards.has(neighbor)) continue;

            if (visitedBackwards.has(neighbor) || backwardsQ.includes(neighbor)) {
                await reconstructPath(currentNode, neighbor);
                return true;
            }

            const tentativeGCost = currentNode.gCost + 1;
            if (tentativeGCost < neighbor.gCost) {
                neighbor.previousNode = currentNode;
                neighbor.gCost = tentativeGCost;

                if (!forwardsQ.includes(neighbor) && !neighbor.isWall) {
                    forwardsQ.push(neighbor);
                    updateGrid(neighbor, "open");
                }
            }
        }

        currentNode = backwardsQ.shift();
        if (!currentNode) break;
        visitedBackwards.add(currentNode);
        updateGrid(currentNode, "closed");

        for (const neighbor of currentNode.neighbors) {
            if (visitedBackwards.has(neighbor)) continue;

            const tentativeGCost = currentNode.gCost + 1;
            if (tentativeGCost < neighbor.gCost) {
                neighbor.previousNode = currentNode;
                neighbor.gCost = tentativeGCost;

                if (!backwardsQ.includes(neighbor) && !neighbor.isWall) {
                    backwardsQ.push(neighbor);
                    updateGrid(neighbor, "open");
                }
            }
        }
    }

    return true;
}
