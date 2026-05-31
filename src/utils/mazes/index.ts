import type { MutableRefObject } from "react";
import type { Grid, NodeRefMap } from "@/models/Node";
import type { MazeName } from "@/atoms/selections";
import recursivedivision from "./recursivedivision";
import binarytree from "./binarytree";
import sidewinder from "./sidewinder";
import prims from "./prims";
import huntandkill from "./huntandkill";
import randommap from "./randommap";

export type MazeFn = (
    grid: Grid,
    gridNodeRefs: MutableRefObject<NodeRefMap>,
    gridWidth: number,
    gridHeight: number,
    speed: number,
) => Promise<boolean>;

export const mazes: Record<MazeName, MazeFn> = {
    "Recursive Division": recursivedivision,
    "Binary Tree": binarytree,
    Sidewinder: sidewinder,
    "Prim's": prims,
    "Hunt And Kill": huntandkill,
    "Random Map": randommap,
};

export const mazeNames = Object.keys(mazes) as MazeName[];
