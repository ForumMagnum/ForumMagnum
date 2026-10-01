import type { RateLimits, TChat } from "./types";
export declare const rateLimitsAtom: import("jotai").PrimitiveAtom<RateLimits | null> & {
    init: RateLimits | null;
};
export declare const showPreviewAtom: import("jotai").PrimitiveAtom<boolean> & {
    init: boolean;
};
export declare const errorAtom: import("jotai").PrimitiveAtom<Error | null> & {
    init: Error | null;
};
export declare const chatHistoryAtom: import("jotai").PrimitiveAtom<TChat.ChatHistory> & {
    init: TChat.ChatHistory;
};
