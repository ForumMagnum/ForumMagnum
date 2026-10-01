import type { AppState } from "../types";
/**
 * Subscribes to specific appState changes. The component re-renders
 * only when the specified prop(s) change — not on every appState update.
 *
 * Works both inside and outside the <Excalidraw> tree, as long as
 * ExcalidrawAPIContext.Provider is an ancestor (automatically provided
 * inside <Excalidraw>, or manually by the host app).
 *
 * Returns the narrowed value depending on prop form:
 *  - `keyof AppState` → `AppState[K]`
 *  - `(keyof AppState)[]` → whole `AppState`
 *  - selector function → selector's return type `T`
 *
 * If excalidrawAPI is not ready yet (host apps), hook is rerendered with latest
 * value once available.
 */
export declare function useAppStateValue<K extends keyof AppState>(prop: K, _internal?: boolean): AppState[K];
export declare function useAppStateValue(props: (keyof AppState)[], _internal?: boolean): AppState;
export declare function useAppStateValue<T>(selector: (appState: AppState) => T, _internal?: boolean): T;
/**
 * Subscribes to specific appState changes without causing component rerenders.
 *
 * The callback is called on every matching change, but also on initial render
 * so you can initialize your state.
 */
export declare function useOnAppStateChange<K extends keyof AppState>(prop: K, callback: (value: AppState[K], appState: AppState) => void): undefined;
export declare function useOnAppStateChange(props: (keyof AppState)[], callback: (props: AppState, appState: AppState) => void): undefined;
export declare function useOnAppStateChange<T>(selector: (appState: AppState) => T, callback: (value: T, appState: AppState) => void): undefined;
