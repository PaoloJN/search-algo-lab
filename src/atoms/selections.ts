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

export type GridSize = "Small" | "Large";

export type SpeedSetting = "Slow" | "Normal" | "Fast" | "Instant";

export const SPEED_MS: Record<SpeedSetting, number> = {
    Slow: 100,
    Normal: 20,
    Fast: 1,
    Instant: 0,
};

export const algorithmAtom = atom<AlgorithmName>("A*");
export const mazeAtom = atom<MazeName | null>(null);

export const gridSizeAtom = atom<GridSize>("Large");
export const mazeSpeedAtom = atom<SpeedSetting>("Fast");
export const pathSpeedAtom = atom<SpeedSetting>("Normal");

export const startSignalAtom = atom<number>(0);
export const resetSignalAtom = atom<number>(0);
export const clearPathsSignalAtom = atom<number>(0);

export const isMazeRunningAtom = atom<boolean>(false);
export const isAlgorithmRunningAtom = atom<boolean>(false);
export const isAlgorithmDoneAtom = atom<boolean>(false);

export const isBusyAtom = atom((get) => get(isMazeRunningAtom) || get(isAlgorithmRunningAtom));
