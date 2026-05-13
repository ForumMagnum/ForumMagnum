import {
  getAgentTranscriptTurns,
  isVisibleConversationEvent,
} from "../components/research/conversationEventFormat";

describe("research conversation event formatting", () => {
  it("filters only user-facing inline agent-block event kinds", () => {
    expect(isVisibleConversationEvent({ kind: "assistant" })).toBe(true);
    expect(isVisibleConversationEvent({ kind: "tool_result" })).toBe(true);
    expect(isVisibleConversationEvent({ kind: "system" })).toBe(false);
    expect(isVisibleConversationEvent({ kind: "unknown" })).toBe(false);
  });

  describe("getAgentTranscriptTurns", () => {
    const events = [
      {
        seq: 0,
        kind: "user",
        payload: { type: "user", text: "Compare doc A and doc B." },
      },
      {
        seq: 1,
        kind: "assistant",
        payload: {
          message: {
            content: [
              { type: "thinking", thinking: "Plan: fetch both then diff." },
              { type: "text", text: "Sure, fetching both now." },
              { type: "tool_use", name: "fetch-doc", input: { id: "doc_a" } },
            ],
          },
        },
      },
      {
        seq: 2,
        kind: "tool_result",
        payload: {
          message: {
            content: [
              { type: "tool_result", content: [{ type: "text", text: "<doc A body>" }] },
            ],
          },
        },
      },
      {
        seq: 3,
        kind: "system",
        payload: { type: "system", info: "init" },
      },
    ];

    it("default: drops thinking and tool_result, keeps tool_use names without args", () => {
      const turns = getAgentTranscriptTurns(events);
      expect(turns).toEqual([
        { seq: 0, role: "user", text: "Compare doc A and doc B." },
        { seq: 1, role: "assistant", text: "Sure, fetching both now.\nfetch-doc" },
      ]);
    });

    it("withThinking: surfaces thinking chunks", () => {
      const turns = getAgentTranscriptTurns(events, { withThinking: true });
      expect(turns).toEqual([
        { seq: 0, role: "user", text: "Compare doc A and doc B." },
        {
          seq: 1,
          role: "assistant",
          text: "Plan: fetch both then diff.\nSure, fetching both now.\nfetch-doc",
        },
      ]);
    });

    it("withToolPayloads: includes tool args and tool results", () => {
      const turns = getAgentTranscriptTurns(events, { withToolPayloads: true });
      expect(turns).toHaveLength(3);
      expect(turns[1]).toEqual({
        seq: 1,
        role: "assistant",
        text: "Sure, fetching both now.\nfetch-doc({\n  \"id\": \"doc_a\"\n})",
      });
      expect(turns[2]).toEqual({
        seq: 2,
        role: "tool_result",
        text: "<doc A body>",
      });
    });
  });
});
