"use client";

import { useSetAtom, useAtom, useAtomValue } from "jotai";
import { InfoIcon } from "lucide-react";

import GridView from "@/components/grid/Grid";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    isMazeRunningAtom,
    isBusyAtom,
    type AlgorithmName,
    type MazeName,
    type GridSize,
    type SpeedSetting,
} from "@/atoms/selections";
import { algorithmNames } from "@/utils/algorithms";
import { mazeNames } from "@/utils/mazes";

const GRID_SIZES: GridSize[] = ["Small", "Large"];
const SPEEDS: SpeedSetting[] = ["Slow", "Normal", "Fast", "Instant"];

export default function Page() {
    return (
        <main className="relative h-screen w-screen overflow-hidden">
            <GridView />
            <Controls />
            <SelectionPanel />
            <Legend />
            <HelpButton />
        </main>
    );
}

function Controls() {
    const setStartSignal = useSetAtom(startSignalAtom);
    const setResetSignal = useSetAtom(resetSignalAtom);
    const setClearPathsSignal = useSetAtom(clearPathsSignalAtom);
    const isAlgorithmRunning = useAtomValue(isAlgorithmRunningAtom);
    const isMazeRunning = useAtomValue(isMazeRunningAtom);
    const isBusy = useAtomValue(isBusyAtom);

    const label = isAlgorithmRunning ? "Running…" : isMazeRunning ? "Generating…" : "Start";

    return (
        <div className="bg-background/80 absolute top-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-md border p-2 shadow-lg backdrop-blur">
            <h1 className="px-2 text-sm font-semibold select-none">search-algo-lab</h1>
            <div className="bg-border h-5 w-px" />
            <Button size="sm" disabled={isBusy} onClick={() => setStartSignal((s) => s + 1)}>
                {label}
            </Button>
            <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => setClearPathsSignal((s) => s + 1)}
            >
                Clear paths
            </Button>
            <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => setResetSignal((s) => s + 1)}
            >
                Reset
            </Button>
        </div>
    );
}

function SelectionPanel() {
    const [algorithm, setAlgorithm] = useAtom(algorithmAtom);
    const [maze, setMaze] = useAtom(mazeAtom);
    const [gridSize, setGridSize] = useAtom(gridSizeAtom);
    const [pathSpeed, setPathSpeed] = useAtom(pathSpeedAtom);
    const [mazeSpeed, setMazeSpeed] = useAtom(mazeSpeedAtom);
    const isBusy = useAtomValue(isBusyAtom);

    return (
        <div className="bg-background/80 absolute top-6 left-6 flex w-56 flex-col gap-2 rounded-md border p-3 shadow-lg backdrop-blur">
            <Field label="Algorithm">
                <Select
                    value={algorithm}
                    onValueChange={(v) => setAlgorithm(v as AlgorithmName)}
                    disabled={isBusy}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {algorithmNames.map((name) => (
                            <SelectItem key={name} value={name}>
                                {name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <Field label="Maze">
                <Select
                    value={maze ?? ""}
                    onValueChange={(v) => setMaze(v as MazeName)}
                    disabled={isBusy}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                        {mazeNames.map((name) => (
                            <SelectItem key={name} value={name}>
                                {name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <Field label="Grid size">
                <Select
                    value={gridSize}
                    onValueChange={(v) => setGridSize(v as GridSize)}
                    disabled={isBusy}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {GRID_SIZES.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <Field label="Path speed">
                <Select
                    value={pathSpeed}
                    onValueChange={(v) => setPathSpeed(v as SpeedSetting)}
                    disabled={isBusy}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SPEEDS.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>

            <Field label="Maze speed">
                <Select
                    value={mazeSpeed}
                    onValueChange={(v) => setMazeSpeed(v as SpeedSetting)}
                    disabled={isBusy}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {SPEEDS.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </Field>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">{label}</span>
            {children}
        </label>
    );
}

function Legend() {
    return (
        <div className="bg-background/80 absolute top-6 right-6 flex flex-col gap-1.5 rounded-md border p-3 text-xs shadow-lg backdrop-blur">
            <LegendRow swatchClass="bg-[var(--legend-open)]" label="Open set" />
            <LegendRow swatchClass="bg-[var(--legend-closed)]" label="Closed set" />
            <LegendRow swatchClass="bg-[var(--legend-path)]" label="Path" />
            <LegendRow swatchClass="bg-[var(--legend-wall)] border border-border" label="Wall" />
        </div>
    );
}

function LegendRow({ swatchClass, label }: { swatchClass: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`inline-block h-3 w-3 rounded-sm ${swatchClass}`} />
            <span>{label}</span>
        </div>
    );
}

function HelpButton() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="outline"
                    className="absolute right-6 bottom-6 shadow-lg"
                >
                    <InfoIcon className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>How to use</DialogTitle>
                    <DialogDescription>
                        Visualize pathfinding and maze generation algorithms.
                    </DialogDescription>
                </DialogHeader>
                <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>
                        <span className="text-foreground font-medium">Left-click + drag</span> to
                        draw walls. <span className="text-foreground font-medium">Right-click</span>{" "}
                        to erase them.
                    </li>
                    <li>
                        <span className="text-foreground font-medium">Drag the flag or goal</span>{" "}
                        icons to move the start and end points.
                    </li>
                    <li>
                        Pick an algorithm and press{" "}
                        <span className="text-foreground font-medium">Start</span>. Optionally
                        select a maze to generate walls before searching.
                    </li>
                    <li>
                        Once a path has been drawn, dragging start/end re-runs the algorithm
                        instantly.
                    </li>
                </ul>
            </DialogContent>
        </Dialog>
    );
}
