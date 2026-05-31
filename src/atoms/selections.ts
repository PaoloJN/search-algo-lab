"use client";

import { atom } from "jotai";

export type AlgorithmName = "A*" | "Dijkstra" | "Bidirectional";

export type MazeName =
    | "Recursive Division"
    | "Binary Tree"
    | "Sidewinder"
    | "Prim's"
    | "Hunt And Kill"
    | "Random Map";

export type GridSize = "Small" | "Medium" | "Large";

export type SpeedSetting = "Slow" | "Normal" | "Fast" | "Instant";

export const SPEED_MS: Record<SpeedSetting, number> = {
    Slow: 100,
    Normal: 20,
    Fast: 1,
    Instant: 0,
};

export type RunStatus = "idle" | "mazing" | "running" | "done" | "nopath";

export type Metrics = {
    explored: number;
    frontierSize: number;
    pathLen: number | null;
    elapsedMs: number | null;
};

export const ALGORITHM_META: Record<
    AlgorithmName,
    { label: string; guarantees: boolean; note: string }
> = {
    "A*": {
        label: "A*",
        guarantees: true,
        note: "Heuristic-guided. Optimal with an admissible heuristic.",
    },
    Dijkstra: {
        label: "Dijkstra",
        guarantees: true,
        note: "Uniform cost. Explores evenly outward. Always shortest.",
    },
    Bidirectional: {
        label: "Bidirectional",
        guarantees: true,
        note: "Searches from both ends — meets in the middle for speed.",
    },
};

export const algorithmAtom = atom<AlgorithmName>("A*");
export const mazeAtom = atom<MazeName | null>(null);

export const gridSizeAtom = atom<GridSize>("Medium");
export const mazeSpeedAtom = atom<SpeedSetting>("Fast");
export const pathSpeedAtom = atom<SpeedSetting>("Normal");

export const startSignalAtom = atom<number>(0);
export const resetSignalAtom = atom<number>(0);
export const clearPathsSignalAtom = atom<number>(0);

export const statusAtom = atom<RunStatus>("idle");
export const metricsAtom = atom<Metrics>({
    explored: 0,
    frontierSize: 0,
    pathLen: null,
    elapsedMs: null,
});

export const isBusyAtom = atom(
    (get) => get(statusAtom) === "running" || get(statusAtom) === "mazing",
);
