import type { EDITOR_LS_KEYS } from "../../common/src/index";
import type { JSONValue } from "../types";
export declare class EditorLocalStorage {
    static has(key: typeof EDITOR_LS_KEYS[keyof typeof EDITOR_LS_KEYS]): boolean;
    static get<T extends JSONValue>(key: typeof EDITOR_LS_KEYS[keyof typeof EDITOR_LS_KEYS]): T | null;
    static set: (key: (typeof EDITOR_LS_KEYS)[keyof typeof EDITOR_LS_KEYS], value: JSONValue) => boolean;
    static delete: (name: (typeof EDITOR_LS_KEYS)[keyof typeof EDITOR_LS_KEYS]) => void;
}
