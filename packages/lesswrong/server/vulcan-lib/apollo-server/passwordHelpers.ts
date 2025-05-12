import bcrypt from 'bcrypt';
import { createHash } from 'crypto';

// Meteor hashed its passwords twice, once on the client
// and once again on the server. To preserve backwards compatibility
// with Meteor passwords, we do the same, but do it both on the server-side
function createMeteorClientSideHash(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

export function validatePassword(password: string): {validPassword: true} | {validPassword: false, reason: string} {
  if (password.length < 6) return { validPassword: false, reason: "Your password needs to be at least 6 characters long"}
  return { validPassword: true }
}

export async function createPasswordHash(password: string) {
  const meteorClientSideHash = createMeteorClientSideHash(password);
  return await bcrypt.hash(meteorClientSideHash, 10);
}

export async function comparePasswords(password: string, hash: string) {
  return await bcrypt.compare(createMeteorClientSideHash(password), hash);
}
