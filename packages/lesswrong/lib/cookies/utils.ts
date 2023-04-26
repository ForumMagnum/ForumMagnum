import { TupleSet, UnionOf } from "../utils/typeGuardUtils";

const CookieTypes = new TupleSet(["necessary", "functional", "analytics"] as const)
export type CookieType = UnionOf<typeof CookieTypes>;

export type CookieSignature = {
  name: string;
  type: CookieType;
  /** User readable description of what the cookie does (shown in cookie policy) */
  description: string;
  thirdPartyName?: string;
  /** String description of the longest possible expiry date. Can be e.g. "12 months" or "Session" */
  maxExpires: string;
  matches: (name: string) => boolean;
}
// maxExpires and matches are filled in by registerCookie if not provided
export type CookieSignatureMinimum = Omit<CookieSignature, 'maxExpires' | 'matches'> & {
  matches?: (name: string) => boolean;
  maxExpires?: string;
}

export const CookiesTable: Record<string, CookieSignature> = {};

export const isValidCookieTypeArray = (types?: string[] | null): types is CookieType[] => {
  if (!types) return false;
  return types.every(type => CookieTypes.has(type));
}

export function isCookieAllowed(name: string, cookieTypesAllowed: CookieType[]): boolean {
  const cookie = CookiesTable[name];
  if (!cookie) {
    throw new Error(`Unknown cookie: ${name}, you must register it with registerCookie`);
  }
  return cookieTypesAllowed.includes(cookie.type);
}

// TODO add forum type setting
export function registerCookie(cookie: CookieSignatureMinimum): string {
  if (cookie.name in CookiesTable && CookiesTable[cookie.name] !== cookie) {
    throw new Error(`Two cookies with the same name: ${cookie.name}`);
  }

  CookiesTable[cookie.name] = {
    maxExpires: '24 months',
    matches: (name) => name === cookie.name,
    ...cookie
  };
  return cookie.name
}
