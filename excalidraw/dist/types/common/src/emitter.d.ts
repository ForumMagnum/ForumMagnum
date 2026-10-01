import type { UnsubscribeCallback } from "../../excalidraw/types";
type Subscriber<T extends any[]> = (...payload: T) => void;
export declare class Emitter<T extends any[] = []> {
    subscribers: Subscriber<T>[];
    /**
     * Attaches subscriber
     *
     * @returns unsubscribe function
     */
    on(...handlers: Subscriber<T>[] | Subscriber<T>[][]): UnsubscribeCallback;
    once(...handlers: Subscriber<T>[] | Subscriber<T>[][]): UnsubscribeCallback;
    off(...handlers: Subscriber<T>[] | Subscriber<T>[][]): void;
    trigger(...payload: T): this;
    clear(): void;
}
export {};
