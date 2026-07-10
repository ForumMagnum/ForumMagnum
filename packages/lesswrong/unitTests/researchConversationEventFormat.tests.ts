import {
  getAgentTranscriptTurns,
  isTurnInFlight,
  isVisibleConversationEvent,
} from "../components/research/conversationEventFormat";

describe("research conversation event formatting", () => {
  it("filters only user-facing inline agent-block event kinds", () => {
    expect(isVisibleConversationEvent({ kind: "assistant" })).toBe(true);
    expect(isVisibleConversationEvent({ kind: "tool_result" })).toBe(true);
    expect(isVisibleConversationEvent({ kind: "system" })).toBe(false);
    expect(isVisibleConversationEvent({ kind: "unknown" })).toBe(false);
  });

  describe("isTurnInFlight", () => {
    const now = Date.parse("2026-06-09T12:00:00Z");
    const recent = new Date(now - 10_000).toISOString();
    const stale = new Date(now - (60 * 60 * 1000)).toISOString();

    const user = { kind: "user", payload: {}, createdAt: recent };
    const assistant = { kind: "assistant", payload: {} };
    const result = { kind: "result", payload: {} };
    const flushResult = { kind: "result", payload: { type: "result", subtype: "interrupted" } };
    const errorEvent = { kind: "error", payload: {} };
    const init = { kind: "system", payload: { type: "system", subtype: "init" } };
    const taskNotification = { kind: "system", payload: { type: "system", subtype: "task_notification" } };

    it("is false for an empty transcript", () => {
      expect(isTurnInFlight([], now)).toBe(false);
    });

    it("is true for a user turn with no result yet", () => {
      expect(isTurnInFlight([user, assistant], now)).toBe(true);
    });

    it("is false once the turn has its result", () => {
      expect(isTurnInFlight([user, init, assistant, result], now)).toBe(false);
    });

    it("is true again when a later turn opens", () => {
      expect(isTurnInFlight([user, init, result, user], now)).toBe(true);
    });

    it("is true during a background-task re-invocation (no user event)", () => {
      expect(isTurnInFlight([user, init, result, taskNotification, init, assistant], now)).toBe(true);
      expect(isTurnInFlight([user, init, result, taskNotification, init, assistant, result], now)).toBe(false);
    });

    it("does not drift when results outnumber user turns", () => {
      // A re-invocation's extra result must not mask the next real turn.
      expect(isTurnInFlight([user, init, result, init, assistant, result, user], now)).toBe(true);
    });

    it("treats non-init system events between turns as idle", () => {
      expect(isTurnInFlight([user, init, result, taskNotification], now)).toBe(false);
    });

    it("keeps a recent queued user turn in flight past the running turn's result", () => {
      // Message B dispatched mid-turn-A is persisted before A's result; the
      // turn is still queued until B's own init arrives.
      expect(isTurnInFlight([user, init, assistant, user, assistant, result], now)).toBe(true);
      expect(isTurnInFlight([user, init, assistant, user, assistant, result, init], now)).toBe(true);
    });

    it("ages out an unstarted user turn so legacy transcripts can't wedge", () => {
      // Old per-turn-supervisor conversations don't reliably have an init
      // after every user event; a stale unstarted user turn reads idle.
      const staleUser = { kind: "user", payload: {}, createdAt: stale };
      expect(isTurnInFlight([staleUser, assistant, result], now)).toBe(false);
    });

    it("treats a synthetic interrupted result as flushing queued user turns", () => {
      expect(isTurnInFlight([user, flushResult], now)).toBe(false);
    });

    it("does not count error events as turn activity", () => {
      // Matches the supervisor: an out-of-turn error line must not wedge the
      // conversation as busy forever.
      expect(isTurnInFlight([user, init, result, errorEvent], now)).toBe(false);
    });
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
