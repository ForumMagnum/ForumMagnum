
export type CookieType = "necessary" | "functional" | "analytics";
export const CookieConsentLevel: Record<CookieType, CookieType[]> = {
  necessary: ["necessary"],
  functional: ["necessary", "functional"],
  analytics: ["necessary", "functional", "analytics"],
};

export type CookieSignature = {
  name: string;
  type: CookieType;
  /** User readable description of what the cookie does (shown in cookie banner) */
  description: string;
}

export const CookiesTable: Record<string, CookieSignature> = {};

export function getCookieTypesAllowed(): CookieType[] {
  // TODO implement cookie consent
  return CookieConsentLevel.necessary;
}

export function isCookieAllowed(name: string): boolean {
  const cookie = CookiesTable[name];
  if (!cookie) {
    throw new Error(`Unknown cookie: ${name}, you must register it with registerCookie`);
  }
  return getCookieTypesAllowed().includes(cookie.type);
}

// TODO add forum type setting
export function registerCookie(cookie: CookieSignature): string {
  if (cookie.name in CookiesTable && CookiesTable[cookie.name] !== cookie) {
    throw new Error(`Two cookies with the same name: ${cookie.name}`);
  }

  CookiesTable[cookie.name] = cookie;
  return cookie.name
}
