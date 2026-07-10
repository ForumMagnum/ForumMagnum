import {
  signSupervisorToken,
  validateSupervisorToken,
  extractBearer,
  supervisorTokenCanAccessConversation,
} from "../server/research/sandbox/supervisor/auth";

describe("supervisor auth", () => {
  const secret = "test-secret-abcdef";
  const sandboxId = "sbx_test_001";

  it("round-trips a valid token", () => {
    const expiresAt = Date.now() + 60_000;
    const token = signSupervisorToken({ sandboxId, expiresAt }, secret);
    const result = validateSupervisorToken(token, secret);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.reason);
    }
    expect(result.payload.sandboxId).toBe(sandboxId);
    expect(result.payload.expiresAt).toBe(expiresAt);
  });

  it("rejects expired tokens", () => {
    const token = signSupervisorToken({ sandboxId, expiresAt: Date.now() - 1 }, secret);
    const result = validateSupervisorToken(token, secret);
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected an expired-token failure");
    }
    expect(result.reason).toBe("expired");
  });

  it("rejects bad signatures", () => {
    const token = signSupervisorToken(
      { sandboxId, expiresAt: Date.now() + 60_000 },
      secret,
    );
    const tampered = token.slice(0, -2) + "AA";
    const result = validateSupervisorToken(tampered, secret);
    expect(result.ok).toBe(false);
  });

  it("rejects tokens signed with the wrong secret", () => {
    const token = signSupervisorToken(
      { sandboxId, expiresAt: Date.now() + 60_000 },
      "other-secret",
    );
    const result = validateSupervisorToken(token, secret);
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected a bad-signature failure");
    }
    expect(result.reason).toBe("bad signature");
  });

  it("rejects malformed tokens", () => {
    const result = validateSupervisorToken("not-a-token", secret);
    expect(result.ok).toBe(false);
  });

  it("rejects missing tokens", () => {
    const result = validateSupervisorToken(null, secret);
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected a missing-token failure");
    }
    expect(result.reason).toBe("missing token");
  });

  it("only allows access to the conversation named by the token scope", () => {
    const token = signSupervisorToken(
      { sandboxId, expiresAt: Date.now() + 60_000, scope: "cnv_allowed" },
      secret,
    );
    const result = validateSupervisorToken(token, secret);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.reason);
    }
    expect(supervisorTokenCanAccessConversation(result.payload, "cnv_allowed")).toBe(true);
    expect(supervisorTokenCanAccessConversation(result.payload, "cnv_other")).toBe(false);
  });

  it("does not treat an unscoped sandbox token as conversation-scoped", () => {
    const token = signSupervisorToken({ sandboxId, expiresAt: Date.now() + 60_000 }, secret);
    const result = validateSupervisorToken(token, secret);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.reason);
    }
    expect(supervisorTokenCanAccessConversation(result.payload, "cnv_any")).toBe(false);
  });

  it("extracts bearer from Authorization header", () => {
    const token = "abc.def";
    const got = extractBearer({ headers: { authorization: `Bearer ${token}` } });
    expect(got).toBe(token);
  });

  it("extracts bearer from ?token= query as a fallback", () => {
    const token = "abc.def";
    const got = extractBearer({
      headers: {},
      url: `/sse/cnv_1?token=${encodeURIComponent(token)}`,
    });
    expect(got).toBe(token);
  });

  it("returns null when no token is present", () => {
    const got = extractBearer({ headers: {} });
    expect(got).toBeNull();
  });
});
