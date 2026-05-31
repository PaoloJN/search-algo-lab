import type { MutableRefObject } from "react";
import type { Grid, Node, NodeRefMap } from "@/models/Node";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function sidewinder(
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
            if (row === 1) {
                if (col === 0 || col === gridWidth - 1) {
                    node.isWall = true;
                    gridNodeRefs.current[node.id]?.classList.add("wall-node");
                }
            } else {
                node.isWall = true;
                gridNodeRefs.current[node.id]?.classList.add("wall-node");
            }
        }
    }

    for (let row = 3; row < gridHeight; row += 2) {
        let run: Node[] = [];
        for (let col = 1; col < gridWidth; col += 2) {
            const current = grid[row][col];
            carve(current.y, current.x);
            run.push(current);

            if (Math.random() < 0.6 && col !== gridWidth - 2) {
                if (speed !== 0) await sleep(speed);
                carve(current.y, current.x + 1);
            } else if (run.length > 0 && row > 1) {
                const randomNode = run[Math.floor(Math.random() * run.length)];
                if (speed !== 0) await sleep(speed);
                const up = randomNode.neighbors[0];
                if (up) carve(up.y, up.x);
                run = [];
            }
        }
    }

    return true;
}
