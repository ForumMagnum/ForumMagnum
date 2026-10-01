export declare const useChatAgent: () => {
    addUserMessage: (content: string) => void;
    addAssistantMessage: () => void;
    setAssistantError: (errorMessage: string, errorType?: "parse" | "network" | "other", errorDetails?: Error | unknown) => void;
    chatHistory: import("../types").TChat.ChatHistory;
    setChatHistory: (args_0: import("../types").TChat.ChatHistory | ((prev: import("../types").TChat.ChatHistory) => import("../types").TChat.ChatHistory)) => void;
    setLastRetryAttempt: () => void;
};
