#!/usr/bin/env bun
/**
 * Generate favicons + OG image + apple-touch-icon from the logo SVG.
 * Run with:  bun run scripts/gen-assets.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = resolve(import.meta.dir, "..");
const publicDir = resolve(root, "public");
const srcLogo = resolve(publicDir, "logo.svg");

async function svgBuffer() {
    return readFile(srcLogo);
}

async function pngFromSvg(size, opts = {}) {
    const buf = await svgBuffer();
    let pipeline = sharp(buf, { density: 1024 }).resize(size, size, {
        fit: "contain",
        background: opts.background || { r: 0, g: 0, b: 0, alpha: 0 },
    });
    return pipeline.png().toBuffer();
}

async function ensureDir(p) {
    await mkdir(p, { recursive: true });
}

async function writePng(name, size, opts) {
    const path = resolve(publicDir, name);
    await ensureDir(dirname(path));
    const buf = await pngFromSvg(size, opts);
    await writeFile(path, buf);
    console.log("wrote", name, `${size}x${size}`);
}

async function writeIco() {
    const sizes = [16, 32, 48];
    const bufs = await Promise.all(
        sizes.map((s) => pngFromSvg(s, { background: { r: 21, g: 21, b: 21, alpha: 1 } })),
    );
    const ico = await pngToIco(bufs);
    await writeFile(resolve(publicDir, "favicon.ico"), ico);
    console.log("wrote favicon.ico", sizes.join("/"));
}

async function writeOg() {
    // 1200x630 — logo centered-left, title + tagline on right.
    const ogSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a1a1a"/>
      <stop offset="1" stop-color="#0f0f0f"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Logo, scaled up, on the left -->
  <g transform="translate(96 195) scale(1.333)">
    <rect width="180" height="180" rx="20" fill="#151515"/>
    <rect x="43" y="66.4464" width="18.6607" height="54.2857" fill="white"/>
    <rect x="119.339" y="59.6607" width="18.6607" height="61.0714" fill="white"/>
    <rect x="94" y="66" width="18.66" height="55" fill="white"/>
    <rect x="68.455" y="59" width="18.66" height="53" fill="white"/>
    <path d="M68.4464 59.6607V59.6607C68.4464 49.3547 76.8011 41 87.1071 41L119.339 41V59.6607L68.4464 59.6607Z" fill="white"/>
    <path d="M61.6608 139.393L61.6608 120.732L112.554 120.732V120.732C112.554 131.038 104.199 139.393 93.8929 139.393H61.6608Z" fill="white"/>
  </g>

  <!-- Text block -->
  <g font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" fill="#ffffff">
    <text x="448" y="290" font-size="76" font-weight="600" letter-spacing="-2">pathfinding-lab</text>
    <text x="448" y="346" font-size="30" font-weight="400" fill="rgba(255,255,255,0.6)">Pathfinding &amp; maze-generation visualizer</text>
    <text x="448" y="402" font-size="22" font-weight="500" fill="rgba(126,160,255,0.95)" letter-spacing="0.5">A* · Dijkstra · BFS · DFS · Greedy</text>
  </g>
</svg>`;

    const buf = await sharp(Buffer.from(ogSvg), { density: 160 })
        .resize(1200, 630)
        .png()
        .toBuffer();
    await writeFile(resolve(publicDir, "og.png"), buf);
    console.log("wrote og.png 1200x630");
}

async function main() {
    await ensureDir(publicDir);

    // Transparent PNGs (browsers + manifest pick the right size automatically).
    await writePng("favicon-16.png", 16);
    await writePng("favicon-32.png", 32);
    await writePng("apple-touch-icon.png", 180);
    await writePng("icon-192.png", 192);
    await writePng("icon-512.png", 512);

    await writeIco();
    await writeOg();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
