"use client";

import { atom } from "jotai";
import type { AlgoKey, HeuristicKind, MazeType } from "@/lib/pf-algorithms";

export type GridSize = "small" | "medium" | "large";
export type Speed = "slow" | "normal" | "fast" | "instant";
export type MazeSpeed = "slow" | "normal" | "fast";
export type Status = "idle" | "running" | "paused" | "mazing" | "done" | "nopath";

export type Metrics = {
    explored: number;
    frontierSize: number;
    pathLen: number | null;
    total: number;
    elapsed: number | null;
};

export const algoAtom = atom<AlgoKey>("astar");
// Default to Prim's so the page boots with a maze + auto-run demo.
export const mazeTypeAtom = atom<MazeType>("prims");
export const gridSizeAtom = atom<GridSize>("small");
export const pathSpeedAtom = atom<Speed>("normal");
export const mazeSpeedAtom = atom<MazeSpeed>("fast");
export const diagonalAtom = atom(false);
export const heuristicAtom = atom<HeuristicKind>("manhattan");

export const statusAtom = atom<Status>("idle");
export const metricsAtom = atom<Metrics>({
    explored: 0,
    frontierSize: 0,
    pathLen: null,
    total: 0,
    elapsed: null,
});
export const progressAtom = atom(0);
export const shortcutsOpenAtom = atom(false);
export const uiHiddenAtom = atom(false);
