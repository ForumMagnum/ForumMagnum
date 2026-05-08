import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const TOKEN_REF_PREFIX = "research-token:v1:";
const AES_GCM_IV_BYTES = 12;

function getClaudeCodeTokenEncryptionSecret(): string {
  const secret = process.env.RESEARCH_TOKEN_ENCRYPTION_KEY
    ?? process.env.RESEARCH_SANDBOX_CALLBACK_SECRET;
  if (!secret) {
    throw new Error(
      "RESEARCH_TOKEN_ENCRYPTION_KEY or RESEARCH_SANDBOX_CALLBACK_SECRET must be configured before storing Claude Code tokens",
    );
  }
  return secret;
}

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

function encodePart(part: Buffer): string {
  return part.toString("base64url");
}

function decodePart(part: string): Buffer {
  return Buffer.from(part, "base64url");
}

export function isEncryptedClaudeCodeTokenRef(tokenRef: string): boolean {
  return tokenRef.startsWith(TOKEN_REF_PREFIX);
}

export function encryptClaudeCodeTokenWithSecret(token: string, secret: string): string {
  const iv = randomBytes(AES_GCM_IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${TOKEN_REF_PREFIX}${encodePart(iv)}.${encodePart(tag)}.${encodePart(ciphertext)}`;
}

export function decryptClaudeCodeTokenWithSecret(tokenRef: string, secret: string): string {
  if (!isEncryptedClaudeCodeTokenRef(tokenRef)) {
    return tokenRef;
  }
  const encodedPayload = tokenRef.slice(TOKEN_REF_PREFIX.length);
  const parts = encodedPayload.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted Claude Code token format");
  }
  const [encodedIv, encodedTag, encodedCiphertext] = parts;
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), decodePart(encodedIv));
  decipher.setAuthTag(decodePart(encodedTag));
  return Buffer.concat([
    decipher.update(decodePart(encodedCiphertext)),
    decipher.final(),
  ]).toString("utf8");
}

export function encryptClaudeCodeTokenForStorage(token: string): string {
  return encryptClaudeCodeTokenWithSecret(token, getClaudeCodeTokenEncryptionSecret());
}

export function decryptClaudeCodeTokenRef(tokenRef: string): string {
  if (!isEncryptedClaudeCodeTokenRef(tokenRef)) {
    return tokenRef;
  }
  return decryptClaudeCodeTokenWithSecret(tokenRef, getClaudeCodeTokenEncryptionSecret());
}
