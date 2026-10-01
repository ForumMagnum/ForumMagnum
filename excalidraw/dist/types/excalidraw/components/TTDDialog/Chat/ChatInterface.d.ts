import type { TChat, TTTDDialog } from "../types";
export declare const ChatInterface: ({ chatId, messages, currentPrompt, onPromptChange, onGenerate, isGenerating, rateLimits, onAbort, onMermaidTabClick, onAiRepairClick, onDeleteMessage, onInsertMessage, onRetry, renderWelcomeScreen, renderWarning, }: {
    chatId: string;
    messages: TChat.ChatMessage[];
    currentPrompt: string;
    onPromptChange: (prompt: string) => void;
    onGenerate: TTTDDialog.OnGenerate;
    isGenerating: boolean;
    rateLimits?: {
        rateLimit: number;
        rateLimitRemaining: number;
    } | null;
    onViewAsMermaid?: () => void;
    generatedResponse?: string | null;
    onAbort?: () => void;
    onMermaidTabClick?: (message: TChat.ChatMessage) => void;
    onAiRepairClick?: (message: TChat.ChatMessage) => void;
    onDeleteMessage?: (messageId: string) => void;
    onInsertMessage?: (message: TChat.ChatMessage) => void;
    onRetry?: (message: TChat.ChatMessage) => void;
    renderWelcomeScreen?: TTTDDialog.renderWelcomeScreen;
    renderWarning?: TTTDDialog.renderWarning;
}) => import("react/jsx-runtime").JSX.Element;
