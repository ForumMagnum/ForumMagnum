import type { SavedChat } from "../types";
interface ChatHistoryMenuProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onNewChat: () => void;
    onRestoreChat: (chat: SavedChat) => void;
    onDeleteChat: (chatId: string, event: React.MouseEvent) => void;
    savedChats: SavedChat[];
    activeSessionId: string;
    disabled?: boolean;
    isNewChatBtnVisible?: boolean;
}
export declare const ChatHistoryMenu: ({ isOpen, onToggle, onClose, onNewChat, onRestoreChat, onDeleteChat, isNewChatBtnVisible, savedChats, activeSessionId, disabled, }: ChatHistoryMenuProps) => import("react/jsx-runtime").JSX.Element;
export {};
