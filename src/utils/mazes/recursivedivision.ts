import type { MutableRefObject } from "react";
import type { Grid, NodeRefMap } from "@/models/Node";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function recursivedivision(
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    gridWidth: number,
    gridHeight: number,
    speed: number,
): Promise<boolean> {
    const placeWall = (y: number, x: number) => {
        const node = grid[y][x];
        if (node.isStart || node.isEnd) return;
        node.isWall = true;
        gridNodeRefs.current[node.id]?.classList.add("wall-node");
    };

    const randomEven = (a: number, b: number) => {
        const random = Math.floor(Math.random() * (b - a + 1)) + a;
        return random % 2 === 0 ? random : random + 1;
    };
    const randomOdd = (a: number, b: number) => {
        const random = Math.floor(Math.random() * (b - a + 1)) + a;
        return random % 2 !== 0 ? random : random + 1;
    };

    const chooseOrientation = (
        startRow: number,
        endRow: number,
        startCol: number,
        endCol: number,
    ): "horizontal" | "vertical" => {
        const width = endCol - startCol;
        const height = endRow - startRow;
        if (width > height) return "vertical";
        if (width < height) return "horizontal";
        return Math.random() < 0.5 ? "horizontal" : "vertical";
    };

    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[0].length; col++) {
            if (row === 0 || col === 0 || row === grid.length - 1 || col === grid[0].length - 1) {
                placeWall(row, col);
            }
        }
    }

    const divide = async (startRow: number, endRow: number, startCol: number, endCol: number) => {
        if (endCol - startCol <= 1 || endRow - startRow <= 1) return;

        const wallRow = randomEven(startRow + 1, endRow - 1);
        const wallCol = randomEven(startCol + 1, endCol - 1);
        const passageRow = randomOdd(startRow, endRow);
        const passageCol = randomOdd(startCol, endCol);
        const orientation = chooseOrientation(startRow, endRow, startCol, endCol);

        if (orientation === "horizontal") {
            for (let col = startCol; col <= endCol; col++) {
                if (col === passageCol) continue;
                if (speed !== 0) await sleep(speed);
                placeWall(wallRow, col);
            }
            await divide(startRow, wallRow - 1, startCol, endCol);
            await divide(wallRow + 1, endRow, startCol, endCol);
        } else {
            for (let row = startRow; row <= endRow; row++) {
                if (row === passageRow) continue;
                if (speed !== 0) await sleep(speed);
                placeWall(row, wallCol);
            }
            await divide(startRow, endRow, wallCol + 1, endCol);
            await divide(startRow, endRow, startCol, wallCol - 1);
        }
    };

    await divide(1, gridHeight - 2, 1, gridWidth - 2);

    return true;
}
