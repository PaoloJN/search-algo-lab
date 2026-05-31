import type { MutableRefObject } from "react";
import type { Grid, NodeRefMap } from "@/models/Node";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function randommap(
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    gridWidth: number,
    gridHeight: number,
    speed: number,
): Promise<boolean> {
    for (let row = 0; row < gridHeight; row++) {
        for (let col = 0; col < gridWidth; col++) {
            const node = grid[row][col];
            if (node.isStart || node.isEnd) continue;
            if (Math.random() < 0.3) {
                if (speed !== 0) await sleep(speed);
                node.isWall = true;
                gridNodeRefs.current[node.id]?.classList.add("wall-node");
            }
        }
    }

    return true;
}
