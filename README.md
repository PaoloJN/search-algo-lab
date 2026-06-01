<p align="center">
  <img src="public/logo.svg" alt="pathfinding-lab logo" width="120" />
</p>

<h1 align="center">pathfinding-lab</h1>

<p align="center">
  An interactive visualizer for pathfinding and maze-generation algorithms.
</p>

<p align="center">
  <a href="https://pathfindinglab.vercel.app">Live demo</a>
  &middot;
  <a href="#features">Features</a>
  &middot;
  <a href="#running-locally">Running locally</a>
</p>

---

Step through A\*, Dijkstra, Greedy best-first, BFS, and DFS searches on grids you build yourself, or watch six classic maze generators carve the canvas in real time. Scrub the timeline frame-by-frame, drag the start and goal anywhere, draw or erase walls live.

## Features

**Pathfinding algorithms**

- A\* Search (with Manhattan / Euclidean / Chebyshev heuristics)
- Dijkstra
- Greedy best-first
- Breadth-first (BFS)
- Depth-first (DFS)

**Maze generation**

- Recursive division
- Binary tree
- Sidewinder
- Prim's
- Hunt and kill
- Random fill

**Interactive controls**

- Draw walls with left-click + drag; erase by clicking again
- Drag the flag and target anywhere — paths re-solve instantly
- Play, pause, step forward, step back, or scrub the timeline
- Three grid densities (Small / Medium / Large)
- Four animation speeds (Slow / Normal / Fast / Instant)
- Optional diagonal moves
- Light / dark / system theme
- Keyboard shortcuts (Space, S, B, C, R, M, X, H, Tab)

## Tech stack

![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-black?logo=shadcnui&logoColor=white)
![Jotai](https://img.shields.io/badge/Jotai-black?logoColor=white)

## Running locally

Requires [Bun](https://bun.sh).

```bash
git clone https://github.com/PaoloJN/pathfinding-lab.git
cd pathfinding-lab
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
bun run dev          # start the dev server
bun run build        # production build
bun run lint         # run the linter
bun run format       # format with prettier
bun run gen-assets   # regenerate favicons + OG image from public/logo.svg
```

Deployed on Vercel.

## Credits

Originally inspired by [TylerMommsen/pathfinding-visualizer](https://github.com/TylerMommsen/pathfinding-visualizer). This version is a rebuild on top of Next.js 14, Tailwind v4, shadcn/ui, and Jotai, with the UI designed in [Claude Design](https://claude.ai/design).

## License

MIT — see [LICENSE](./LICENSE).
