"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { FlagIcon, GoalIcon } from "lucide-react";

import {
    algorithmAtom,
    mazeAtom,
    gridSizeAtom,
    mazeSpeedAtom,
    pathSpeedAtom,
    startSignalAtom,
    resetSignalAtom,
    clearPathsSignalAtom,
    isAlgorithmRunningAtom,
    isAlgorithmDoneAtom,
    isMazeRunningAtom,
    isBusyAtom,
    SPEED_MS,
    type GridSize,
} from "@/atoms/selections";
import { algorithms } from "@/utils/algorithms";
import { mazes } from "@/utils/mazes";
import { createNode, type Grid, type Node, type NodeRefMap } from "@/models/Node";

type Dims = { width: number; height: number };

// "Small" grid = small cells, denser. "Large" grid = larger cells, sparser.
const GRID_DIMS: Record<GridSize, Dims> = {
    Small: { width: 85, height: 35 },
    Large: { width: 49, height: 19 },
};

function buildGrid(width: number, height: number) {
    const grid: Grid = Array.from({ length: height }, (_, y) =>
        Array.from({ length: width }, (_, x) => createNode(y * width + x, x, y)),
    );

    const start = { x: Math.floor(width / 2 - 10), y: Math.floor(height / 2) };
    const end = { x: Math.floor(width / 2 + 10), y: Math.floor(height / 2) };
    grid[start.y][start.x].isStart = true;
    grid[end.y][end.x].isEnd = true;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const n: Node[] = [];
            if (y > 0) n.push(grid[y - 1][x]);
            if (y < height - 1) n.push(grid[y + 1][x]);
            if (x > 0) n.push(grid[y][x - 1]);
            if (x < width - 1) n.push(grid[y][x + 1]);
            grid[y][x].neighbors = n;
        }
    }

    return { grid, start, end };
}

function computeCellSize(width: number, height: number) {
    if (typeof window === "undefined") return 16;
    const w = window.innerWidth / width;
    const h = window.innerHeight / height;
    return Math.max(8, Math.floor(Math.min(w, h)));
}

export default function GridView() {
    const algorithm = useAtomValue(algorithmAtom);
    const maze = useAtomValue(mazeAtom);
    const gridSize = useAtomValue(gridSizeAtom);
    const mazeSpeed = useAtomValue(mazeSpeedAtom);
    const pathSpeed = useAtomValue(pathSpeedAtom);

    const startSignal = useAtomValue(startSignalAtom);
    const resetSignal = useAtomValue(resetSignalAtom);
    const clearPathsSignal = useAtomValue(clearPathsSignalAtom);

    const setIsAlgorithmRunning = useSetAtom(isAlgorithmRunningAtom);
    const setIsMazeRunning = useSetAtom(isMazeRunningAtom);
    const setIsAlgorithmDone = useSetAtom(isAlgorithmDoneAtom);
    const isBusy = useAtomValue(isBusyAtom);
    const isAlgorithmDone = useAtomValue(isAlgorithmDoneAtom);

    const [gridState, setGridState] = useState(() => {
        const dims = GRID_DIMS.Large;
        const built = buildGrid(dims.width, dims.height);
        return {
            grid: built.grid,
            width: dims.width,
            height: dims.height,
        };
    });
    const [startPos, setStartPos] = useState(() => ({
        x: Math.floor(GRID_DIMS.Large.width / 2 - 10),
        y: Math.floor(GRID_DIMS.Large.height / 2),
    }));
    const [endPos, setEndPos] = useState(() => ({
        x: Math.floor(GRID_DIMS.Large.width / 2 + 10),
        y: Math.floor(GRID_DIMS.Large.height / 2),
    }));

    const [cellSize, setCellSize] = useState(24);

    const gridNodeRefs = useRef<NodeRefMap>({});

    const [isMouseDown, setIsMouseDown] = useState(false);
    const [mouseButton, setMouseButton] = useState<number>(0);
    const [draggingNode, setDraggingNode] = useState<"start" | "end" | null>(null);
    const [tempNode, setTempNode] = useState<{ x: number; y: number } | null>(null);

    const latest = useRef({
        gridState,
        startPos,
        endPos,
        algorithm,
        pathSpeed,
        mazeSpeed,
        isAlgorithmDone,
        draggingNode,
        isBusy,
    });
    latest.current = {
        gridState,
        startPos,
        endPos,
        algorithm,
        pathSpeed,
        mazeSpeed,
        isAlgorithmDone,
        draggingNode,
        isBusy,
    };

    // Recompute pixel cell size from viewport whenever grid dims or viewport change.
    useLayoutEffect(() => {
        const update = () => setCellSize(computeCellSize(gridState.width, gridState.height));
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [gridState.width, gridState.height]);

    const resetGrid = useCallback(
        (full: boolean) => {
            const { grid, width, height } = latest.current.gridState;
            for (let row = 0; row < height; row++) {
                for (let col = 0; col < width; col++) {
                    const node = grid[row][col];
                    node.isPath = false;
                    node.isOpenSet = false;
                    node.isClosedSet = false;
                    node.previousNode = null;
                    node.gCost = Infinity;
                    node.hCost = 0;
                    node.fCost = 0;
                    if (full) node.isWall = false;

                    const el = gridNodeRefs.current[node.id];
                    if (!el) continue;
                    el.classList.remove("open-set-node");
                    el.classList.remove("closed-set-node");
                    el.classList.remove("path-node");
                    el.classList.remove("animated");
                    if (full) el.classList.remove("wall-node");
                }
            }
            setIsAlgorithmDone(false);
        },
        [setIsAlgorithmDone],
    );

    useEffect(() => {
        if (startSignal === 0) return;
        let cancelled = false;

        (async () => {
            const { gridState, startPos, endPos, algorithm, pathSpeed } = latest.current;
            resetGrid(false);
            setIsAlgorithmRunning(true);
            setIsAlgorithmDone(false);

            const fn = algorithms[algorithm];
            const ms = SPEED_MS[pathSpeed];
            const ok = await fn(
                gridState.grid[startPos.y][startPos.x],
                gridState.grid[endPos.y][endPos.x],
                gridState.grid,
                gridNodeRefs,
                ms,
            );

            if (cancelled) return;
            if (ok) {
                setIsAlgorithmRunning(false);
                setIsAlgorithmDone(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [startSignal, resetGrid, setIsAlgorithmRunning, setIsAlgorithmDone]);

    useEffect(() => {
        if (resetSignal === 0) return;
        resetGrid(true);
    }, [resetSignal, resetGrid]);

    useEffect(() => {
        if (clearPathsSignal === 0) return;
        resetGrid(false);
    }, [clearPathsSignal, resetGrid]);

    useEffect(() => {
        if (maze === null) return;
        let cancelled = false;

        (async () => {
            const { gridState, mazeSpeed } = latest.current;
            resetGrid(true);
            setIsMazeRunning(true);

            const fn = mazes[maze];
            const ms = SPEED_MS[mazeSpeed];
            const ok = await fn(
                gridState.grid,
                gridNodeRefs,
                gridState.width,
                gridState.height,
                ms,
            );

            if (cancelled) return;
            if (ok) setIsMazeRunning(false);
        })();

        return () => {
            cancelled = true;
        };
    }, [maze, resetGrid, setIsMazeRunning]);

    const didMountRef = useRef(false);
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
        const dims = GRID_DIMS[gridSize];
        gridNodeRefs.current = {};
        const built = buildGrid(dims.width, dims.height);
        setGridState({
            grid: built.grid,
            width: dims.width,
            height: dims.height,
        });
        setStartPos(built.start);
        setEndPos(built.end);
        setIsAlgorithmDone(false);
    }, [gridSize, setIsAlgorithmDone]);

    void pathSpeed;
    void mazeSpeed;

    const reRunForDrag = useCallback(
        async (row: number, col: number) => {
            const { gridState, startPos, endPos, algorithm, draggingNode } = latest.current;
            resetGrid(false);
            const fn = algorithms[algorithm];
            if (draggingNode === "start") {
                await fn(
                    gridState.grid[row][col],
                    gridState.grid[endPos.y][endPos.x],
                    gridState.grid,
                    gridNodeRefs,
                    0,
                );
            } else if (draggingNode === "end") {
                await fn(
                    gridState.grid[startPos.y][startPos.x],
                    gridState.grid[row][col],
                    gridState.grid,
                    gridNodeRefs,
                    0,
                );
            }
        },
        [resetGrid],
    );

    const handleNodeClick = (row: number, col: number, button: number) => {
        if (latest.current.isBusy) return;
        const node = latest.current.gridState.grid[row][col];
        if (node.isStart || node.isEnd) return;
        const el = gridNodeRefs.current[node.id];
        if (!el) return;
        if (button === 0) {
            node.isWall = true;
            el.classList.add("wall-node");
            el.classList.add("animated");
        } else if (button === 2) {
            node.isWall = false;
            el.classList.remove("wall-node");
            el.classList.remove("animated");
        }
    };

    const handleMouseDown = (row: number, col: number, e: React.MouseEvent) => {
        e.preventDefault();
        setIsMouseDown(true);
        setMouseButton(e.button);

        if (latest.current.isBusy) return;
        const node = latest.current.gridState.grid[row][col];
        if (node.isStart || node.isEnd) {
            setDraggingNode(node.isStart ? "start" : "end");
            setTempNode({ x: col, y: row });
        } else {
            handleNodeClick(row, col, e.button);
        }
    };

    const handleMouseEnter = (row: number, col: number) => {
        if (!isMouseDown) return;
        if (!draggingNode) {
            handleNodeClick(row, col, mouseButton);
            return;
        }
        const { gridState, startPos, endPos, isAlgorithmDone } = latest.current;
        const node = gridState.grid[row][col];
        if (
            (node.isStart && draggingNode === "end") ||
            (node.isEnd && draggingNode === "start")
        ) {
            return;
        }

        setTempNode({ x: col, y: row });

        if (node.isWall) {
            const el = gridNodeRefs.current[node.id];
            if (el) el.className = "grid-node temp-node";
        }

        if (draggingNode === "start") gridState.grid[startPos.y][startPos.x].isStart = false;
        if (draggingNode === "end") gridState.grid[endPos.y][endPos.x].isEnd = false;

        if (isAlgorithmDone) void reRunForDrag(row, col);
    };

    const handleMouseLeave = (row: number, col: number) => {
        if (!draggingNode) return;
        const node = latest.current.gridState.grid[row][col];
        if (node.isWall) {
            const el = gridNodeRefs.current[node.id];
            if (el) el.className = "grid-node wall-node";
        }
    };

    const handleMouseUp = () => {
        if (draggingNode && tempNode) {
            const { gridState, startPos, endPos } = latest.current;
            if (draggingNode === "start") {
                gridState.grid[startPos.y][startPos.x].isStart = false;
                gridState.grid[tempNode.y][tempNode.x].isStart = true;
                setStartPos({ x: tempNode.x, y: tempNode.y });
            } else {
                gridState.grid[endPos.y][endPos.x].isEnd = false;
                gridState.grid[tempNode.y][tempNode.x].isEnd = true;
                setEndPos({ x: tempNode.x, y: tempNode.y });
            }

            const targetEl = gridNodeRefs.current[gridState.grid[tempNode.y][tempNode.x].id];
            if (targetEl) targetEl.classList.remove("temp-node");

            if (gridState.grid[tempNode.y][tempNode.x].isWall) {
                gridState.grid[tempNode.y][tempNode.x].isWall = false;
                if (targetEl) targetEl.classList.remove("wall-node");
            }
        }
        setIsMouseDown(false);
        setDraggingNode(null);
        setTempNode(null);
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div
                id="grid"
                onMouseLeave={handleMouseUp}
                onMouseUp={handleMouseUp}
                onContextMenu={(e) => e.preventDefault()}
                style={{
                    gridTemplateColumns: `repeat(${gridState.width}, ${cellSize}px)`,
                    gridTemplateRows: `repeat(${gridState.height}, ${cellSize}px)`,
                }}
            >
                {gridState.grid.map((row, y) =>
                    row.map((node, x) => {
                        const showStart =
                            (node.isStart && draggingNode !== "start") ||
                            (tempNode?.x === node.x &&
                                tempNode?.y === node.y &&
                                draggingNode === "start");
                        const showEnd =
                            (node.isEnd && draggingNode !== "end") ||
                            (tempNode?.x === node.x &&
                                tempNode?.y === node.y &&
                                draggingNode === "end");
                        return (
                            <div
                                key={node.id}
                                ref={(el) => {
                                    gridNodeRefs.current[node.id] = el;
                                }}
                                className="grid-node"
                                onMouseDown={(e) => handleMouseDown(y, x, e)}
                                onMouseEnter={() => handleMouseEnter(y, x)}
                                onMouseLeave={() => handleMouseLeave(y, x)}
                                style={{
                                    width: cellSize,
                                    height: cellSize,
                                }}
                            >
                                {showStart && <FlagIcon className="text-foreground p-[15%]" />}
                                {showEnd && <GoalIcon className="text-foreground p-[15%]" />}
                            </div>
                        );
                    }),
                )}
            </div>
        </div>
    );
}
