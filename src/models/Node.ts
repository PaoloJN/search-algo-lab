export interface Node {
    id: number;
    x: number;
    y: number;
    neighbors: Node[];

    isWall: boolean;
    isStart: boolean;
    isEnd: boolean;
    isPath: boolean;
    isOpenSet: boolean;
    isClosedSet: boolean;

    previousNode: Node | null;
    gCost: number;
    hCost: number;
    fCost: number;
}

export function createNode(id: number, x: number, y: number): Node {
    return {
        id,
        x,
        y,
        neighbors: [],

        isWall: false,
        isStart: false,
        isEnd: false,
        isPath: false,
        isOpenSet: false,
        isClosedSet: false,

        previousNode: null,
        gCost: Infinity,
        hCost: 0,
        fCost: 0,
    };
}

export type Grid = Node[][];

export type NodeRefMap = Record<number, HTMLDivElement | null>;
