import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function binarytree(
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    gridWidth: number,
    gridHeight: number,
    speed: number,
): Promise<boolean> {
    const carve = (y: number, x: number) => {
        grid[y][x].isWall = false;
        gridNodeRefs.current[grid[y][x].id]?.classList.remove("wall-node");
    };

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

    for (let row = 1; row < gridHeight; row += 2) {
        for (let col = 1; col < gridWidth; col += 2) {
            const current = grid[row][col];
            const north = row > 1 ? grid[row - 2][col] : null;
            const west = col > 1 ? grid[row][col - 2] : null;

            if (north && west) {
                if (speed !== 0) await sleep(speed);
                if (Math.random() < 0.5) {
                    connect(current, north, grid[row - 1][col]);
                } else {
                    connect(current, west, grid[row][col - 1]);
                }
            } else if (row === 1 && west) {
                connect(current, west, grid[row][col - 1]);
            } else if (col === 1 && north) {
                connect(current, north, grid[row - 1][col]);
            }
        }
    }

    return true;
}
