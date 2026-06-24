import { buildArgs } from "../server/research/sandbox/supervisor/claudeRunner";

describe("claudeRunner", () => {
  it("disables AskUserQuestion in headless research sessions", () => {
    const args = buildArgs({
      claudeSessionId: "session-123",
      sessionMode: "new",
      appendSystemPrompt: "context",
    });

    expect(args).toContain("--disallowedTools");
    expect(args).toContain("AskUserQuestion");
    expect(args).toContain("--session-id");
    expect(args).toContain("session-123");
    expect(args).toContain("--append-system-prompt");
    expect(args).toContain("context");
  });
});
