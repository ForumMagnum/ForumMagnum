import type { SavedChat, SavedChats, TTDPersistenceAdapter } from "./types";
interface UseTTDChatStorageProps {
    persistenceAdapter: TTDPersistenceAdapter;
}
interface UseTTDChatStorageReturn {
    savedChats: SavedChats;
    saveCurrentChat: () => Promise<void>;
    deleteChat: (chatId: string) => Promise<SavedChats>;
    restoreChat: (chat: SavedChat) => SavedChat;
    createNewChatId: () => Promise<string>;
}
export declare const savedChatsAtom: import("jotai").PrimitiveAtom<SavedChats> & {
    init: SavedChats;
};
export declare const isLoadingChatsAtom: import("jotai").PrimitiveAtom<boolean> & {
    init: boolean;
};
export declare const chatsLoadedAtom: import("jotai").PrimitiveAtom<boolean> & {
    init: boolean;
};
export declare const useTTDChatStorage: ({ persistenceAdapter, }: UseTTDChatStorageProps) => UseTTDChatStorageReturn;
export {};
