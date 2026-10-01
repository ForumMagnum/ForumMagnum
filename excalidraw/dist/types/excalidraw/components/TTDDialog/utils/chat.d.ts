import type { LLMMessage, TChat } from "../types";
export declare const updateAssistantContent: (chatHistory: TChat.ChatHistory, payload: Partial<TChat.ChatMessage>) => TChat.ChatHistory;
export declare const getLastAssistantMessage: (chatHistory: TChat.ChatHistory) => TChat.ChatMessage;
export declare const addMessages: (chatHistory: TChat.ChatHistory, messages: Array<Omit<TChat.ChatMessage, "id" | "timestamp">>) => {
    messages: TChat.ChatMessage[];
    id: string;
    currentPrompt: string;
};
export declare const removeLastAssistantMessage: (chatHistory: TChat.ChatHistory) => TChat.ChatHistory;
export declare const getMessagesForLLM: (chatHistory: TChat.ChatHistory) => LLMMessage[];
