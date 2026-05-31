import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function prims(
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    gridWidth: number,
    gridHeight: number,
    speed: number,
): Promise<boolean> {
    const frontier: Node[] = [];
    const visited = new Set<Node>();

    const carve = (y: number, x: number) => {
        const node = grid[y][x];
        if (node.isStart || node.isEnd) return;
        node.isWall = false;
        gridNodeRefs.current[node.id]?.classList.remove("wall-node");
    };

    function getNeighbors(node: Node): Node[] {
        const { x: col, y: row } = node;
        const result: Node[] = [];
        if (row > 1) result.push(grid[row - 2][col]);
        if (row < gridHeight - 2) result.push(grid[row + 2][col]);
        if (col > 1) result.push(grid[row][col - 2]);
        if (col < gridWidth - 2) result.push(grid[row][col + 2]);
        return result;
    }

    function getWallBetween(node: Node, neighbor: Node): Node | null {
        const { x: col, y: row } = node;
        if (row > 1 && grid[row - 2][col] === neighbor) return grid[row - 1][col];
        if (row < gridHeight - 2 && grid[row + 2][col] === neighbor) return grid[row + 1][col];
        if (col > 1 && grid[row][col - 2] === neighbor) return grid[row][col - 1];
        if (col < gridWidth - 2 && grid[row][col + 2] === neighbor) return grid[row][col + 1];
        return null;
    }

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            const node = grid[row][col];
            if (node.isStart || node.isEnd) continue;
            node.isWall = true;
            gridNodeRefs.current[node.id]?.classList.add("wall-node");
        }
    }

    const connect = (a: Node, b: Node, wallBetween: Node) => {
        carve(a.y, a.x);
        carve(b.y, b.x);
        carve(wallBetween.y, wallBetween.x);
    };

    let firstNode: Node | null = null;
    while (firstNode === null) {
        const row = Math.floor(Math.random() * (gridHeight - 4)) + 2;
        const col = Math.floor(Math.random() * (gridWidth - 4)) + 2;
        if (row % 2 !== 0 && col % 2 !== 0) {
            firstNode = grid[row][col];
            carve(firstNode.y, firstNode.x);
            visited.add(firstNode);
        }
    }

    for (const n of getNeighbors(firstNode)) frontier.push(n);

    while (frontier.length > 0) {
        const idx = Math.floor(Math.random() * frontier.length);
        const frontierNode = frontier[idx];
        const frontierNeighbors = getNeighbors(frontierNode);

        const adjacentIns = frontierNeighbors.filter((n) => visited.has(n));
        if (adjacentIns.length === 0) {
            frontier.splice(idx, 1);
            continue;
        }

        const chosen = adjacentIns[Math.floor(Math.random() * adjacentIns.length)];
        const wallBetween = getWallBetween(frontierNode, chosen);
        if (wallBetween) {
            if (speed !== 0) await sleep(speed);
            connect(frontierNode, chosen, wallBetween);
        }
        visited.add(frontierNode);
        frontier.splice(idx, 1);

        for (const neighbor of getNeighbors(frontierNode)) {
            if (!visited.has(neighbor) && !frontier.includes(neighbor)) {
                frontier.push(neighbor);
            }
        }
    }

    return true;
}
