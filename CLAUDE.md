# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Pathfinding & maze-generation visualizer originally forked from `TylerMommsen/pathfinding-visualizer`. Paolo has been mid-migration from the original SCSS/Context implementation toward Tailwind v4 + shadcn/ui + Jotai. The repo currently contains **three coexisting routes** that represent different stages of that migration — this is intentional WIP, not duplication to delete blindly.

Repo directory name is `search-algo` but the package is still `pathfinding-visualizer`.

## Commands

```bash
npm run dev      # next dev — visit /, /shadcn, /v2
npm run build
npm run lint     # next lint (eslint-config-next)
npm start
```

No test framework is set up. Both `package-lock.json` and `bun.lockb` are present; pick one before publishing.

## Architecture — three routes, three stages

| Route | File | Stack | State |
|---|---|---|---|
| `/` | `src/app/page.tsx` → `components/layout/*` | SCSS modules, custom dropdowns | Working (original baseline) |
| `/shadcn` | `src/app/shadcn/page.tsx` | shadcn/ui + Tailwind v4 + lucide | Monolithic ~1050-line WIP: Grid, Selections, Context, `dijkstra`, Info, HowToUse all inlined in one file. Has explicit `// TODO` markers from Paolo. |
| `/v2` | `src/app/v2/page.tsx` | Jotai atoms + shadcn | Clean scaffold only — `Controls`, `Instructions`, `Legend`, `Stats`, `Grid` are empty stubs. The atoms (`algorithmAtom`, `mazeTypeAtom`, etc.) define the target state shape. |

When asked to "clean up" or "polish," confirm with Paolo which route is the target before refactoring — `/v2`'s atoms are the most recent direction.

### Algorithm/maze layer (shared, route-independent)

- `src/utils/algorithms/{astar,dijkstra,bidirectional}.ts` — visualization functions. Signature: `(startNode, endNode, grid, gridNodeRefs, speed) => Promise<boolean>`. They `await sleep(speed)` between steps and mutate DOM directly via `gridNodeRefs.current[id].classList.add(...)` for animation performance.
- `src/utils/mazes/{recursivedivision,binarytree,sidewinder,prims,huntandkill,randommap}.ts` — same pattern.
- `src/models/createNode.ts` — `Node` shape (id, x, y, neighbors, isWall/isStart/isEnd/isPath/isOpenSet/isClosedSet, gCost, hCost, fCost()).
- `src/utils/priorityQueue.ts`, `manhattanDistance.ts` — supporting utils.

**The grid is a 2D array of mutable node objects.** State updates happen by direct mutation + DOM class swaps, not React re-renders. This is deliberate for animation perf; don't "fix" it by converting to immutable updates unless you also rework the algorithm visualizers.

### Algorithm dispatch

In both `Grid.tsx` (route `/`) and `app/shadcn/page.tsx`, the algorithm/maze choice is dispatched via duplicated `if/else if` chains on the selection string. Any rework should consolidate to a single name→function map and share it.

### State management

- `/` uses `src/contexts/SelectionsContext.tsx` — typed `any`, holds `selections` object + a handful of boolean flags (`start`, `resetClicked`, `clearPaths`, `algorithmRunning`, `mazeGenerating`, `algorithmDone`).
- `/v2` uses Jotai atoms in `src/app/v2/page.tsx` (currently colocated with the page).
- The boolean flags are *triggers* — components set them true, `Grid`'s `useEffect` reacts and sets them back. Be careful refactoring; the `eslint-disable react-hooks/exhaustive-deps` comments are load-bearing.

### Styling

Mixed. `/` imports `src/styles/globals.scss` (partials in `src/styles/layout/*`, `src/styles/_variables.scss`) — most of that file is commented out. `/shadcn` and `/v2` use `src/app/globals.css` (Tailwind v4 with `@theme inline` and oklch design tokens). Both stylesheets are loaded globally via `layout.tsx`.

`<body>` is forced to `bg-[#101010]` in `globals.css` and `<html>` has `className="dark"` hardcoded in `layout.tsx`.

## Known rough edges (before publishing)

- README still points to the upstream author's live demo, repo, and assets.
- `package.json` is `"pathfinding-visualizer" v0.1.0` with no author/repo/license fields.
- Both lockfiles checked in; pick one.
- `/shadcn/page.tsx` is a 1000+ line single file with mixed concerns.
- `/v2` UI components are empty.
- `src/components/modals/HelpModal.tsx` exists but is commented out at its only call site.
- `next.config.mjs` is empty default.
- ESLint config is the bare `next/core-web-vitals` preset; many `any`s and `eslint-disable` comments throughout.
