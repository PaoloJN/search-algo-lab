"use client";

import dynamic from "next/dynamic";
import { useSetAtom, useAtom, useAtomValue } from "jotai";
import {
    EraserIcon,
    GithubIcon,
    InfoIcon,
    Loader2Icon,
    PlayIcon,
    RotateCcwIcon,
} from "lucide-react";

const GridView = dynamic(() => import("@/components/grid/Grid"), { ssr: false });
import { cn } from "@/lib/utils";
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
            <SelectionPanel />
            <Legend />
            <ActionBar />
            <CornerLinks />
        </main>
    );
}

function SelectionPanel() {
    const [algorithm, setAlgorithm] = useAtom(algorithmAtom);
    const [maze, setMaze] = useAtom(mazeAtom);
    const [gridSize, setGridSize] = useAtom(gridSizeAtom);
    const [pathSpeed, setPathSpeed] = useAtom(pathSpeedAtom);
    const [mazeSpeed, setMazeSpeed] = useAtom(mazeSpeedAtom);
    const isBusy = useAtomValue(isBusyAtom);
    const isAlgorithmRunning = useAtomValue(isAlgorithmRunningAtom);
    const isMazeRunning = useAtomValue(isMazeRunningAtom);

    const statusLabel = isAlgorithmRunning
        ? "Searching"
        : isMazeRunning
          ? "Generating"
          : "Idle";

    return (
        <Panel className="top-6 left-6 w-64">
            <header className="flex items-center justify-between pb-3 border-b border-border/60">
                <div>
                    <h1 className="text-sm font-semibold tracking-tight">search-algo-lab</h1>
                    <p className="text-[11px] text-muted-foreground">Pathfinding visualizer</p>
                </div>
                <StatusDot active={isBusy} label={statusLabel} />
            </header>

            <Section title="Search">
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
            </Section>

            <Section title="Display">
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
            </Section>
        </Panel>
    );
}

function Legend() {
    return (
        <Panel className="top-6 right-6">
            <div className="flex flex-col gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Legend
                </span>
                <LegendRow color="var(--legend-open)" label="Frontier" />
                <LegendRow color="var(--legend-closed)" label="Visited" />
                <LegendRow color="var(--legend-path)" label="Path" />
                <LegendRow color="var(--legend-wall)" label="Wall" />
            </div>
        </Panel>
    );
}

function LegendRow({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2.5">
            <span
                className="inline-block w-3 h-3 rounded-[3px] ring-1 ring-inset ring-white/10"
                style={{ backgroundColor: color }}
            />
            <span className="text-xs text-foreground/90">{label}</span>
        </div>
    );
}

function ActionBar() {
    const setStartSignal = useSetAtom(startSignalAtom);
    const setResetSignal = useSetAtom(resetSignalAtom);
    const setClearPathsSignal = useSetAtom(clearPathsSignalAtom);
    const isAlgorithmRunning = useAtomValue(isAlgorithmRunningAtom);
    const isMazeRunning = useAtomValue(isMazeRunningAtom);
    const isBusy = useAtomValue(isBusyAtom);

    const startLabel = isAlgorithmRunning
        ? "Searching…"
        : isMazeRunning
          ? "Generating…"
          : "Start";

    return (
        <Panel
            row
            className="bottom-6 left-1/2 -translate-x-1/2 items-center gap-1.5 p-1.5"
        >
            <Button
                size="default"
                disabled={isBusy}
                onClick={() => setStartSignal((s) => s + 1)}
                className="min-w-[140px]"
            >
                {isBusy ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                    <PlayIcon className="h-4 w-4" />
                )}
                {startLabel}
            </Button>
            <Button
                size="default"
                variant="ghost"
                disabled={isBusy}
                onClick={() => setClearPathsSignal((s) => s + 1)}
            >
                <EraserIcon className="h-4 w-4" />
                Clear paths
            </Button>
            <Button
                size="default"
                variant="ghost"
                disabled={isBusy}
                onClick={() => setResetSignal((s) => s + 1)}
            >
                <RotateCcwIcon className="h-4 w-4" />
                Reset
            </Button>
        </Panel>
    );
}

function CornerLinks() {
    return (
        <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <a
                href="https://github.com/PaoloJN/search-algo-lab"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
            >
                <Button size="icon" variant="outline" className="shadow-lg">
                    <GithubIcon className="h-4 w-4" />
                </Button>
            </a>
            <HelpDialog />
        </div>
    );
}

function HelpDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="icon" variant="outline" className="shadow-lg">
                    <InfoIcon className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>How to use</DialogTitle>
                    <DialogDescription>
                        A few interactions to know about.
                    </DialogDescription>
                </DialogHeader>
                <ul className="text-sm space-y-3 text-muted-foreground">
                    <li>
                        <kbd className="text-foreground font-medium">Left-click + drag</kbd> to
                        draw walls.{" "}
                        <kbd className="text-foreground font-medium">Right-click</kbd> to erase.
                    </li>
                    <li>
                        <kbd className="text-foreground font-medium">Drag the flag or goal</kbd>{" "}
                        icon to move the start and end points.
                    </li>
                    <li>
                        Pick an algorithm and press{" "}
                        <kbd className="text-foreground font-medium">Start</kbd>. Optionally
                        select a maze to generate walls first.
                    </li>
                    <li>
                        After a run, dragging start/end re-runs the algorithm instantly.
                    </li>
                </ul>
            </DialogContent>
        </Dialog>
    );
}

function Panel({
    className,
    row,
    children,
}: {
    className?: string;
    row?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "absolute flex gap-3 rounded-xl border border-border/60 bg-background/70 p-3.5 shadow-2xl shadow-black/40 backdrop-blur-md",
                row ? "flex-row" : "flex-col",
                className,
            )}
        >
            {children}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {title}
            </span>
            {children}
        </section>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            {children}
        </label>
    );
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <span className="relative inline-flex h-2 w-2">
                {active && (
                    <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                )}
                <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                        active ? "bg-emerald-400" : "bg-muted-foreground/40"
                    }`}
                />
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
        </div>
    );
}
