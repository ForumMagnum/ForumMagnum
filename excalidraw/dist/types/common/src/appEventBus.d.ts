import type { UnsubscribeCallback } from "../../excalidraw/types";
export type AppEventPayloadMap = Record<string, unknown[]>;
export type AppEventBehavior = {
    cardinality: "once" | "many";
    replay: "none" | "last";
};
export type AppEventBehaviorMap<Events extends AppEventPayloadMap> = {
    [K in keyof Events]: AppEventBehavior;
};
type AwaitableAppEventKeys<Events extends AppEventPayloadMap, Behavior extends AppEventBehaviorMap<Events>> = {
    [K in keyof Events]: Behavior[K]["cardinality"] extends "once" ? Behavior[K]["replay"] extends "last" ? K : never : never;
}[keyof Events];
type AppEventPromiseValue<Args extends any[]> = Args extends [infer Only] ? Only : Args;
export declare class AppEventBus<Events extends AppEventPayloadMap, Behavior extends AppEventBehaviorMap<Events>> {
    private readonly behavior;
    private readonly emitters;
    private readonly lastPayload;
    private readonly emittedOnce;
    constructor(behavior: Behavior);
    private getEmitter;
    private toPromiseValue;
    on<K extends keyof Events>(name: K, callback: (...args: Events[K]) => void): UnsubscribeCallback;
    on<K extends AwaitableAppEventKeys<Events, Behavior>>(name: K): Promise<AppEventPromiseValue<Events[K]>>;
    emit<K extends keyof Events>(name: K, ...args: Events[K]): void;
    clear(): void;
}
export {};
