import { atom, createStore, type PrimitiveAtom, type WritableAtom } from "jotai";
import { createIsolation } from "jotai-scope";
export { atom, PrimitiveAtom, WritableAtom };
export declare const useAtom: typeof import("jotai").useAtom, useSetAtom: typeof import("jotai").useSetAtom, useAtomValue: typeof import("jotai").useAtomValue, useStore: (options?: {
    store?: {
        get: <Value>(atom: import("jotai").Atom<Value>) => Value;
        set: <Value_1, Args extends unknown[], Result>(atom: WritableAtom<Value_1, Args, Result>, ...args: Args) => Result;
        sub: (atom: import("jotai").Atom<unknown>, listener: () => void) => () => void;
    } | ({
        get: <Value>(atom: import("jotai").Atom<Value>) => Value;
        set: <Value_1, Args extends unknown[], Result>(atom: WritableAtom<Value_1, Args, Result>, ...args: Args) => Result;
        sub: (atom: import("jotai").Atom<unknown>, listener: () => void) => () => void;
    } & {
        dev4_get_internal_weak_map: () => WeakMap<import("jotai").Atom<unknown>, {
            readonly d: Map<import("jotai").Atom<unknown>, number>;
            readonly p: Set<import("jotai").Atom<unknown>>;
            n: number;
            m?: {
                readonly l: Set<() => void>;
                readonly d: Set<import("jotai").Atom<unknown>>;
                readonly t: Set<import("jotai").Atom<unknown>>;
                u?: () => void;
            };
            v?: unknown;
            e?: unknown;
        }>;
        dev4_get_mounted_atoms: () => Set<import("jotai").Atom<unknown>>;
        dev4_restore_atoms: (values: Iterable<readonly [import("jotai").Atom<unknown>, unknown]>) => void;
    });
} | undefined) => {
    get: <Value>(atom: import("jotai").Atom<Value>) => Value;
    set: <Value_1, Args extends unknown[], Result>(atom: WritableAtom<Value_1, Args, Result>, ...args: Args) => Result;
    sub: (atom: import("jotai").Atom<unknown>, listener: () => void) => () => void;
} | ({
    get: <Value>(atom: import("jotai").Atom<Value>) => Value;
    set: <Value_1, Args extends unknown[], Result>(atom: WritableAtom<Value_1, Args, Result>, ...args: Args) => Result;
    sub: (atom: import("jotai").Atom<unknown>, listener: () => void) => () => void;
} & {
    dev4_get_internal_weak_map: () => WeakMap<import("jotai").Atom<unknown>, {
        readonly d: Map<import("jotai").Atom<unknown>, number>;
        readonly p: Set<import("jotai").Atom<unknown>>;
        n: number;
        m?: {
            readonly l: Set<() => void>;
            readonly d: Set<import("jotai").Atom<unknown>>;
            readonly t: Set<import("jotai").Atom<unknown>>;
            u?: () => void;
        };
        v?: unknown;
        e?: unknown;
    }>;
    dev4_get_mounted_atoms: () => Set<import("jotai").Atom<unknown>>;
    dev4_restore_atoms: (values: Iterable<readonly [import("jotai").Atom<unknown>, unknown]>) => void;
});
export declare const EditorJotaiProvider: ReturnType<typeof createIsolation>["Provider"];
export declare const editorJotaiStore: ReturnType<typeof createStore>;
