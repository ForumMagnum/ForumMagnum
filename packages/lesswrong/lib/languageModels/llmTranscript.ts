declare global {
  type LlmTranscriptEntry =
    | { type: "reasoning", text: string }
    | { type: "text", text: string }
    | { type: "tool-call", toolCallId: string, toolName: string, input: unknown }
    | { type: "tool-result", toolCallId: string, toolName: string, output: unknown }
    | { type: "tool-error", toolCallId: string, toolName: string, error: string }
    | { type: "source", url: string, title: string | null };
}

export {};
