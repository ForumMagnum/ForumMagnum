import {
  signSupervisorToken,
  validateSupervisorToken,
  extractBearer,
} from "../server/research/sandbox/supervisor/auth";

describe("supervisor auth", () => {
  const secret = "test-secret-abcdef";
  const sandboxId = "sbx_test_001";

  it("round-trips a valid token", () => {
    const expiresAt = Date.now() + 60_000;
    const token = signSupervisorToken({ sandboxId, expiresAt }, secret);
    const result = validateSupervisorToken(token, secret);
    (result.ok as any).should.be.equal(true);
    if (result.ok) {
      (result.payload.sandboxId as any).should.be.equal(sandboxId);
      (result.payload.expiresAt as any).should.be.equal(expiresAt);
    }
  });

  it("rejects expired tokens", () => {
    const token = signSupervisorToken({ sandboxId, expiresAt: Date.now() - 1 }, secret);
    const result = validateSupervisorToken(token, secret);
    (result.ok as any).should.be.equal(false);
    if (!result.ok) (result.reason as any).should.be.equal("expired");
  });

  it("rejects bad signatures", () => {
    const token = signSupervisorToken(
      { sandboxId, expiresAt: Date.now() + 60_000 },
      secret,
    );
    const tampered = token.slice(0, -2) + "AA";
    const result = validateSupervisorToken(tampered, secret);
    (result.ok as any).should.be.equal(false);
  });

  it("rejects tokens signed with the wrong secret", () => {
    const token = signSupervisorToken(
      { sandboxId, expiresAt: Date.now() + 60_000 },
      "other-secret",
    );
    const result = validateSupervisorToken(token, secret);
    (result.ok as any).should.be.equal(false);
    if (!result.ok) (result.reason as any).should.be.equal("bad signature");
  });

  it("rejects malformed tokens", () => {
    const result = validateSupervisorToken("not-a-token", secret);
    (result.ok as any).should.be.equal(false);
  });

  it("rejects missing tokens", () => {
    const result = validateSupervisorToken(null, secret);
    (result.ok as any).should.be.equal(false);
    if (!result.ok) (result.reason as any).should.be.equal("missing token");
  });

  it("extracts bearer from Authorization header", () => {
    const token = "abc.def";
    const got = extractBearer({ headers: { authorization: `Bearer ${token}` } });
    (got as any).should.be.equal(token);
  });

  it("extracts bearer from ?token= query as a fallback", () => {
    const token = "abc.def";
    const got = extractBearer({
      headers: {},
      url: `/sse/cnv_1?token=${encodeURIComponent(token)}`,
    });
    (got as any).should.be.equal(token);
  });

  it("returns null when no token is present", () => {
    const got = extractBearer({ headers: {} });
    (got === null).should.be.equal(true);
  });
});
