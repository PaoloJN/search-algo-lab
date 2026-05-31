export interface PriorityQueue<T> {
    enqueue: (item: T, priority: number) => void;
    dequeue: () => T | undefined;
    isEmpty: () => boolean;
}

export default function createPriorityQueue<T>(): PriorityQueue<T> {
    const items: { item: T; priority: number }[] = [];

    function enqueue(item: T, priority: number) {
        const entry = { item, priority };

        for (let i = 0; i < items.length; i++) {
            if (items[i].priority > entry.priority) {
                items.splice(i, 0, entry);
                return;
            }
        }

        items.push(entry);
    }

    function dequeue(): T | undefined {
        return items.shift()?.item;
    }

    function isEmpty() {
        return items.length === 0;
    }

    return { enqueue, dequeue, isEmpty };
}
