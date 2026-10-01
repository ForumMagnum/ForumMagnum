import type { LLMMessage, TTTDDialog } from "../types";
interface StreamingOptions {
    url: string;
    messages: readonly LLMMessage[];
    onChunk?: (chunk: string) => void;
    extractRateLimits?: boolean;
    signal?: AbortSignal;
    onStreamCreated?: () => void;
}
export type StreamChunk = {
    type: "content";
    delta: string;
} | {
    type: "done";
    finishReason: "stop" | "length" | "content_filter" | "tool_calls" | null;
} | {
    type: "error";
    error: {
        message: string;
        status?: number;
    };
};
export declare function parseSSEStream(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string, void, unknown>;
export declare function TTDStreamFetch(options: StreamingOptions): Promise<TTTDDialog.OnTextSubmitRetValue>;
export {};
