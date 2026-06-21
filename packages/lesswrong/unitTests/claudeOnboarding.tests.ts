import { getClaudeConfirmMessage } from "../components/posts/ClaudeOnboardingModal";

describe("getClaudeConfirmMessage", () => {
  test("asks Claude to run the confirmation curl and report the result", () => {
    const confirmUrl = "https://www.lesswrong.com/api/agent/confirmClaudeAccess/test-token";
    const message = getClaudeConfirmMessage(confirmUrl);

    expect(message).toContain("Please confirm LessWrong API access for this chat.");
    expect(message).toContain(`curl -X POST ${confirmUrl}`);
    expect(message).toContain("does not edit any posts or share any draft content");
    expect(message).toContain("tell me the response you received");
    expect(message).toContain("www.lesswrong.com");
  });
});
