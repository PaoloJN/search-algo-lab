/**
 * Pathfinding engine for pathfinding-lab.
 *
 * Grid model: rows x cols. walls is a Set of "r,c" keys.
 * search() pre-computes the entire run so the UI can scrub/step/replay.
 */

export type CellKey = string;
export type AlgoKey = "astar" | "dijkstra" | "greedy" | "bfs" | "dfs";
export type HeuristicKind = "manhattan" | "euclidean" | "chebyshev";
export type MazeType =
    | "none"
    | "recursive"
    | "random"
    | "binarytree"
    | "sidewinder"
    | "prims"
    | "huntandkill";

export const K = (r: number, c: number): CellKey => r + "," + c;
export const parse = (k: CellKey): [number, number] => {
    const i = k.indexOf(",");
    return [parseInt(k.slice(0, i), 10), parseInt(k.slice(i + 1), 10)];
};

export function neighbours(
    r: number,
    c: number,
    rows: number,
    cols: number,
    diagonal: boolean,
): [number, number][] {
    const orth: [number, number][] = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
    ];
    const diag: [number, number][] = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
    ];
    const dirs = diagonal ? [...orth, ...diag] : orth;
    const out: [number, number][] = [];
    for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        out.push([nr, nc]);
    }
    return out;
}

export function heuristic(
    ar: number,
    ac: number,
    br: number,
    bc: number,
    kind: HeuristicKind,
): number {
    const dx = Math.abs(ar - br);
    const dy = Math.abs(ac - bc);
    if (kind === "euclidean") return Math.sqrt(dx * dx + dy * dy);
    if (kind === "chebyshev") return Math.max(dx, dy);
    return dx + dy;
}

class Heap {
    private a: { p: number; k: CellKey }[] = [];
    get size() {
        return this.a.length;
    }
    push(item: { p: number; k: CellKey }) {
        const a = this.a;
        a.push(item);
        let i = a.length - 1;
        while (i > 0) {
            const par = (i - 1) >> 1;
            if (a[par].p <= a[i].p) break;
            [a[par], a[i]] = [a[i], a[par]];
            i = par;
        }
    }
    pop(): { p: number; k: CellKey } | undefined {
        const a = this.a;
        if (!a.length) return undefined;
        const top = a[0];
        const last = a.pop()!;
        if (a.length) {
            a[0] = last;
            let i = 0;
            for (;;) {
                const l = 2 * i + 1;
                const r = l + 1;
                let s = i;
                if (l < a.length && a[l].p < a[s].p) s = l;
                if (r < a.length && a[r].p < a[s].p) s = r;
                if (s === i) break;
                [a[s], a[i]] = [a[i], a[s]];
                i = s;
            }
        }
        return top;
    }
}

function reconstruct(
    prev: Map<CellKey, CellKey>,
    endKey: CellKey,
    startKey: CellKey,
): CellKey[] | null {
    if (!prev.has(endKey) && endKey !== startKey) return null;
    const path: CellKey[] = [endKey];
    let cur = endKey;
    while (cur !== startKey) {
        const p = prev.get(cur);
        if (p === undefined) return null;
        path.push(p);
        cur = p;
    }
    return path.reverse();
}

export type SearchStep = { key: CellKey; frontier: CellKey[] };
export type SearchResult = {
    order: SearchStep[];
    path: CellKey[] | null;
    found: boolean;
    cost: number | null;
};

export function search(opts: {
    rows: number;
    cols: number;
    walls: Set<CellKey>;
    start: [number, number];
    end: [number, number];
    algo: AlgoKey;
    diagonal: boolean;
    heuristicKind: HeuristicKind;
}): SearchResult {
    const { rows, cols, walls, start, end, algo, diagonal, heuristicKind } = opts;
    const startKey = K(start[0], start[1]);
    const endKey = K(end[0], end[1]);
    const [er, ec] = end;

    const order: SearchStep[] = [];
    const prev = new Map<CellKey, CellKey>();
    const g = new Map<CellKey, number>();
    const visited = new Set<CellKey>();
    g.set(startKey, 0);

    const useHeap = algo === "dijkstra" || algo === "astar" || algo === "greedy";
    const heap = new Heap();
    const stack: CellKey[] = [];
    const queue: CellKey[] = [];

    const prio = (r: number, c: number, gv: number) => {
        if (algo === "greedy") return heuristic(r, c, er, ec, heuristicKind);
        if (algo === "astar") return gv + heuristic(r, c, er, ec, heuristicKind);
        return gv;
    };

    if (useHeap) heap.push({ p: prio(start[0], start[1], 0), k: startKey });
    else if (algo === "dfs") stack.push(startKey);
    else queue.push(startKey);

    let found = false;

    function popNext(): CellKey | null {
        if (useHeap) return heap.size ? heap.pop()!.k : null;
        if (algo === "dfs") return stack.length ? stack.pop()! : null;
        return queue.length ? queue.shift()! : null;
    }

    while (true) {
        const curKey = popNext();
        if (curKey === null) break;
        if (visited.has(curKey)) continue;
        visited.add(curKey);

        const [r, c] = parse(curKey);
        const discovered: CellKey[] = [];

        if (curKey === endKey) {
            order.push({ key: curKey, frontier: [] });
            found = true;
            break;
        }

        for (const [nr, nc] of neighbours(r, c, rows, cols, diagonal)) {
            const nk = K(nr, nc);
            if (walls.has(nk) || visited.has(nk)) continue;
            const tentative = (g.get(curKey) ?? Infinity) + 1;

            if (useHeap) {
                if (algo === "greedy") {
                    if (!g.has(nk)) {
                        g.set(nk, tentative);
                        prev.set(nk, curKey);
                        heap.push({ p: prio(nr, nc, tentative), k: nk });
                        discovered.push(nk);
                    }
                } else if (tentative < (g.get(nk) ?? Infinity)) {
                    g.set(nk, tentative);
                    prev.set(nk, curKey);
                    heap.push({ p: prio(nr, nc, tentative), k: nk });
                    discovered.push(nk);
                }
            } else {
                if (!g.has(nk)) {
                    g.set(nk, tentative);
                    prev.set(nk, curKey);
                    if (algo === "dfs") stack.push(nk);
                    else queue.push(nk);
                    discovered.push(nk);
                }
            }
        }
        order.push({ key: curKey, frontier: discovered });
    }

    const path = found ? reconstruct(prev, endKey, startKey) : null;
    return { order, path, found, cost: found && g.has(endKey) ? g.get(endKey)! : null };
}

/* ---------------- Maze generators ---------------- */

export function mazeRandom(
    rows: number,
    cols: number,
    start: [number, number],
    end: [number, number],
    density = 0.28,
): CellKey[] {
    const walls: CellKey[] = [];
    const sk = K(start[0], start[1]);
    const ek = K(end[0], end[1]);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const k = K(r, c);
            if (k === sk || k === ek) continue;
            if (Math.random() < density) walls.push(k);
        }
    }
    for (let i = walls.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [walls[i], walls[j]] = [walls[j], walls[i]];
    }
    return walls;
}

export function mazeRecursiveDivision(
    rows: number,
    cols: number,
    start: [number, number],
    end: [number, number],
): CellKey[] {
    const walls: CellKey[] = [];
    const wallSet = new Set<CellKey>();
    const sk = K(start[0], start[1]);
    const ek = K(end[0], end[1]);
    const add = (r: number, c: number) => {
        const k = K(r, c);
        if (k === sk || k === ek || wallSet.has(k)) return;
        if (r < 0 || c < 0 || r >= rows || c >= cols) return;
        wallSet.add(k);
        walls.push(k);
    };

    for (let c = 0; c < cols; c++) {
        add(0, c);
        add(rows - 1, c);
    }
    for (let r = 0; r < rows; r++) {
        add(r, 0);
        add(r, cols - 1);
    }

    function randEven(n: number) {
        return Math.floor(Math.random() * (n / 2)) * 2;
    }
    function randOdd(n: number) {
        return Math.floor(Math.random() * (n / 2)) * 2 + 1;
    }
    function choose(w: number, h: number): "h" | "v" {
        return w < h ? "h" : w > h ? "v" : Math.random() < 0.5 ? "h" : "v";
    }

    function divide(x: number, y: number, w: number, h: number, orientation: "h" | "v") {
        if (w < 2 || h < 2) return;
        const horizontal = orientation === "h";
        let wx = x + (horizontal ? 0 : randEven(w - 1));
        let wy = y + (horizontal ? randEven(h - 1) : 0);
        const px = wx + (horizontal ? randOdd(w) : 0);
        const py = wy + (horizontal ? 0 : randOdd(h));
        const dx = horizontal ? 1 : 0;
        const dy = horizontal ? 0 : 1;
        const len = horizontal ? w : h;
        for (let i = 0; i < len; i++) {
            if (wx !== px || wy !== py) add(wy, wx);
            wx += dx;
            wy += dy;
        }
        let nx = x;
        let ny = y;
        let [w1, h1] = horizontal ? [w, wy - y] : [wx - x, h];
        divide(nx, ny, w1, h1, choose(w1, h1));
        if (horizontal) {
            ny = wy + 1;
            h1 = y + h - wy - 1;
        } else {
            nx = wx + 1;
            w1 = x + w - wx - 1;
        }
        const [w2, h2] = horizontal ? [w, h1] : [w1, h];
        divide(nx, ny, w2, h2, choose(w2, h2));
    }

    divide(1, 1, cols - 2, rows - 2, choose(cols - 2, rows - 2));
    return walls;
}

/* ---- Helpers shared by carving mazes ---- */

function finalizeWalls(
    isWall: Set<CellKey>,
    rows: number,
    cols: number,
    start: [number, number],
    end: [number, number],
): CellKey[] {
    const sk = K(start[0], start[1]);
    const ek = K(end[0], end[1]);
    isWall.delete(sk);
    isWall.delete(ek);
    const result: CellKey[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const k = K(r, c);
            if (isWall.has(k)) result.push(k);
        }
    }
    // light shuffle so reveal isn't a strict left-to-right wipe
    for (let i = result.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        if (Math.abs(i - j) < 80) [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function fillAllAsWalls(rows: number, cols: number): Set<CellKey> {
    const walls = new Set<CellKey>();
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) walls.add(K(r, c));
    return walls;
}

export function mazeBinaryTree(
    rows: number,
    cols: number,
    start: [number, number],
    end: [number, number],
): CellKey[] {
    const walls = fillAllAsWalls(rows, cols);
    for (let r = 1; r < rows; r += 2) {
        for (let c = 1; c < cols; c += 2) {
            walls.delete(K(r, c));
            const canN = r > 1;
            const canW = c > 1;
            if (canN && canW) {
                if (Math.random() < 0.5) walls.delete(K(r - 1, c));
                else walls.delete(K(r, c - 1));
            } else if (canN) {
                walls.delete(K(r - 1, c));
            } else if (canW) {
                walls.delete(K(r, c - 1));
            }
        }
    }
    return finalizeWalls(walls, rows, cols, start, end);
}

export function mazeSidewinder(
    rows: number,
    cols: number,
    start: [number, number],
    end: [number, number],
): CellKey[] {
    const walls = fillAllAsWalls(rows, cols);
    for (let r = 1; r < rows; r += 2) {
        let runStart = 1;
        for (let c = 1; c < cols; c += 2) {
            walls.delete(K(r, c));
            const atEastBoundary = c >= cols - 2;
            const atNorthBoundary = r <= 1;
            const closeRun = atEastBoundary || (!atNorthBoundary && Math.random() < 0.35);
            if (closeRun) {
                if (!atNorthBoundary) {
                    const pick = runStart + 2 * Math.floor(Math.random() * ((c - runStart) / 2 + 1));
                    walls.delete(K(r - 1, pick));
                }
                runStart = c + 2;
            } else {
                walls.delete(K(r, c + 1));
            }
        }
    }
    return finalizeWalls(walls, rows, cols, start, end);
}

export function mazePrims(
    rows: number,
    cols: number,
    start: [number, number],
    end: [number, number],
): CellKey[] {
    const walls = fillAllAsWalls(rows, cols);
    const inMaze = new Set<CellKey>();
    const frontier: [number, number, number, number][] = []; // [r,c,wr,wc] cell + wall between

    function add(r: number, c: number) {
        inMaze.add(K(r, c));
        walls.delete(K(r, c));
        const cands: [number, number, number, number][] = [
            [r - 2, c, r - 1, c],
            [r + 2, c, r + 1, c],
            [r, c - 2, r, c - 1],
            [r, c + 2, r, c + 1],
        ];
        for (const [nr, nc, wr, wc] of cands) {
            if (nr < 1 || nc < 1 || nr >= rows - 1 || nc >= cols - 1) continue;
            if (inMaze.has(K(nr, nc))) continue;
            frontier.push([nr, nc, wr, wc]);
        }
    }

    const sr = 1 + 2 * Math.floor(Math.random() * Math.max(1, Math.floor((rows - 1) / 2)));
    const sc = 1 + 2 * Math.floor(Math.random() * Math.max(1, Math.floor((cols - 1) / 2)));
    add(sr, sc);

    while (frontier.length) {
        const idx = (Math.random() * frontier.length) | 0;
        const [r, c, wr, wc] = frontier.splice(idx, 1)[0];
        if (inMaze.has(K(r, c))) continue;
        walls.delete(K(wr, wc));
        add(r, c);
    }
    return finalizeWalls(walls, rows, cols, start, end);
}

export function mazeHuntAndKill(
    rows: number,
    cols: number,
    start: [number, number],
    end: [number, number],
): CellKey[] {
    const walls = fillAllAsWalls(rows, cols);
    const visited = new Set<CellKey>();

    function visit(r: number, c: number) {
        visited.add(K(r, c));
        walls.delete(K(r, c));
    }

    function unvisitedNeighbors(r: number, c: number): [number, number, number, number][] {
        const cands: [number, number, number, number][] = [
            [r - 2, c, r - 1, c],
            [r + 2, c, r + 1, c],
            [r, c - 2, r, c - 1],
            [r, c + 2, r, c + 1],
        ];
        return cands.filter(
            ([nr, nc]) =>
                nr >= 1 &&
                nc >= 1 &&
                nr < rows - 1 &&
                nc < cols - 1 &&
                !visited.has(K(nr, nc)),
        );
    }

    function visitedNeighbors(r: number, c: number): [number, number, number, number][] {
        const cands: [number, number, number, number][] = [
            [r - 2, c, r - 1, c],
            [r + 2, c, r + 1, c],
            [r, c - 2, r, c - 1],
            [r, c + 2, r, c + 1],
        ];
        return cands.filter(
            ([nr, nc]) =>
                nr >= 1 && nc >= 1 && nr < rows - 1 && nc < cols - 1 && visited.has(K(nr, nc)),
        );
    }

    let r = 1 + 2 * Math.floor(Math.random() * Math.max(1, Math.floor((rows - 1) / 2)));
    let c = 1 + 2 * Math.floor(Math.random() * Math.max(1, Math.floor((cols - 1) / 2)));
    visit(r, c);

    while (true) {
        const unv = unvisitedNeighbors(r, c);
        if (unv.length) {
            const [nr, nc, wr, wc] = unv[(Math.random() * unv.length) | 0];
            walls.delete(K(wr, wc));
            visit(nr, nc);
            r = nr;
            c = nc;
        } else {
            // hunt
            let found = false;
            outer: for (let hr = 1; hr < rows - 1; hr += 2) {
                for (let hc = 1; hc < cols - 1; hc += 2) {
                    if (visited.has(K(hr, hc))) continue;
                    const vn = visitedNeighbors(hr, hc);
                    if (vn.length) {
                        const [, , wr, wc] = vn[(Math.random() * vn.length) | 0];
                        walls.delete(K(wr, wc));
                        visit(hr, hc);
                        r = hr;
                        c = hc;
                        found = true;
                        break outer;
                    }
                }
            }
            if (!found) break;
        }
    }
    return finalizeWalls(walls, rows, cols, start, end);
}

export const ALGORITHMS: Record<
    AlgoKey,
    { label: string; weighted: boolean; guarantees: boolean; note: string }
> = {
    astar: {
        label: "A*",
        weighted: true,
        guarantees: true,
        note: "Heuristic-guided. Optimal with an admissible heuristic.",
    },
    dijkstra: {
        label: "Dijkstra",
        weighted: true,
        guarantees: true,
        note: "Uniform cost. Explores evenly outward. Guarantees shortest.",
    },
    greedy: {
        label: "Greedy BFS",
        weighted: false,
        guarantees: false,
        note: "Heads straight for the goal. Fast but not always shortest.",
    },
    bfs: {
        label: "BFS",
        weighted: false,
        guarantees: true,
        note: "Breadth-first. Shortest path on unweighted grids.",
    },
    dfs: {
        label: "DFS",
        weighted: false,
        guarantees: false,
        note: "Depth-first. Explores deep first. Rarely shortest.",
    },
};
