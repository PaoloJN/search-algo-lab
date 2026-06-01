"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { FlagIcon, TargetIcon } from "lucide-react";

import * as PF from "@/lib/pf-algorithms";
import {
    ActionBar,
    ControlPanel,
    Legend,
    MetricsPanel,
    ShortcutsCard,
    UtilityDock,
} from "./overlays";
import {
    algoAtom,
    diagonalAtom,
    gridSizeAtom,
    heuristicAtom,
    mazeSpeedAtom,
    mazeTypeAtom,
    metricsAtom,
    pathSpeedAtom,
    progressAtom,
    shortcutsOpenAtom,
    statusAtom,
    type GridSize,
    type MazeSpeed,
    type Speed,
} from "@/atoms/pf";

const CELL_PX: Record<GridSize, number> = { small: 14, medium: 22, large: 32 };
const EXPLORE_SPEED: Record<Speed, number> = { slow: 1, normal: 3, fast: 9, instant: 1e9 };
const MAZE_SPEED: Record<MazeSpeed, number> = { slow: 2, normal: 6, fast: 24 };

const COLORS = {
    frontier: "#3e9b7e",
    visited: "#38597a",
    path: "#aeb84e",
    wall: "#34373d",
    start: "#34a373",
    end: "#d9694f",
    current: "#5cc0a0",
};

type Run = PF.SearchResult & { total: number; computeMs: number };

export function Stage() {
    const [algo, setAlgo] = useAtom(algoAtom);
    const [mazeType, setMazeType] = useAtom(mazeTypeAtom);
    const [gridSize, setGridSize] = useAtom(gridSizeAtom);
    const [pathSpeed, setPathSpeed] = useAtom(pathSpeedAtom);
    const [mazeSpeed, setMazeSpeed] = useAtom(mazeSpeedAtom);
    const [diagonal, setDiagonal] = useAtom(diagonalAtom);
    const [heuristic, setHeuristic] = useAtom(heuristicAtom);

    const [status, setStatus] = useAtom(statusAtom);
    const [metrics, setMetrics] = useAtom(metricsAtom);
    const [progress, setProgress] = useAtom(progressAtom);
    const [shortcutsOpen, setShortcutsOpen] = useAtom(shortcutsOpenAtom);

    const [tick, setTick] = useState(0);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const geomRef = useRef({ cols: 0, rows: 0, cell: 30, ox: 0, oy: 0 });
    const wallsRef = useRef(new Set<PF.CellKey>());
    const startRef = useRef<[number, number]>([0, 0]);
    const endRef = useRef<[number, number]>([0, 0]);
    const runRef = useRef<Run | null>(null);
    const frameRef = useRef(0);
    const stateRef = useRef({
        visited: new Set<PF.CellKey>(),
        frontier: new Set<PF.CellKey>(),
        pathSet: new Set<PF.CellKey>(),
        current: null as PF.CellKey | null,
        exploredCount: 0,
    });
    const rafRef = useRef<number | null>(null);
    const drawRef = useRef<() => void>(() => {});
    const dragRef = useRef<
        null | { mode: "wall"; erase: boolean } | { mode: "start" } | { mode: "end" }
    >(null);
    const settingsRef = useRef({
        algo,
        mazeType,
        gridSize,
        pathSpeed,
        mazeSpeed,
        diagonal,
        heuristic,
        status,
    });
    settingsRef.current = {
        algo,
        mazeType,
        gridSize,
        pathSpeed,
        mazeSpeed,
        diagonal,
        heuristic,
        status,
    };

    const busy = status === "running" || status === "mazing";

    function mazeFor(t: Exclude<PF.MazeType, "none">, rows: number, cols: number): PF.CellKey[] {
        const s = startRef.current;
        const e = endRef.current;
        switch (t) {
            case "recursive":
                return PF.mazeRecursiveDivision(rows, cols, s, e);
            case "random":
                return PF.mazeRandom(rows, cols, s, e);
            case "binarytree":
                return PF.mazeBinaryTree(rows, cols, s, e);
            case "sidewinder":
                return PF.mazeSidewinder(rows, cols, s, e);
            case "prims":
                return PF.mazePrims(rows, cols, s, e);
            case "huntandkill":
                return PF.mazeHuntAndKill(rows, cols, s, e);
        }
    }

    /* -------- geometry -------- */
    const computeGeom = useCallback(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;
        const W = wrap.clientWidth;
        const H = wrap.clientHeight;
        const cell = CELL_PX[settingsRef.current.gridSize];
        const cols = Math.max(6, Math.floor(W / cell));
        const rows = Math.max(6, Math.floor(H / cell));
        const ox = Math.round((W - cols * cell) / 2);
        const oy = Math.round((H - rows * cell) / 2);
        geomRef.current = { cols, rows, cell, ox, oy };
    }, []);

    const placeEndpoints = useCallback(() => {
        const { rows, cols } = geomRef.current;
        const r = Math.floor(rows / 2);
        startRef.current = [r, Math.max(1, Math.floor(cols * 0.2))];
        endRef.current = [r, Math.min(cols - 2, Math.floor(cols * 0.8))];
    }, []);

    /* -------- drawing -------- */
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        const W = wrap.clientWidth;
        const H = wrap.clientHeight;
        if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            canvas.style.width = W + "px";
            canvas.style.height = H + "px";
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);

        const { cols, rows, cell, ox, oy } = geomRef.current;
        const { visited, frontier, pathSet, current } = stateRef.current;
        const walls = wallsRef.current;
        const [sr, sc] = startRef.current;
        const [er, ec] = endRef.current;
        const startKey = sr + "," + sc;
        const endKey = er + "," + ec;

        ctx.strokeStyle = "rgba(255,255,255,0.045)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let c = 0; c <= cols; c++) {
            const x = ox + c * cell + 0.5;
            ctx.moveTo(x, oy);
            ctx.lineTo(x, oy + rows * cell);
        }
        for (let r = 0; r <= rows; r++) {
            const y = oy + r * cell + 0.5;
            ctx.moveTo(ox, y);
            ctx.lineTo(ox + cols * cell, y);
        }
        ctx.stroke();

        const fill = (r: number, c: number, color: string, inset = 1, radius = 2) => {
            const x = ox + c * cell + inset;
            const y = oy + r * cell + inset;
            const s = cell - inset * 2;
            ctx.fillStyle = color;
            ctx.beginPath();
            if (ctx.roundRect) ctx.roundRect(x, y, s, s, radius);
            else ctx.rect(x, y, s, s);
            ctx.fill();
        };

        visited.forEach((k) => {
            const [r, c] = PF.parse(k);
            fill(r, c, COLORS.visited);
        });
        frontier.forEach((k) => {
            const [r, c] = PF.parse(k);
            fill(r, c, COLORS.frontier);
        });
        walls.forEach((k) => {
            const [r, c] = PF.parse(k);
            fill(r, c, COLORS.wall, 1, 2);
        });
        pathSet.forEach((k) => {
            if (k === startKey || k === endKey) return;
            const [r, c] = PF.parse(k);
            fill(r, c, COLORS.path);
        });
        if (current && current !== startKey && current !== endKey && !pathSet.has(current)) {
            const [r, c] = PF.parse(current);
            fill(r, c, COLORS.current);
        }
        fill(sr, sc, COLORS.start, 1, 3);
        fill(er, ec, COLORS.end, 1, 3);
    }, []);

    drawRef.current = draw;

    /* -------- frame state -------- */
    function stateAtFrame(run: Run, frame: number) {
        const exploredCount = Math.min(frame, run.order.length);
        const visited = new Set<PF.CellKey>();
        const frontier = new Set<PF.CellKey>();
        for (let i = 0; i < exploredCount; i++) visited.add(run.order[i].key);
        for (let i = 0; i < exploredCount; i++)
            for (const k of run.order[i].frontier) if (!visited.has(k)) frontier.add(k);
        const pathSet = new Set<PF.CellKey>();
        if (run.path) {
            const pc = Math.max(0, frame - run.order.length);
            for (let i = 0; i < Math.min(pc, run.path.length); i++) pathSet.add(run.path[i]);
        }
        const current = exploredCount > 0 ? run.order[exploredCount - 1].key : null;
        return { visited, frontier, pathSet, exploredCount, current };
    }

    function syncMetrics(run: Run, frame: number) {
        const st = stateRef.current;
        const exploredCount = st.exploredCount || 0;
        const reached = !!run.path && frame >= run.order.length;
        setMetrics({
            explored: exploredCount,
            frontierSize: st.frontier.size,
            pathLen: reached && run.path ? run.path.length : null,
            total: run.order.length,
            elapsed: run.computeMs,
        });
        setProgress(run.total ? frame / run.total : 0);
    }

    function applyFrame(run: Run, frame: number) {
        stateRef.current = stateAtFrame(run, frame);
        drawRef.current();
        syncMetrics(run, frame);
    }

    function buildRun(): Run {
        const { rows, cols } = geomRef.current;
        const s = settingsRef.current;
        const t0 = performance.now();
        const res = PF.search({
            rows,
            cols,
            walls: wallsRef.current,
            start: startRef.current,
            end: endRef.current,
            algo: s.algo,
            diagonal: s.diagonal,
            heuristicKind: s.heuristic,
        });
        const computeMs = Math.max(1, Math.round((performance.now() - t0) * 10) / 10);
        const total = res.order.length + (res.path ? res.path.length : 0);
        return { ...res, total, computeMs };
    }

    /* -------- animation -------- */
    const loop = useCallback(() => {
        const run = runRef.current;
        if (!run) return;
        const sp = EXPLORE_SPEED[settingsRef.current.pathSpeed];
        frameRef.current = Math.min(frameRef.current + sp, run.total);
        applyFrame(run, frameRef.current);
        if (frameRef.current >= run.total) {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            setStatus(run.path ? "done" : "nopath");
            return;
        }
        rafRef.current = requestAnimationFrame(loop);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function startRun() {
        if (
            settingsRef.current.status === "paused" &&
            runRef.current &&
            frameRef.current < runRef.current.total
        ) {
            setStatus("running");
            rafRef.current = requestAnimationFrame(loop);
            return;
        }
        const run = buildRun();
        runRef.current = run;
        frameRef.current = 0;
        setStatus("running");
        rafRef.current = requestAnimationFrame(loop);
    }

    function pauseRun() {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        if (settingsRef.current.status === "mazing") return;
        setStatus("paused");
    }

    function stepOnce() {
        if (busy) return;
        if (!runRef.current || frameRef.current >= runRef.current.total) {
            runRef.current = buildRun();
            frameRef.current = 0;
        }
        frameRef.current = Math.min(frameRef.current + 1, runRef.current.total);
        applyFrame(runRef.current, frameRef.current);
        if (frameRef.current >= runRef.current.total) {
            setStatus(runRef.current.path ? "done" : "nopath");
        } else setStatus("paused");
    }

    function scrub(p: number) {
        const run = runRef.current;
        if (!run) return;
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        frameRef.current = Math.round(p * run.total);
        applyFrame(run, frameRef.current);
        if (frameRef.current >= run.total) setStatus(run.path ? "done" : "nopath");
        else setStatus("paused");
    }

    function clearPaths() {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        runRef.current = null;
        frameRef.current = 0;
        stateRef.current = {
            visited: new Set(),
            frontier: new Set(),
            pathSet: new Set(),
            current: null,
            exploredCount: 0,
        };
        setStatus("idle");
        setMetrics({ explored: 0, frontierSize: 0, pathLen: null, total: 0, elapsed: null });
        setProgress(0);
        drawRef.current();
    }

    function resetGrid() {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        wallsRef.current = new Set();
        computeGeom();
        placeEndpoints();
        // Force the canvas to fully reinitialize. Setting width/height clears
        // every pixel — without this, the next draw skips the resize branch
        // and the old grid lines bleed through under the new cell size.
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
        }
        clearPaths();
        setTick((t) => t + 1);
    }

    function generateMaze(type?: Exclude<PF.MazeType, "none">) {
        const current = settingsRef.current.mazeType;
        const t: Exclude<PF.MazeType, "none"> | null =
            type ?? (current === "none" ? null : current);
        if (!t) return;
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        runRef.current = null;
        frameRef.current = 0;
        stateRef.current = {
            visited: new Set(),
            frontier: new Set(),
            pathSet: new Set(),
            current: null,
            exploredCount: 0,
        };
        setProgress(0);
        setMetrics({ explored: 0, frontierSize: 0, pathLen: null, total: 0, elapsed: null });
        const { rows, cols } = geomRef.current;
        const list = mazeFor(t, rows, cols);
        wallsRef.current = new Set();
        setStatus("mazing");
        let i = 0;
        const speed = MAZE_SPEED[settingsRef.current.mazeSpeed];
        const tickMaze = () => {
            for (let n = 0; n < speed && i < list.length; n++, i++) wallsRef.current.add(list[i]);
            drawRef.current();
            if (i < list.length) rafRef.current = requestAnimationFrame(tickMaze);
            else {
                rafRef.current = null;
                setStatus("idle");
            }
        };
        rafRef.current = requestAnimationFrame(tickMaze);
    }

    /* -------- pointer interaction -------- */
    function cellAt(e: React.PointerEvent): [number, number] | null {
        const { ox, oy, cell, rows, cols } = geomRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - ox;
        const y = e.clientY - rect.top - oy;
        const c = Math.floor(x / cell);
        const r = Math.floor(y / cell);
        if (r < 0 || c < 0 || r >= rows || c >= cols) return null;
        return [r, c];
    }

    function onPointerDown(e: React.PointerEvent) {
        if (busy) return;
        const cell = cellAt(e);
        if (!cell) return;
        const k = cell[0] + "," + cell[1];
        const sk = startRef.current.join(",");
        const ek = endRef.current.join(",");
        if (k === sk) dragRef.current = { mode: "start" };
        else if (k === ek) dragRef.current = { mode: "end" };
        else {
            const erase = wallsRef.current.has(k);
            dragRef.current = { mode: "wall", erase };
            toggleWall(cell, erase);
        }
        canvasRef.current?.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: React.PointerEvent) {
        const drag = dragRef.current;
        if (!drag) return;
        const cell = cellAt(e);
        if (!cell) return;
        const k = cell[0] + "," + cell[1];
        if (drag.mode === "wall") {
            toggleWall(cell, drag.erase);
        } else {
            const sk = startRef.current.join(",");
            const ek = endRef.current.join(",");
            if (wallsRef.current.has(k)) return;
            if (drag.mode === "start" && k !== ek) {
                startRef.current = cell;
                afterEdit();
            }
            if (drag.mode === "end" && k !== sk) {
                endRef.current = cell;
                afterEdit();
            }
        }
    }

    function onPointerUp() {
        dragRef.current = null;
    }

    function toggleWall(cell: [number, number], erase: boolean) {
        const k = cell[0] + "," + cell[1];
        const sk = startRef.current.join(",");
        const ek = endRef.current.join(",");
        if (k === sk || k === ek) return;
        if (erase) wallsRef.current.delete(k);
        else wallsRef.current.add(k);
        afterEdit();
    }

    function afterEdit() {
        const s = settingsRef.current.status;
        if (runRef.current && (s === "done" || s === "nopath" || s === "paused")) {
            runRef.current = buildRun();
            frameRef.current = runRef.current.total;
            applyFrame(runRef.current, frameRef.current);
            setStatus(runRef.current.path ? "done" : "nopath");
        } else {
            drawRef.current();
        }
        setTick((t) => t + 1);
    }

    /* -------- lifecycle -------- */
    useEffect(() => {
        computeGeom();
        placeEndpoints();
        drawRef.current();
        setTick((t) => t + 1);
        const onResize = () => {
            computeGeom();
            placeEndpoints();
            clearPaths();
            setTick((t) => t + 1);
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        resetGrid();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gridSize]);

    useEffect(() => {
        if (mazeType !== "none") generateMaze(mazeType);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mazeType]);

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
                if (busy) pauseRun();
                else startRun();
            } else if (e.key.toLowerCase() === "s") {
                stepOnce();
            } else if (e.key.toLowerCase() === "c") {
                clearPaths();
            } else if (e.key.toLowerCase() === "r") {
                resetGrid();
            } else if (e.key.toLowerCase() === "m") {
                const fallback: Exclude<PF.MazeType, "none"> = "recursive";
                const cur = settingsRef.current.mazeType;
                generateMaze(cur === "none" ? fallback : cur);
            } else if (e.key === "Tab") {
                e.preventDefault();
                const order: PF.AlgoKey[] = ["astar", "dijkstra", "greedy", "bfs", "dfs"];
                const i = order.indexOf(settingsRef.current.algo);
                setAlgo(order[(i + 1) % order.length]);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, mazeType, busy]);

    /* -------- endpoint icon positions -------- */
    const { ox, oy, cell } = geomRef.current;
    const iconStyle = (pos: [number, number]) => ({
        left: ox + pos[1] * cell + "px",
        top: oy + pos[0] * cell + "px",
        width: cell + "px",
        height: cell + "px",
    });

    return (
        <div className="stage">
            <div className="grid-wrap" ref={wrapRef}>
                <canvas
                    ref={canvasRef}
                    className="grid-canvas"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={onPointerUp}
                    style={{ cursor: busy ? "default" : "crosshair" }}
                />
                <div className="endpoint" style={iconStyle(startRef.current)} data-k={tick}>
                    <FlagIcon
                        size={Math.min(15, cell - 8)}
                        fill="currentColor"
                        strokeWidth={0}
                        style={{
                            color: "#fff",
                            filter: "drop-shadow(0 1px 1px rgba(0,0,0,.45))",
                        }}
                    />
                </div>
                <div className="endpoint" style={iconStyle(endRef.current)} data-k={tick}>
                    <TargetIcon
                        size={Math.min(16, cell - 6)}
                        strokeWidth={2.5}
                        style={{
                            color: "#fff",
                            filter: "drop-shadow(0 1px 1px rgba(0,0,0,.45))",
                        }}
                    />
                </div>
            </div>

            <ControlPanel
                algo={algo}
                setAlgo={setAlgo}
                mazeType={mazeType}
                setMazeType={setMazeType}
                gridSize={gridSize}
                setGridSize={setGridSize}
                pathSpeed={pathSpeed}
                setPathSpeed={setPathSpeed}
                mazeSpeed={mazeSpeed}
                setMazeSpeed={setMazeSpeed}
                diagonal={diagonal}
                setDiagonal={setDiagonal}
                heuristic={heuristic}
                setHeuristic={setHeuristic}
                status={status}
                busy={busy}
            />

            <div className="right-rail">
                <MetricsPanel
                    metrics={metrics}
                    algo={algo}
                    heuristic={heuristic}
                    diagonal={diagonal}
                    status={status}
                />
                <Legend />
            </div>

            <ActionBar
                status={status}
                onStart={startRun}
                onPause={pauseRun}
                onStep={stepOnce}
                onClear={clearPaths}
                onReset={resetGrid}
                progress={progress}
                onScrub={scrub}
                canScrub={!!runRef.current}
            />

            <UtilityDock onShortcuts={() => setShortcutsOpen((v) => !v)} />
            {shortcutsOpen && <ShortcutsCard onClose={() => setShortcutsOpen(false)} />}
        </div>
    );
}
