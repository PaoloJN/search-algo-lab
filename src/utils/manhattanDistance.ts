import type { Node } from "@/models/Node";

export default function manhattanDistance(a: Node, b: Node): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
