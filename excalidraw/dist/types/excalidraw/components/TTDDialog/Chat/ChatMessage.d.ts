import React from "react";
import type { TChat, TTTDDialog } from "../types";
export declare const ChatMessage: React.FC<{
    message: TChat.ChatMessage;
    onMermaidTabClick?: (message: TChat.ChatMessage) => void;
    onAiRepairClick?: (message: TChat.ChatMessage) => void;
    onDeleteMessage?: (messageId: string) => void;
    onInsertMessage?: (message: TChat.ChatMessage) => void;
    onRetry?: (message: TChat.ChatMessage) => void;
    rateLimitRemaining?: number;
    isLastMessage?: boolean;
    renderWarning?: TTTDDialog.renderWarning;
    allowFixingParseError?: boolean;
}>;
