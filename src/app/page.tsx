"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useSetAtom, useAtom, useAtomValue } from "jotai";
import {
    EraserIcon,
    FlagIcon,
    GithubIcon,
    GoalIcon,
    InfoIcon,
    PlayIcon,
    RotateCcwIcon,
    type LucideIcon,
} from "lucide-react";

const GridView = dynamic(() => import("@/components/grid/Grid"), { ssr: false });

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ALGORITHM_META,
    algorithmAtom,
    mazeAtom,
    gridSizeAtom,
    mazeSpeedAtom,
    pathSpeedAtom,
    startSignalAtom,
    resetSignalAtom,
    clearPathsSignalAtom,
    statusAtom,
    metricsAtom,
    isBusyAtom,
    type AlgorithmName,
    type MazeName,
    type GridSize,
    type SpeedSetting,
    type RunStatus,
} from "@/atoms/selections";
import { algorithmNames } from "@/utils/algorithms";
import { mazeNames } from "@/utils/mazes";

const GRID_SIZES: GridSize[] = ["Small", "Large"];
const SPEEDS: SpeedSetting[] = ["Slow", "Normal", "Fast", "Instant"];

const FLOATING_CARD =
    "absolute z-10 gap-0 py-0 bg-card/80 backdrop-blur-md backdrop-saturate-150 shadow-lg";

export default function Page() {
    return (
        <main className="stage">
            <GridView />
            <ControlPanel />
            <RightRail />
            <ActionBar />
            <UtilityDock />
            <KeyboardShortcuts />
        </main>
    );
}

/* ----------------------------- Control panel ----------------------------- */

function ControlPanel() {
    const [algorithm, setAlgorithm] = useAtom(algorithmAtom);
    const [maze, setMaze] = useAtom(mazeAtom);
    const [gridSize, setGridSize] = useAtom(gridSizeAtom);
    const [pathSpeed, setPathSpeed] = useAtom(pathSpeedAtom);
    const [mazeSpeed, setMazeSpeed] = useAtom(mazeSpeedAtom);
    const isBusy = useAtomValue(isBusyAtom);
    const meta = ALGORITHM_META[algorithm];

    return (
        <Card className={cn(FLOATING_CARD, "top-5 left-5 w-72 p-4")}>
            <header className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold tracking-tight">search-algo-lab</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Pathfinding visualizer
                    </p>
                </div>
                <StatusPill />
            </header>

            <Separator className="my-4" />

            <Section title="Search">
                <Field label="Algorithm">
                    <DSSelect
                        value={algorithm}
                        onValueChange={(v) => setAlgorithm(v as AlgorithmName)}
                        disabled={isBusy}
                        options={algorithmNames.map((n) => ({ value: n, label: n }))}
                    />
                </Field>

                <div className="flex flex-col gap-1.5">
                    <Badge
                        variant={meta.guarantees ? "default" : "secondary"}
                        className={cn(
                            "self-start rounded-sm font-mono text-[10px] uppercase tracking-wider",
                            meta.guarantees &&
                                "bg-success/15 text-success border border-success/30",
                        )}
                    >
                        {meta.guarantees ? "shortest path" : "not guaranteed"}
                    </Badge>
                    <p className="text-xs leading-snug text-muted-foreground">{meta.note}</p>
                </div>

                <Field label="Maze">
                    <DSSelect
                        value={maze ?? ""}
                        onValueChange={(v) => setMaze(v as MazeName)}
                        disabled={isBusy}
                        placeholder="None"
                        options={mazeNames.map((n) => ({ value: n, label: n }))}
                    />
                </Field>
            </Section>

            <Separator className="my-4" />

            <Section title="Display">
                <Field label="Grid size">
                    <DSSelect
                        value={gridSize}
                        onValueChange={(v) => setGridSize(v as GridSize)}
                        disabled={isBusy}
                        options={GRID_SIZES.map((s) => ({ value: s, label: s }))}
                    />
                </Field>
                <Field label="Path speed">
                    <DSSelect
                        value={pathSpeed}
                        onValueChange={(v) => setPathSpeed(v as SpeedSetting)}
                        options={SPEEDS.map((s) => ({ value: s, label: s }))}
                    />
                </Field>
                <Field label="Maze speed">
                    <DSSelect
                        value={mazeSpeed}
                        onValueChange={(v) => setMazeSpeed(v as SpeedSetting)}
                        options={SPEEDS.map((s) => ({ value: s, label: s }))}
                    />
                </Field>
            </Section>
        </Card>
    );
}

/* ----------------------------- Right rail ----------------------------- */

function RightRail() {
    return (
        <div className="absolute top-5 right-5 z-10 flex w-56 flex-col gap-3 max-[760px]:hidden">
            <MetricsPanel />
            <Legend />
        </div>
    );
}

function MetricsPanel() {
    const algorithm = useAtomValue(algorithmAtom);
    const metrics = useAtomValue(metricsAtom);
    const status = useAtomValue(statusAtom);
    const meta = ALGORITHM_META[algorithm];

    const eff =
        metrics.explored > 0 && metrics.pathLen
            ? Math.round((metrics.pathLen / metrics.explored) * 100)
            : null;

    return (
        <Card className={cn(FLOATING_CARD, "static p-4")}>
            <div className="mb-3 flex items-center justify-between">
                <Eyebrow>Run</Eyebrow>
                <span className="text-xs font-semibold">{meta.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border">
                <Stat label="Explored" value={fmt(metrics.explored)} sub="cells" />
                <Stat label="Frontier" value={fmt(metrics.frontierSize)} sub="in queue" />
                <Stat
                    label="Path"
                    value={metrics.pathLen != null ? fmt(metrics.pathLen) : "—"}
                    sub="cells"
                    accent
                />
                <Stat
                    label="Time"
                    value={metrics.elapsedMs != null ? metrics.elapsedMs + "ms" : "—"}
                    sub="compute"
                />
            </div>

            <p className="mt-3 min-h-[30px] text-[11px] leading-snug text-muted-foreground">
                {status === "done" && eff != null && (
                    <span>
                        <span className="font-mono font-semibold text-primary">{eff}%</span> of
                        explored cells were on the path
                    </span>
                )}
                {status === "nopath" && (
                    <span className="text-destructive">
                        Goal is unreachable — clear some walls
                    </span>
                )}
                {status === "running" && <span>Searching…</span>}
                {(status === "idle" || status === "mazing") && (
                    <span>Press Start to run the search</span>
                )}
            </p>
        </Card>
    );
}

function Stat({
    label,
    value,
    sub,
    accent,
}: {
    label: string;
    value: string;
    sub?: string;
    accent?: boolean;
}) {
    return (
        <div className="bg-card px-3 py-2.5">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </div>
            <div
                className={cn(
                    "mt-1 font-mono text-xl leading-tight font-semibold tabular-nums",
                    accent && "text-primary",
                )}
            >
                {value}
            </div>
            {sub && (
                <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{sub}</div>
            )}
        </div>
    );
}

function fmt(n: number | null) {
    return n == null ? "—" : n.toLocaleString("en-US");
}

function Legend() {
    return (
        <Card className={cn(FLOATING_CARD, "static p-4")}>
            <Eyebrow>Legend</Eyebrow>
            <div className="my-3 grid grid-cols-2 gap-x-3 gap-y-2">
                <LegendRow color="var(--cell-frontier)" label="Frontier" />
                <LegendRow color="var(--cell-visited)" label="Visited" />
                <LegendRow color="var(--cell-path)" label="Path" />
                <LegendRow color="var(--cell-wall)" label="Wall" />
            </div>
            <Separator />
            <p className="pt-3 text-[11px] leading-snug text-muted-foreground">
                Click + drag to draw walls · drag{" "}
                <FlagIcon className="inline h-3 w-3 align-text-bottom" /> or{" "}
                <GoalIcon className="inline h-3 w-3 align-text-bottom" /> to move
            </p>
        </Card>
    );
}

function LegendRow({
    color,
    label,
    icon: Icon,
}: {
    color: string;
    label: string;
    icon?: LucideIcon;
}) {
    return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
                className="flex h-3.5 w-3.5 flex-none items-center justify-center rounded-sm ring-1 ring-inset ring-foreground/10"
                style={{ backgroundColor: color }}
            >
                {Icon && <Icon className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
            </span>
            <span>{label}</span>
        </div>
    );
}

/* ----------------------------- Action bar ----------------------------- */

function ActionBar() {
    const setStartSignal = useSetAtom(startSignalAtom);
    const setResetSignal = useSetAtom(resetSignalAtom);
    const setClearPathsSignal = useSetAtom(clearPathsSignalAtom);
    const status = useAtomValue(statusAtom);
    const isBusy = useAtomValue(isBusyAtom);

    const primaryLabel =
        status === "running"
            ? "Running…"
            : status === "mazing"
              ? "Generating…"
              : status === "done" || status === "nopath"
                ? "Run again"
                : "Start";

    return (
        <Card
            className={cn(
                FLOATING_CARD,
                "bottom-7 left-1/2 -translate-x-1/2 flex-row items-center gap-1.5 p-1.5",
            )}
        >
            <Button
                disabled={isBusy}
                onClick={() => setStartSignal((s) => s + 1)}
                className="min-w-[130px]"
            >
                <PlayIcon className="h-4 w-4" />
                {primaryLabel}
            </Button>

            <Separator orientation="vertical" className="h-5! mx-0.5" />

            <Button
                variant="ghost"
                disabled={isBusy}
                onClick={() => setClearPathsSignal((s) => s + 1)}
            >
                <EraserIcon className="h-4 w-4" />
                Clear paths
            </Button>
            <Button
                variant="ghost"
                disabled={isBusy}
                onClick={() => setResetSignal((s) => s + 1)}
            >
                <RotateCcwIcon className="h-4 w-4" />
                Reset
            </Button>
        </Card>
    );
}

/* ----------------------------- Utility dock ----------------------------- */

function UtilityDock() {
    return (
        <Card
            className={cn(
                FLOATING_CARD,
                "right-5 bottom-7 flex-row items-center gap-0.5 p-1.5",
            )}
        >
            <ThemeToggle />
            <Button
                asChild
                size="icon"
                variant="ghost"
                aria-label="View source on GitHub"
            >
                <a
                    href="https://github.com/PaoloJN/search-algo-lab"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <GithubIcon className="h-4 w-4" />
                </a>
            </Button>
            <HelpDialog />
        </Card>
    );
}

function HelpDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="About and shortcuts">
                    <InfoIcon className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>How to use</DialogTitle>
                    <DialogDescription>
                        A pathfinding and maze-generation visualizer.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 text-sm">
                    <ul className="space-y-2 text-muted-foreground">
                        <li>
                            <span className="font-medium text-foreground">
                                Left-click + drag
                            </span>{" "}
                            the grid to draw walls.{" "}
                            <span className="font-medium text-foreground">Right-click</span> to
                            erase.
                        </li>
                        <li>
                            <span className="font-medium text-foreground">
                                Drag the flag or target
                            </span>{" "}
                            icons to move start and goal.
                        </li>
                        <li>
                            Pick an algorithm and press{" "}
                            <span className="font-medium text-foreground">Start</span>.
                            Optionally select a maze first.
                        </li>
                        <li>
                            After a run, dragging start/goal re-runs the algorithm instantly.
                        </li>
                    </ul>

                    <Separator />

                    <div>
                        <Eyebrow>Keyboard shortcuts</Eyebrow>
                        <div className="mt-2 flex flex-col gap-1.5">
                            <KbdRow label="Start / re-run" keys={["Space"]} />
                            <KbdRow label="Clear paths" keys={["C"]} />
                            <KbdRow label="Reset grid" keys={["R"]} />
                            <KbdRow label="Cycle algorithm" keys={["Tab"]} />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function KbdRow({ label, keys }: { label: string; keys: string[] }) {
    return (
        <div className="flex items-center justify-between py-1 text-sm text-muted-foreground">
            <span>{label}</span>
            <span className="flex gap-1">
                {keys.map((k) => (
                    <kbd
                        key={k}
                        className="min-w-[22px] rounded border bg-muted px-1.5 py-0.5 text-center font-mono text-xs text-foreground"
                    >
                        {k}
                    </kbd>
                ))}
            </span>
        </div>
    );
}

/* ----------------------------- Keyboard shortcuts ----------------------------- */

function KeyboardShortcuts() {
    const setStartSignal = useSetAtom(startSignalAtom);
    const setResetSignal = useSetAtom(resetSignalAtom);
    const setClearPathsSignal = useSetAtom(clearPathsSignalAtom);
    const setAlgorithm = useSetAtom(algorithmAtom);
    const isBusy = useAtomValue(isBusyAtom);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "SELECT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable)
            ) {
                return;
            }
            if (e.metaKey || e.ctrlKey || e.altKey) return;

            if (e.code === "Space") {
                e.preventDefault();
                if (!isBusy) setStartSignal((s) => s + 1);
            } else if (e.key.toLowerCase() === "c") {
                if (!isBusy) setClearPathsSignal((s) => s + 1);
            } else if (e.key.toLowerCase() === "r") {
                if (!isBusy) setResetSignal((s) => s + 1);
            } else if (e.key === "Tab") {
                e.preventDefault();
                if (!isBusy) {
                    setAlgorithm((prev) => {
                        const i = algorithmNames.indexOf(prev);
                        return algorithmNames[(i + 1) % algorithmNames.length];
                    });
                }
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isBusy, setStartSignal, setResetSignal, setClearPathsSignal, setAlgorithm]);

    return null;
}

/* ----------------------------- Status pill ----------------------------- */

const STATUS_LABEL: Record<RunStatus, string> = {
    idle: "Idle",
    mazing: "Carving",
    running: "Running",
    done: "Solved",
    nopath: "No path",
};

const STATUS_STYLES: Record<RunStatus, { badge: string; dot: string }> = {
    idle: {
        badge: "bg-muted text-muted-foreground border-border",
        dot: "bg-muted-foreground/60",
    },
    mazing: {
        badge: "bg-warning/15 text-warning border-warning/30",
        dot: "bg-warning status-pulse",
    },
    running: {
        badge: "bg-primary/15 text-primary border-primary/30",
        dot: "bg-primary status-pulse",
    },
    done: {
        badge: "bg-success/15 text-success border-success/30",
        dot: "bg-success",
    },
    nopath: {
        badge: "bg-destructive/15 text-destructive border-destructive/30",
        dot: "bg-destructive",
    },
};

function StatusPill() {
    const status = useAtomValue(statusAtom);
    const styles = STATUS_STYLES[status];
    return (
        <Badge
            variant="outline"
            className={cn(
                "rounded-full border font-mono text-[10px] uppercase tracking-wider gap-1.5 px-2",
                styles.badge,
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
            {STATUS_LABEL[status]}
        </Badge>
    );
}

/* ----------------------------- Primitives ----------------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-3">
            <Eyebrow>{title}</Eyebrow>
            {children}
        </section>
    );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
    return (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {children}
        </span>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {children}
        </label>
    );
}

function DSSelect({
    value,
    onValueChange,
    options,
    placeholder,
    disabled,
}: {
    value: string;
    onValueChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                        {o.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
