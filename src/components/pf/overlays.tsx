"use client";

import * as React from "react";
import {
    ChevronDownIcon,
    EraserIcon,
    EyeIcon,
    EyeOffIcon,
    FlagIcon,
    GithubIcon,
    InfoIcon,
    KeyboardIcon,
    PauseIcon,
    PlayIcon,
    RotateCcwIcon,
    ShuffleIcon,
    SkipBackIcon,
    SkipForwardIcon,
    TargetIcon,
    XIcon,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { ALGORITHMS, type AlgoKey, type HeuristicKind, type MazeType } from "@/lib/pf-algorithms";
import type { GridSize, MazeSpeed, Metrics, Speed, Status } from "@/atoms/pf";

/* -------------------- Primitives -------------------- */

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="field">
            <span className="field-label">{label}</span>
            {children}
        </label>
    );
}

export function PFSelect<T extends string>({
    value,
    onChange,
    options,
    disabled,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
    disabled?: boolean;
}) {
    return (
        <div className={"pf-select" + (disabled ? " is-disabled" : "")}>
            <select
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(e.target.value as T)}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDownIcon className="pf-select-icon" size={14} />
        </div>
    );
}

export function Segmented<T extends string>({
    value,
    onChange,
    options,
    disabled,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { value: T; label: string }[];
    disabled?: boolean;
}) {
    return (
        <div className={"seg" + (disabled ? " is-disabled" : "")} role="tablist">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    className={"seg-btn" + (value === o.value ? " is-active" : "")}
                    onClick={() => !disabled && onChange(o.value)}
                    disabled={disabled}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function Switch({
    checked,
    onChange,
    label,
    disabled,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            className={"switch-row" + (disabled ? " is-disabled" : "")}
            onClick={() => !disabled && onChange(!checked)}
            role="switch"
            aria-checked={checked}
        >
            <span className="switch-label">{label}</span>
            <span className={"switch" + (checked ? " is-on" : "")}>
                <span className="switch-knob" />
            </span>
        </button>
    );
}

/* -------------------- Status pill -------------------- */

const STATUS: Record<Status, { label: string; tone: "idle" | "run" | "warn" | "ok" | "bad" }> = {
    idle: { label: "Idle", tone: "idle" },
    running: { label: "Running", tone: "run" },
    paused: { label: "Paused", tone: "idle" },
    mazing: { label: "Carving", tone: "warn" },
    done: { label: "Solved", tone: "ok" },
    nopath: { label: "No path", tone: "bad" },
};

export function StatusPill({ status }: { status: Status }) {
    const s = STATUS[status];
    return (
        <span className={"status-pill tone-" + s.tone}>
            <span className="status-dot" />
            {s.label}
        </span>
    );
}

/* -------------------- Control panel -------------------- */

const ALGO_OPTIONS: { value: AlgoKey; label: string }[] = [
    { value: "astar", label: "A*" },
    { value: "dijkstra", label: "Dijkstra" },
    { value: "greedy", label: "Greedy best-first" },
    { value: "bfs", label: "Breadth-first (BFS)" },
    { value: "dfs", label: "Depth-first (DFS)" },
];

const MAZE_OPTIONS: { value: MazeType; label: string }[] = [
    { value: "none", label: "None" },
    { value: "recursive", label: "Recursive division" },
    { value: "binarytree", label: "Binary tree" },
    { value: "sidewinder", label: "Sidewinder" },
    { value: "prims", label: "Prim's" },
    { value: "huntandkill", label: "Hunt and kill" },
    { value: "random", label: "Random fill" },
];

const GRID_SIZE_OPTIONS: { value: GridSize; label: string }[] = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
];

const PATH_SPEED_OPTIONS: { value: Speed; label: string }[] = [
    { value: "slow", label: "Slow" },
    { value: "normal", label: "Normal" },
    { value: "fast", label: "Fast" },
    { value: "instant", label: "Instant" },
];

const MAZE_SPEED_OPTIONS: { value: MazeSpeed; label: string }[] = [
    { value: "slow", label: "Slow" },
    { value: "normal", label: "Normal" },
    { value: "fast", label: "Fast" },
];

const HEURISTIC_OPTIONS: { value: HeuristicKind; label: string }[] = [
    { value: "manhattan", label: "Manhattan" },
    { value: "euclidean", label: "Euclidean" },
    { value: "chebyshev", label: "Chebyshev" },
];

export function ControlPanel(props: {
    algo: AlgoKey;
    setAlgo: (v: AlgoKey) => void;
    mazeType: MazeType;
    setMazeType: (v: MazeType) => void;
    gridSize: GridSize;
    setGridSize: (v: GridSize) => void;
    pathSpeed: Speed;
    setPathSpeed: (v: Speed) => void;
    mazeSpeed: MazeSpeed;
    setMazeSpeed: (v: MazeSpeed) => void;
    diagonal: boolean;
    setDiagonal: (v: boolean) => void;
    heuristic: HeuristicKind;
    setHeuristic: (v: HeuristicKind) => void;
    status: Status;
    busy: boolean;
}) {
    const {
        algo,
        setAlgo,
        mazeType,
        setMazeType,
        gridSize,
        setGridSize,
        pathSpeed,
        setPathSpeed,
        mazeSpeed,
        setMazeSpeed,
        diagonal,
        setDiagonal,
        heuristic,
        setHeuristic,
        status,
        busy,
    } = props;

    const meta = ALGORITHMS[algo];
    const showHeuristic = algo === "astar" || algo === "greedy";

    return (
        <div className="panel control-panel">
            <div className="panel-head">
                <div>
                    <div className="app-name">search-algo-lab</div>
                    <div className="app-sub">Pathfinding visualizer</div>
                </div>
                <StatusPill status={status} />
            </div>

            <div className="divider" />

            <div className="section">
                <div className="eyebrow">Search</div>
                <Field label="Algorithm">
                    <PFSelect
                        value={algo}
                        onChange={setAlgo}
                        disabled={busy}
                        options={ALGO_OPTIONS}
                    />
                </Field>
                <div className="algo-note">
                    <span className={"tag " + (meta.guarantees ? "tag-ok" : "tag-muted")}>
                        {meta.guarantees ? "shortest path" : "not guaranteed"}
                    </span>
                    <span className="algo-note-text">{meta.note}</span>
                </div>

                {showHeuristic && (
                    <Field label="Heuristic">
                        <Segmented
                            value={heuristic}
                            onChange={setHeuristic}
                            disabled={busy}
                            options={HEURISTIC_OPTIONS}
                        />
                    </Field>
                )}

                <Switch
                    checked={diagonal}
                    onChange={setDiagonal}
                    disabled={busy}
                    label="Allow diagonal moves"
                />

                <Field label="Maze">
                    <PFSelect
                        value={mazeType}
                        onChange={setMazeType}
                        disabled={busy}
                        options={MAZE_OPTIONS}
                    />
                </Field>
            </div>

            <div className="divider" />

            <div className="section">
                <div className="eyebrow">Display</div>
                <Field label="Grid size">
                    <PFSelect
                        value={gridSize}
                        onChange={setGridSize}
                        disabled={busy}
                        options={GRID_SIZE_OPTIONS}
                    />
                </Field>
                <Field label="Path speed">
                    <PFSelect
                        value={pathSpeed}
                        onChange={setPathSpeed}
                        options={PATH_SPEED_OPTIONS}
                    />
                </Field>
                <Field label="Maze speed">
                    <PFSelect
                        value={mazeSpeed}
                        onChange={setMazeSpeed}
                        options={MAZE_SPEED_OPTIONS}
                    />
                </Field>
            </div>
        </div>
    );
}

/* -------------------- Metrics -------------------- */

function fmt(n: number | null) {
    return n == null ? "—" : n.toLocaleString("en-US");
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
        <div className="stat">
            <div className="stat-label">{label}</div>
            <div className={"stat-value" + (accent ? " is-accent" : "")}>{value}</div>
            {sub && <div className="stat-sub">{sub}</div>}
        </div>
    );
}

export function MetricsPanel({
    metrics,
    algo,
    heuristic,
    diagonal,
    status,
}: {
    metrics: Metrics;
    algo: AlgoKey;
    heuristic: HeuristicKind;
    diagonal: boolean;
    status: Status;
}) {
    const meta = ALGORITHMS[algo];
    const showHeu = algo === "astar" || algo === "greedy";
    const eff =
        metrics.explored > 0 && metrics.pathLen
            ? Math.round((metrics.pathLen / metrics.explored) * 100)
            : null;
    return (
        <div className="panel metrics-panel">
            <div className="metrics-head">
                <span className="eyebrow">Run</span>
                <span className="metrics-algo">
                    {meta.label}
                    {showHeu && <span className="metrics-chip">{heuristic}</span>}
                    {diagonal && <span className="metrics-chip">8-dir</span>}
                </span>
            </div>
            <div className="stat-grid">
                <Stat
                    label="Explored"
                    value={fmt(metrics.explored)}
                    sub={metrics.total ? "of " + fmt(metrics.total) : " "}
                />
                <Stat label="Frontier" value={fmt(metrics.frontierSize)} sub="in queue" />
                <Stat
                    label="Path"
                    value={metrics.pathLen != null ? fmt(metrics.pathLen) : "—"}
                    sub="cells"
                    accent
                />
                <Stat
                    label="Time"
                    value={metrics.elapsed != null ? metrics.elapsed + "ms" : "—"}
                    sub="compute"
                />
            </div>
            <div className="metrics-foot">
                {status === "done" && eff != null && (
                    <span>
                        <span className="mono">{eff}%</span> of explored cells were on the path
                    </span>
                )}
                {status === "nopath" && (
                    <span className="foot-bad">Goal is unreachable — clear some walls</span>
                )}
                {status === "running" && <span>Searching…</span>}
                {status === "paused" && <span>Paused — press Start to resume</span>}
                {(status === "idle" || status === "mazing") && (
                    <span>Press Start to run the search</span>
                )}
            </div>
        </div>
    );
}

/* -------------------- Legend -------------------- */

export function Legend() {
    const items = [
        { c: "var(--cell-start)", label: "Start", icon: FlagIcon },
        { c: "var(--cell-end)", label: "Goal", icon: TargetIcon },
        { c: "var(--cell-frontier)", label: "Frontier" },
        { c: "var(--cell-visited)", label: "Visited" },
        { c: "var(--cell-path)", label: "Path" },
        { c: "var(--cell-wall)", label: "Wall" },
    ] as const;
    return (
        <div className="panel legend-panel">
            <div className="eyebrow">Legend</div>
            <div className="legend-grid">
                {items.map((it) => (
                    <div className="legend-row" key={it.label}>
                        <span className="swatch" style={{ background: it.c }}>
                            {"icon" in it && it.icon && (
                                <it.icon size={10} strokeWidth={2.5} />
                            )}
                        </span>
                        <span>{it.label}</span>
                    </div>
                ))}
            </div>
            <div className="legend-hint">
                Click + drag the grid to draw walls · drag <FlagIcon size={11} /> or{" "}
                <TargetIcon size={11} /> to move
            </div>
        </div>
    );
}

/* -------------------- Action bar -------------------- */

export function ActionBar({
    status,
    onStart,
    onPause,
    onStep,
    onStepBack,
    onClear,
    onReset,
    progress,
    onScrub,
    canScrub,
}: {
    status: Status;
    onStart: () => void;
    onPause: () => void;
    onStep: () => void;
    onStepBack: () => void;
    onClear: () => void;
    onReset: () => void;
    progress: number;
    onScrub: (p: number) => void;
    canScrub: boolean;
}) {
    const running = status === "running" || status === "mazing";
    const finished = status === "done" || status === "nopath";

    return (
        <div className="actionbar-wrap">
            <div className="timeline" data-active={canScrub || running}>
                <input
                    className="timeline-range"
                    type="range"
                    min={0}
                    max={1000}
                    step={1}
                    value={Math.round(progress * 1000)}
                    onChange={(e) => onScrub(Number(e.target.value) / 1000)}
                    disabled={!canScrub}
                />
                <div
                    className="timeline-fill"
                    style={{ width: progress * 100 + "%" }}
                />
            </div>
            <div className="actionbar">
                {running ? (
                    <button type="button" className="pf-btn pf-btn-primary" onClick={onPause}>
                        <PauseIcon size={15} /> Pause
                    </button>
                ) : (
                    <button type="button" className="pf-btn pf-btn-primary" onClick={onStart}>
                        <PlayIcon size={15} /> {finished ? "Run again" : "Start"}
                    </button>
                )}
                <button
                    type="button"
                    className="pf-btn pf-btn-ghost"
                    onClick={onStepBack}
                    disabled={running || !canScrub}
                    aria-label="Step back"
                >
                    <SkipBackIcon size={15} />
                </button>
                <button
                    type="button"
                    className="pf-btn pf-btn-ghost"
                    onClick={onStep}
                    disabled={running}
                >
                    <SkipForwardIcon size={15} /> Step
                </button>
                <span className="bar-sep" />
                <button type="button" className="pf-btn pf-btn-ghost" onClick={onClear}>
                    <EraserIcon size={15} /> Clear paths
                </button>
                <button type="button" className="pf-btn pf-btn-ghost" onClick={onReset}>
                    <RotateCcwIcon size={15} /> Reset
                </button>
            </div>
        </div>
    );
}

/* -------------------- Utility dock -------------------- */

export function UtilityDock({
    onShortcuts,
    onRandomize,
    onToggleUi,
    uiHidden,
}: {
    onShortcuts: () => void;
    onRandomize: () => void;
    onToggleUi: () => void;
    uiHidden: boolean;
}) {
    return (
        <div className="dock">
            <button
                type="button"
                className="icon-btn"
                onClick={onToggleUi}
                title={uiHidden ? "Show overlay" : "Hide overlay"}
                aria-label={uiHidden ? "Show overlay" : "Hide overlay"}
            >
                {uiHidden ? <EyeIcon size={17} /> : <EyeOffIcon size={17} />}
            </button>
            <button
                type="button"
                className="icon-btn"
                onClick={onRandomize}
                title="Randomize start and goal"
                aria-label="Randomize start and goal"
            >
                <ShuffleIcon size={17} />
            </button>
            <ThemeToggle />
            <a
                className="icon-btn"
                href="https://github.com/PaoloJN/search-algo-lab"
                target="_blank"
                rel="noopener noreferrer"
                title="Source on GitHub"
                aria-label="Source on GitHub"
            >
                <GithubIcon size={17} />
            </a>
            <button
                type="button"
                className="icon-btn"
                onClick={onShortcuts}
                title="Keyboard shortcuts"
                aria-label="Keyboard shortcuts"
            >
                <KeyboardIcon size={17} />
            </button>
            <button
                type="button"
                className="icon-btn"
                onClick={onShortcuts}
                title="About"
                aria-label="About"
            >
                <InfoIcon size={17} />
            </button>
        </div>
    );
}

/* -------------------- Shortcuts popover -------------------- */

export function ShortcutsCard({ onClose }: { onClose: () => void }) {
    const rows: [string, string][] = [
        ["Run / pause", "␣"],
        ["Step forward", "S"],
        ["Step back", "B"],
        ["Clear paths", "C"],
        ["Reset grid", "R"],
        ["Generate maze", "M"],
        ["Randomize start/goal", "X"],
        ["Hide / show overlay", "H"],
        ["Cycle algorithm", "⇥"],
    ];
    return (
        <div className="shortcuts-card panel">
            <div className="shortcuts-head">
                <span className="eyebrow">Shortcuts</span>
                <button
                    type="button"
                    className="icon-btn sm"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <XIcon size={14} />
                </button>
            </div>
            <div className="shortcuts-list">
                {rows.map(([k, v]) => (
                    <div className="shortcuts-row" key={k}>
                        <span>{k}</span>
                        <span className="kbd-key">{v}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
