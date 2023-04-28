import { Cookies } from "react-cookie";
import { TupleSet, UnionOf } from "../utils/typeGuardUtils";
import { getExplicitConsentRequiredAsync } from "../../components/common/CookieBanner/geolocation";

export const CookiesTable: Record<string, CookieSignature> = {};

const CookieTypes = new TupleSet(["necessary", "functional", "analytics"] as const)
export type CookieType = UnionOf<typeof CookieTypes>;

export const COOKIE_PREFERENCES_COOKIE = registerCookie({
  name: "cookie_preferences", // Must match variable in Google Tag Manager
  type: "necessary",
  description: "Stores the current cookie preferences (set by the user, or automatically if outside a country subject to GDPR)",
});

export const COOKIE_CONSENT_TIMESTAMP_COOKIE = registerCookie({
  name: "cookie_consent_timestamp",
  type: "necessary",
  description: "Stores the time at which the user set their cookie preferences (once this is set the cookie preferences will never be changed automatically)",
});

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

export const isValidCookieTypeArray = (types?: string[] | null): types is CookieType[] => {
  if (!types) return false;
  return types.every(type => CookieTypes.has(type));
}

export function isCookieAllowed(name: string, cookieTypesAllowed: CookieType[]): boolean {
  const cookie = CookiesTable[name];
  if (cookie) {
    return cookieTypesAllowed.includes(cookie.type);
  }

  // call the `matches` function of all cookies to see if it matches
  for (const cookieName in CookiesTable) {
    if (CookiesTable[cookieName].matches(name)) {
      return cookieTypesAllowed.includes(CookiesTable[cookieName].type);
    }
  }
  throw new Error(`Unknown cookie: ${name}, you must register it with registerCookie`);
}

/**
 * Non-hook version of useCookiePreferences for use outside of React. Returns the list of
 * allowed cookie types and whether the user has given explicit consent (if they are outside
 * the EU, this will always be true)
 */
export async function getCookiePreferences(): Promise<{
  cookiePreferences: CookieType[];
  explicitConsentGiven: boolean;
}> {
  const cookies = new Cookies();
  const preferencesValue = cookies.get(COOKIE_PREFERENCES_COOKIE);
  const consentTimestamp = cookies.get(COOKIE_CONSENT_TIMESTAMP_COOKIE);
  const explicitConsentGiven = !!consentTimestamp && isValidCookieTypeArray(preferencesValue);

  const explicitConsentRequired = await getExplicitConsentRequiredAsync();
  const fallbackPreferences: CookieType[] = explicitConsentRequired
    ? ["necessary"]
    : ["necessary", "functional", "analytics"];
  const cookiePreferences = explicitConsentGiven
    ? preferencesValue
    : fallbackPreferences;

  return { cookiePreferences, explicitConsentGiven };
}

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
