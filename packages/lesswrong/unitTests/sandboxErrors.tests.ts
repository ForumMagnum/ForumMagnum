import {
  EXPIRED_SANDBOX_SAVE_MESSAGE,
  isExpiredSandboxError,
  ResearchSandboxUnavailableError,
} from "../server/research/sandbox/sandboxErrors";

describe("sandboxErrors", () => {
  it("recognizes Vercel SDK 410 messages", () => {
    expect(isExpiredSandboxError(new Error("Status code 410 is not ok"))).toBe(true);
    expect(isExpiredSandboxError("HTTP 410 Gone")).toBe(true);
  });

  it("recognizes structured 410 errors", () => {
    expect(isExpiredSandboxError({ status: 410 })).toBe(true);
    expect(isExpiredSandboxError({ response: { statusCode: 410 } })).toBe(true);
    expect(isExpiredSandboxError({ cause: { status: 410 } })).toBe(true);
  });

  it("does not treat unrelated errors as expired sandboxes", () => {
    expect(isExpiredSandboxError(new Error("Status code 500 is not ok"))).toBe(false);
    expect(isExpiredSandboxError({ status: 404 })).toBe(false);
    expect(isExpiredSandboxError(null)).toBe(false);
  });

  it("uses the actionable save-environment message", () => {
    expect(new ResearchSandboxUnavailableError().message).toBe(EXPIRED_SANDBOX_SAVE_MESSAGE);
  });
});
