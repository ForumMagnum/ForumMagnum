import { shouldShowAgentActivity } from "../components/research/conversationActivity";

describe("research conversation activity", () => {
  it("shows activity while a turn is in flight", () => {
    expect(shouldShowAgentActivity({ status: "idle", turnInFlight: true })).toBe(true);
  });

  it("shows activity while waiting for the first persisted event", () => {
    expect(shouldShowAgentActivity({ status: "connecting", turnInFlight: false })).toBe(true);
    expect(shouldShowAgentActivity({ status: "streaming", turnInFlight: false })).toBe(true);
  });

  it("shows activity while reconnecting to an active stream", () => {
    expect(shouldShowAgentActivity({ status: "reconnecting", turnInFlight: false })).toBe(true);
  });

  it("does not show activity for inactive statuses", () => {
    expect(shouldShowAgentActivity({ status: "idle", turnInFlight: false })).toBe(false);
    expect(shouldShowAgentActivity({ status: "closed", turnInFlight: false })).toBe(false);
    expect(shouldShowAgentActivity({ status: "error", turnInFlight: false })).toBe(false);
  });
});
