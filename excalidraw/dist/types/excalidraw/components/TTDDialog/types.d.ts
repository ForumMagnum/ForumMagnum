import type { RequestError } from "../../errors";
import type { NonDeletedExcalidrawElement } from "../../../element/src/types";
import type { MermaidConfig } from "@excalidraw/mermaid-to-excalidraw";
import type { MermaidToExcalidrawResult } from "@excalidraw/mermaid-to-excalidraw/dist/interfaces";
import type { BinaryFiles } from "../../types";
export type LLMMessage = {
    role: "user" | "assistant";
    content: string;
};
export type MermaidData = {
    elements: readonly NonDeletedExcalidrawElement[];
    files: BinaryFiles | null;
};
export interface RateLimits {
    rateLimit: number;
    rateLimitRemaining: number;
}
export declare namespace TChat {
    type ChatMessage = {
        id: string;
        timestamp: Date;
        isGenerating?: boolean;
        error?: string;
        errorDetails?: string;
        errorType?: "parse" | "network" | "other";
        lastAttemptAt?: number;
        type: "user" | "assistant" | "warning";
        warningType?: /* daily rate limit */ "messageLimitExceeded" | /* general 429 */ "rateLimitExceeded";
        content?: string;
    };
    type ChatHistory = {
        id: string;
        messages: ChatMessage[];
        currentPrompt: string;
    };
}
export interface SavedChat {
    id: string;
    title: string;
    messages: TChat.ChatMessage[];
    currentPrompt: string;
    timestamp: number;
}
export type SavedChats = SavedChat[];
/**
 * Interface for TTD chat persistence. Preferably should be stable
 * (e.g. static class/singleton)
 */
export interface TTDPersistenceAdapter {
    /**
     * Load saved chats from storage.
     */
    loadChats(): Promise<SavedChats>;
    /**
     * Save chats to storage.
     */
    saveChats(chats: SavedChats): Promise<void>;
}
export interface MermaidToExcalidrawLibProps {
    loaded: boolean;
    api: Promise<{
        parseMermaidToExcalidraw: (definition: string, config?: MermaidConfig) => Promise<MermaidToExcalidrawResult>;
    }>;
}
export declare namespace TTTDDialog {
    type OnGenerate = (opts: {
        prompt: string;
        isRepairFlow?: boolean;
    }) => Promise<void>;
    type OnTextSubmitProps = {
        messages: LLMMessage[];
        onChunk?: (chunk: string) => void;
        onStreamCreated?: () => void;
        signal?: AbortSignal;
    };
    type OnTextSubmitRetValue = {
        rateLimit?: number | null;
        rateLimitRemaining?: number | null;
    } & ({
        generatedResponse: string;
        error: null;
    } | {
        error: RequestError;
        generatedResponse?: null;
    });
    type onTextSubmit = (props: OnTextSubmitProps) => Promise<OnTextSubmitRetValue>;
    /**
     * return undefined to use default rendering
     */
    type renderWarning = (chatMessage: TChat.ChatMessage) => React.ReactNode | undefined;
    type renderWelcomeScreen = (props: {
        /** null if not rate limit data currently available */
        rateLimits: RateLimits | null;
    }) => React.ReactNode | undefined;
}
