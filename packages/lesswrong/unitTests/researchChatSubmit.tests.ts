import { shouldInterruptBeforeResearchChatSend } from "../components/research/researchChatSubmit";

describe("research chat submit", () => {
  it("does not interrupt before a new chat send", () => {
    expect(shouldInterruptBeforeResearchChatSend({
      conversationId: null,
      streamStatus: "streaming",
      turnInFlight: true,
    })).toBe(false);
  });

  it("does not interrupt an idle existing conversation", () => {
    expect(shouldInterruptBeforeResearchChatSend({
      conversationId: "conversation-id",
      streamStatus: "idle",
      turnInFlight: false,
    })).toBe(false);
  });

  it("interrupts when the transcript has an in-flight turn", () => {
    expect(shouldInterruptBeforeResearchChatSend({
      conversationId: "conversation-id",
      streamStatus: "idle",
      turnInFlight: true,
    })).toBe(true);
  });

  it("interrupts while the live stream is active or reconnecting", () => {
    for (const streamStatus of ["connecting", "streaming", "reconnecting"] as const) {
      expect(shouldInterruptBeforeResearchChatSend({
        conversationId: "conversation-id",
        streamStatus,
        turnInFlight: false,
      })).toBe(true);
    }
  });
});

