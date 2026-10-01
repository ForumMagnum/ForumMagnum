import type { SavedChat, TTDPersistenceAdapter } from "../types";
interface UseChatManagementProps {
    persistenceAdapter: TTDPersistenceAdapter;
}
export declare const useChatManagement: ({ persistenceAdapter, }: UseChatManagementProps) => {
    isMenuOpen: boolean;
    onRestoreChat: (chat: SavedChat) => void;
    handleDeleteChat: (chatId: string, event: React.MouseEvent) => Promise<void>;
    handleNewChat: () => Promise<void>;
    handleMenuToggle: () => void;
    handleMenuClose: () => void;
};
export {};
