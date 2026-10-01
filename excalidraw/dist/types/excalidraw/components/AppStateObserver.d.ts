import type { AppState, UnsubscribeCallback } from "../types";
type StateChangeSelector = keyof AppState | (keyof AppState)[] | ((appState: AppState) => unknown);
export type OnStateChange = {
    <K extends keyof AppState>(prop: K, callback: (value: AppState[K], appState: AppState) => void, opts?: {
        once: boolean;
    }): UnsubscribeCallback;
    <K extends keyof AppState>(prop: K): Promise<AppState[K]>;
    (prop: (keyof AppState)[], callback: (appState: AppState, appState2: AppState) => void, opts?: {
        once: boolean;
    }): UnsubscribeCallback;
    (prop: (keyof AppState)[]): Promise<AppState>;
    <T>(prop: (appState: AppState) => T, callback: (value: T, appState: AppState) => void, opts?: {
        once: boolean;
    }): UnsubscribeCallback;
    <T>(prop: (appState: AppState) => T): Promise<T>;
    (opts: {
        predicate: (appState: AppState) => boolean;
        callback: (appState: AppState) => void;
        once?: boolean;
    }): UnsubscribeCallback;
    (opts: {
        predicate: (appState: AppState) => boolean;
    }): Promise<AppState>;
    (selector: StateChangeSelector, callback: (value: any, appState: AppState) => void): any;
};
export declare class AppStateObserver {
    private readonly getState;
    private listeners;
    constructor(getState: () => AppState);
    private isStateChangePredicateOptions;
    private subscribe;
    private normalize;
    onStateChange: OnStateChange;
    flush(prevState: AppState): void;
    clear(): void;
}
export {};
