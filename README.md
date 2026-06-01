

<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/logo-light.svg">
    <img src="public/icon-192.png" alt="" width="40" align="left" style="vertical-align: middle;">
  </picture>
  &nbsp;Pathfinding Lab
</h1>


An interactive visualizer for pathfinding and maze-generation algorithms. Step through A\*, Dijkstra, and Bidirectional search on grids you build yourself, or watch classic maze generators carve the canvas in real time.


## Features

**Pathfinding**

- A\* Search
- Dijkstra's Algorithm
- Bidirectional Search

**Maze generation**

- Recursive Division
- Binary Tree
- Sidewinder
- Prim's Algorithm
- Hunt and Kill
- Random Map

**Interactive controls**

- Left-click + drag to draw walls; right-click to erase
- Drag the start and end markers anywhere on the grid
- Adjustable path and maze animation speed (Slow / Normal / Fast / Instant)
- Two grid densities
- Dragging start/end after a run replays the algorithm instantly

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
```

Deployed on Vercel.

## Credits

Based on [TylerMommsen/pathfinding-visualizer](https://github.com/TylerMommsen/pathfinding-visualizer). This version is rebuilt on top of Next.js 14, Tailwind v4, shadcn/ui, and Jotai, with cleaned-up types and a refreshed UI.

## License

MIT — see [LICENSE](./LICENSE).
