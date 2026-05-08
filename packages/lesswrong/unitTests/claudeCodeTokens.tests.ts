import {
  decryptClaudeCodeTokenWithSecret,
  encryptClaudeCodeTokenWithSecret,
  isEncryptedClaudeCodeTokenRef,
} from "../server/research/claudeCodeTokens";

describe("Claude Code token storage", () => {
  const secret = "test-token-encryption-secret";

  it("encrypts token refs without retaining plaintext", () => {
    const token = "sk-ant-oat01-example-token";
    const encrypted = encryptClaudeCodeTokenWithSecret(token, secret);

    expect(isEncryptedClaudeCodeTokenRef(encrypted)).toBe(true);
    expect(encrypted).not.toContain(token);
    expect(decryptClaudeCodeTokenWithSecret(encrypted, secret)).toBe(token);
  });

  it("keeps legacy plaintext refs readable", () => {
    const token = "legacy-plaintext-token";

    expect(isEncryptedClaudeCodeTokenRef(token)).toBe(false);
    expect(decryptClaudeCodeTokenWithSecret(token, secret)).toBe(token);
  });

  it("rejects tampered encrypted refs", () => {
    const encrypted = encryptClaudeCodeTokenWithSecret("token", secret);
    const parts = encrypted.split(".");
    const ciphertext = parts[2];
    parts[2] = `${ciphertext[0] === "A" ? "B" : "A"}${ciphertext.slice(1)}`;
    const tampered = parts.join(".");

    expect(() => decryptClaudeCodeTokenWithSecret(tampered, secret)).toThrow();
  });
});
