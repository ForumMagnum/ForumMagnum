import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

/**
 * Symmetric encryption for the Claude Code OAuth token stored in
 * `Users.claudeCodeOAuthTokenEncrypted`.
 *
 * AES-256-GCM with a key derived from a single deployment-wide secret
 * (`RESEARCH_TOKEN_ENCRYPTION_KEY`); each value gets a random IV and is
 * authenticated by the GCM tag. The ciphertext format is stable, so values
 * encrypted by earlier versions stay readable as long as the key is unchanged.
 */

const SECRET_REF_PREFIX = "research-token:v1:";
const AES_GCM_IV_BYTES = 12;

function getEncryptionSecret(): string {
  const secret = process.env.RESEARCH_TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error(
      "RESEARCH_TOKEN_ENCRYPTION_KEY must be configured to encrypt or decrypt research user tokens",
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

/** True if `value` is a ciphertext produced by `encryptSecretWithKey`. */
export function isEncryptedSecret(value: string): boolean {
  return value.startsWith(SECRET_REF_PREFIX);
}

export function encryptSecretWithKey(plaintext: string, secret: string): string {
  const iv = randomBytes(AES_GCM_IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${SECRET_REF_PREFIX}${encodePart(iv)}.${encodePart(tag)}.${encodePart(ciphertext)}`;
}

export function decryptSecretWithKey(stored: string, secret: string): string {
  // A value with no sentinel prefix is legacy plaintext — return it unchanged.
  if (!isEncryptedSecret(stored)) {
    return stored;
  }
  const parts = stored.slice(SECRET_REF_PREFIX.length).split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret format");
  }
  const [encodedIv, encodedTag, encodedCiphertext] = parts;
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), decodePart(encodedIv));
  decipher.setAuthTag(decodePart(encodedTag));
  return Buffer.concat([
    decipher.update(decodePart(encodedCiphertext)),
    decipher.final(),
  ]).toString("utf8");
}

/** Encrypt the Claude Code OAuth token for storage in `Users.claudeCodeOAuthTokenEncrypted`. */
export function encryptUserSecret(plaintext: string): string {
  return encryptSecretWithKey(plaintext, getEncryptionSecret());
}

/** Decrypt a stored Claude Code OAuth token (legacy plaintext passes through). */
export function decryptUserSecret(stored: string): string {
  return decryptSecretWithKey(stored, getEncryptionSecret());
}
