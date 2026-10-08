import {
  decryptSecretWithKey,
  encryptSecretWithKey,
  isEncryptedSecret,
} from "../server/research/userSecretsCrypto";

describe("user secret encryption", () => {
  const secret = "test-secret-encryption-key";

  it("round-trips an encrypted value without retaining plaintext", () => {
    const value = "sk-ant-oat01-example-token";
    const encrypted = encryptSecretWithKey(value, secret);

    expect(isEncryptedSecret(encrypted)).toBe(true);
    expect(encrypted).not.toContain(value);
    expect(decryptSecretWithKey(encrypted, secret)).toBe(value);
  });

  it("passes through legacy plaintext values", () => {
    const value = "legacy-plaintext-value";

    expect(isEncryptedSecret(value)).toBe(false);
    expect(decryptSecretWithKey(value, secret)).toBe(value);
  });

  it("rejects a tampered ciphertext", () => {
    const encrypted = encryptSecretWithKey("value", secret);
    const parts = encrypted.split(".");
    const ciphertext = parts[2];
    parts[2] = `${ciphertext[0] === "A" ? "B" : "A"}${ciphertext.slice(1)}`;

    expect(() => decryptSecretWithKey(parts.join("."), secret)).toThrow();
  });
});
