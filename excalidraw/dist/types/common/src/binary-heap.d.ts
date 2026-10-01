export declare class BinaryHeap<T> {
    private scoreFunction;
    private content;
    constructor(scoreFunction: (node: T) => number);
    sinkDown(idx: number): void;
    bubbleUp(idx: number): void;
    push(node: T): void;
    pop(): T | null;
    remove(node: T): void;
    size(): number;
    rescoreElement(node: T): void;
}
