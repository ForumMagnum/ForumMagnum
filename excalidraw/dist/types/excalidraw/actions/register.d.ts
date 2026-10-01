import type { Action } from "./types";
export declare let actions: readonly Action[];
export declare const register: <TData extends any, T extends Action<TData> = Action<TData>>(action: T) => T & {
    keyTest?: unknown extends T["keyTest"] ? never : T["keyTest"];
};
