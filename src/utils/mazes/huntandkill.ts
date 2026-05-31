import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function huntandkill(
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    gridWidth: number,
    gridHeight: number,
    speed: number,
): Promise<boolean> {
    const visited = new Set<Node>();

    const carve = (y: number, x: number) => {
        const node = grid[y][x];
        if (node.isStart || node.isEnd) return;
        node.isWall = false;
        gridNodeRefs.current[node.id]?.classList.remove("wall-node");
    };

    function getUnvisitedNeighbors(node: Node): Node[] {
        const { x: col, y: row } = node;
        const result: Node[] = [];
        if (row > 1 && !visited.has(grid[row - 2][col])) result.push(grid[row - 2][col]);
        if (row < gridHeight - 2 && !visited.has(grid[row + 2][col]))
            result.push(grid[row + 2][col]);
        if (col > 1 && !visited.has(grid[row][col - 2])) result.push(grid[row][col - 2]);
        if (col < gridWidth - 2 && !visited.has(grid[row][col + 2]))
            result.push(grid[row][col + 2]);
        return result;
    }

    function getVisitedNeighbors(node: Node): Node[] {
        const { x: col, y: row } = node;
        const result: Node[] = [];
        if (row > 1 && visited.has(grid[row - 2][col])) result.push(grid[row - 2][col]);
        if (row < gridHeight - 2 && visited.has(grid[row + 2][col]))
            result.push(grid[row + 2][col]);
        if (col > 1 && visited.has(grid[row][col - 2])) result.push(grid[row][col - 2]);
        if (col < gridWidth - 2 && visited.has(grid[row][col + 2])) result.push(grid[row][col + 2]);
        return result;
    }

    function removeWallBetween(a: Node, b: Node) {
        const { x: col, y: row } = a;
        if (row > 1 && grid[row - 2][col] === b) carve(row - 1, col);
        else if (row < gridHeight - 2 && grid[row + 2][col] === b) carve(row + 1, col);
        else if (col > 1 && grid[row][col - 2] === b) carve(row, col - 1);
        else if (col < gridWidth - 2 && grid[row][col + 2] === b) carve(row, col + 1);
        carve(a.y, a.x);
        carve(b.y, b.x);
    }

    function generateStartPoint(): Node {
        while (true) {
            const row = Math.floor(Math.random() * (gridHeight - 4)) + 2;
            const col = Math.floor(Math.random() * (gridWidth - 4)) + 2;
            if (row % 2 !== 0 && col % 2 !== 0) {
                const node = grid[row][col];
                carve(node.y, node.x);
                return node;
            }
        }
    }

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            const node = grid[row][col];
            if (node.isStart || node.isEnd) continue;
            node.isWall = true;
            gridNodeRefs.current[node.id]?.classList.add("wall-node");
        }
    }

    let currentNode: Node | null = generateStartPoint();
    while (currentNode) {
        if (speed !== 0) await sleep(speed);
        visited.add(currentNode);
        const neighbors = getUnvisitedNeighbors(currentNode);

        if (neighbors.length > 0) {
            const next = neighbors[Math.floor(Math.random() * neighbors.length)];
            removeWallBetween(currentNode, next);
            currentNode = next;
        } else {
            currentNode = null;
            outer: for (let row = 1; row < gridHeight - 1; row += 2) {
                for (let col = 1; col < gridWidth - 1; col += 2) {
                    const node = grid[row][col];
                    const visitedNeighbors = getVisitedNeighbors(node);
                    if (!visited.has(node) && visitedNeighbors.length > 0) {
                        currentNode = node;
                        const pick =
                            visitedNeighbors[Math.floor(Math.random() * visitedNeighbors.length)];
                        removeWallBetween(currentNode, pick);
                        break outer;
                    }
                }
            }
        }
    }

    return true;
}
