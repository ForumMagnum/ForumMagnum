import {
  getConversationEventText,
  isVisibleAgentBlockEvent,
} from "../components/research/conversationEventFormat";

describe("research conversation event formatting", () => {
  it("extracts text from Claude Code assistant message content", () => {
    const text = getConversationEventText({
      kind: "assistant",
      payload: {
        type: "assistant",
        message: {
          content: [
            { type: "text", text: "First paragraph." },
            { type: "text", text: "Second paragraph." },
          ],
        },
      },
    });
    expect(text).toBe("First paragraph.\nSecond paragraph.");
  });

  it("renders tool use parts compactly", () => {
    const text = getConversationEventText({
      kind: "assistant",
      payload: {
        message: {
          content: [
            {
              type: "tool_use",
              name: "fetch-doc",
              input: { id: "doc_1" },
            },
          ],
        },
      },
    });
    expect(text).toBe("fetch-doc({\n  \"id\": \"doc_1\"\n})");
  });

  it("renders tool result text arrays", () => {
    const text = getConversationEventText({
      kind: "assistant",
      payload: {
        message: {
          content: [
            {
              type: "tool_result",
              content: [
                { type: "text", text: "line one" },
                { type: "text", text: "line two" },
              ],
            },
          ],
        },
      },
    });
    expect(text).toBe("line one\nline two");
  });

  it("falls back to JSON for unrecognized payloads", () => {
    const text = getConversationEventText({
      kind: "system",
      payload: { type: "system", code: 42 },
    });
    expect(text).toBe("{\n  \"type\": \"system\",\n  \"code\": 42\n}");
  });

  it("filters only user-facing inline agent-block event kinds", () => {
    expect(isVisibleAgentBlockEvent({ kind: "assistant" })).toBe(true);
    expect(isVisibleAgentBlockEvent({ kind: "tool_result" })).toBe(true);
    expect(isVisibleAgentBlockEvent({ kind: "system" })).toBe(false);
    expect(isVisibleAgentBlockEvent({ kind: "unknown" })).toBe(false);
  });
});
