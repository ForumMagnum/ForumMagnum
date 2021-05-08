import { createHash } from 'crypto'

export function hashLoginToken(loginToken: string) {
  const hash = createHash('sha256');
  hash.update(loginToken);
  return hash.digest('base64');
};

export function tokenExpiration(when: Date|string) {
  const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;
  const tokenLifetimeMs = LOGIN_UNEXPIRING_TOKEN_DAYS * 24 * 60 * 60 * 1000
  // We pass when through the Date constructor for backwards compatibility;
  // `when` used to be a number.
  return new Date((new Date(when)).getTime() + tokenLifetimeMs);
}

export function userIsBanned(user: DbUser) {
  if (user.banned && new Date(user.banned) > new Date())
    return true;
  return false;
}
