"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useSetAtom, useAtom, useAtomValue } from "jotai";
import {
    EraserIcon,
    FlagIcon,
    GithubIcon,
    InfoIcon,
    PlayIcon,
    RotateCcwIcon,
    TargetIcon,
    type LucideIcon,
} from "lucide-react";

const GridView = dynamic(() => import("@/components/grid/Grid"), { ssr: false });

import { ThemeToggle } from "@/components/theme-toggle";
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

const GRID_SIZES: GridSize[] = ["Small", "Medium", "Large"];
const SPEEDS: SpeedSetting[] = ["Slow", "Normal", "Fast", "Instant"];

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
        <Panel className="top-5 left-5 w-[296px] p-[18px] flex-col gap-3">
            <header className="flex items-start justify-between gap-2.5">
                <div>
                    <div className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--fg)]">
                        search-algo-lab
                    </div>
                    <div className="mt-[3px] text-xs text-[var(--fg-muted)]">
                        Pathfinding visualizer
                    </div>
                </div>
                <StatusPill />
            </header>

            <Divider />

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
                    <span
                        className={cn(
                            "inline-flex h-[19px] items-center self-start rounded-[var(--radius-sm)] px-[7px] font-mono text-[10px] font-semibold uppercase tracking-[0.04em]",
                            meta.guarantees
                                ? "bg-[var(--success-soft)] text-[var(--success)]"
                                : "border border-[var(--border)] bg-[var(--bg-overlay)] text-[var(--fg-subtle)]",
                        )}
                    >
                        {meta.guarantees ? "shortest path" : "not guaranteed"}
                    </span>
                    <p className="text-[11.5px] leading-[1.45] text-[var(--fg-subtle)]">
                        {meta.note}
                    </p>
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

            <Divider />

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
        </Panel>
    );
}

/* ----------------------------- Right rail ----------------------------- */

function RightRail() {
    return (
        <div className="absolute top-5 right-5 z-[5] flex w-[216px] flex-col gap-3 max-[760px]:hidden">
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
        <Panel className="static p-4 flex-col gap-0">
            <div className="mb-[14px] flex items-center justify-between">
                <Eyebrow>Run</Eyebrow>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--fg)]">
                    {meta.label}
                </span>
            </div>

            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--border-subtle)]">
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

            <div className="mt-3 min-h-[30px] text-[11px] leading-[1.45] text-[var(--fg-muted)]">
                {status === "done" && eff != null && (
                    <span>
                        <span className="font-mono font-semibold text-[var(--cell-path)]">
                            {eff}%
                        </span>{" "}
                        of explored cells were on the path
                    </span>
                )}
                {status === "nopath" && (
                    <span className="text-[var(--danger)]">
                        Goal is unreachable — clear some walls
                    </span>
                )}
                {status === "running" && <span>Searching…</span>}
                {(status === "idle" || status === "mazing") && (
                    <span>Press Start to run the search</span>
                )}
            </div>
        </Panel>
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
        <div className="bg-[oklch(0.155_0.004_250/0.6)] px-3 py-2.5 dark:bg-[oklch(0.155_0.004_250/0.6)]">
            <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--fg-subtle)]">
                {label}
            </div>
            <div
                className={cn(
                    "mt-[5px] font-mono text-[21px] leading-[1.1] font-semibold tabular-nums text-[var(--fg)]",
                    accent && "text-[var(--cell-path)]",
                )}
            >
                {value}
            </div>
            {sub && (
                <div className="mt-1 font-mono text-[10px] text-[var(--fg-subtle)]">{sub}</div>
            )}
        </div>
    );
}

function fmt(n: number | null) {
    return n == null ? "—" : n.toLocaleString("en-US");
}

function Legend() {
    return (
        <Panel className="static p-4 flex-col gap-0">
            <Eyebrow>Legend</Eyebrow>
            <div className="my-3 grid grid-cols-2 gap-x-3 gap-y-[9px]">
                <LegendRow color="var(--cell-start)" label="Start" icon={FlagIcon} />
                <LegendRow color="var(--cell-end)" label="Goal" icon={TargetIcon} />
                <LegendRow color="var(--cell-frontier)" label="Frontier" />
                <LegendRow color="var(--cell-visited)" label="Visited" />
                <LegendRow color="var(--cell-path)" label="Path" />
                <LegendRow color="var(--cell-wall)" label="Wall" />
            </div>
            <div className="border-t border-[var(--border-subtle)] pt-[11px] text-[11px] leading-[1.5] text-[var(--fg-subtle)]">
                Click + drag the grid to draw walls · drag <FlagIcon className="inline h-[11px] w-[11px] align-[-1px]" /> or{" "}
                <TargetIcon className="inline h-[11px] w-[11px] align-[-1px]" /> to move
            </div>
        </Panel>
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
        <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
            <span
                className="flex h-4 w-4 flex-none items-center justify-center rounded-[var(--radius-sm)] shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.06)]"
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
        <div className="absolute bottom-7 left-1/2 z-[6] -translate-x-1/2">
            <div className="flex items-center gap-1.5 rounded-[14px] border border-[var(--border)] bg-[oklch(0.175_0.004_250/0.9)] p-[7px] shadow-[0_1px_0_oklch(1_0_0_/_0.04)_inset,_0_12px_32px_rgb(0_0_0_/_0.18)] backdrop-blur-md">
                <Button
                    size="default"
                    disabled={isBusy}
                    onClick={() => setStartSignal((s) => s + 1)}
                    className="min-w-[130px]"
                >
                    <PlayIcon className="h-4 w-4" />
                    {primaryLabel}
                </Button>

                <Separator />

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
            </div>
        </div>
    );
}

function Separator() {
    return <span className="mx-0.5 h-[22px] w-px bg-[var(--border)]" />;
}

/* ----------------------------- Utility dock ----------------------------- */

function UtilityDock() {
    return (
        <div className="absolute right-5 bottom-7 z-[6] flex items-center gap-1 rounded-[12px] border border-[var(--border)] bg-[oklch(0.175_0.004_250/0.86)] p-1.5 shadow-lg backdrop-blur-md">
            <ThemeToggle />
            <a
                href="https://github.com/PaoloJN/search-algo-lab"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
                className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[var(--radius-md)] text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--fg)]"
            >
                <GithubIcon className="h-[17px] w-[17px]" />
            </a>
            <HelpDialog />
        </div>
    );
}

function HelpDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    aria-label="About and shortcuts"
                    className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[var(--radius-md)] text-[var(--fg-subtle)] transition-colors hover:bg-[var(--bg-overlay)] hover:text-[var(--fg)]"
                >
                    <InfoIcon className="h-[17px] w-[17px]" />
                </button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>How to use</DialogTitle>
                    <DialogDescription>A pathfinding and maze-generation visualizer.</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 text-sm">
                    <ul className="space-y-2 text-[var(--fg-muted)]">
                        <li>
                            <span className="font-medium text-[var(--fg)]">Left-click + drag</span> the grid to draw walls.{" "}
                            <span className="font-medium text-[var(--fg)]">Right-click</span> to erase.
                        </li>
                        <li>
                            <span className="font-medium text-[var(--fg)]">Drag the flag or target</span> icons to move start and goal.
                        </li>
                        <li>
                            Pick an algorithm and press <span className="font-medium text-[var(--fg)]">Start</span>. Optionally select a maze first.
                        </li>
                        <li>
                            After a run, dragging start/goal re-runs the algorithm instantly.
                        </li>
                    </ul>

                    <div className="border-t border-[var(--border-subtle)] pt-4">
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
        <div className="flex items-center justify-between py-1 text-[12.5px] text-[var(--fg-muted)]">
            <span>{label}</span>
            <span className="flex gap-1">
                {keys.map((k) => (
                    <span
                        key={k}
                        className="min-w-[22px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-inset)] px-[7px] py-[3px] text-center font-mono text-[11px] text-[var(--fg)]"
                    >
                        {k}
                    </span>
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
            if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.isContentEditable)) {
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

const STATUS_TONE: Record<RunStatus, string> = {
    idle: "border-[var(--border)] bg-[var(--bg-inset)] text-[var(--fg-muted)]",
    mazing:
        "border-[oklch(0.78_0.13_75/0.4)] bg-[var(--warning-soft)] text-[var(--warning)]",
    running:
        "border-[oklch(0.68_0.22_25/0.4)] bg-[oklch(0.68_0.22_25/0.12)] text-[var(--accent-soft-fg)]",
    done: "border-[oklch(0.72_0.15_155/0.4)] bg-[var(--success-soft)] text-[var(--success)]",
    nopath: "border-[oklch(0.68_0.19_25/0.4)] bg-[var(--danger-soft)] text-[var(--danger)]",
};

const STATUS_DOT: Record<RunStatus, string> = {
    idle: "bg-[var(--fg-subtle)]",
    mazing: "bg-[var(--warning)] status-pulse",
    running: "bg-[var(--accent)] status-pulse",
    done: "bg-[var(--success)]",
    nopath: "bg-[var(--danger)]",
};

function StatusPill() {
    const status = useAtomValue(statusAtom);
    return (
        <span
            className={cn(
                "inline-flex h-[22px] items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
                STATUS_TONE[status],
            )}
        >
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[status])} />
            {STATUS_LABEL[status]}
        </span>
    );
}

/* ----------------------------- Primitives ----------------------------- */

function Panel({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "absolute z-[5] flex rounded-[var(--radius-xl)] border border-[var(--border)] bg-[oklch(0.175_0.004_250/0.86)] shadow-[0_1px_0_oklch(1_0_0_/_0.04)_inset,_0_8px_24px_rgb(0_0_0_/_0.12)] backdrop-blur-md backdrop-saturate-[1.2]",
                className,
            )}
        >
            {children}
        </div>
    );
}

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
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-subtle)]">
            {children}
        </span>
    );
}

function Divider() {
    return <div className="my-2 h-px bg-[var(--border-subtle)]" />;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--fg-muted)]">{label}</span>
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
            <SelectTrigger className="h-9 w-full border-[var(--border-strong)] bg-[var(--bg-inset)] text-[13px] font-medium">
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
