import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie/cjs/types";
import { CookieType, isCookieAllowed, isValidCookieTypeArray, registerCookie } from "../../lib/cookies/utils";
import { useCallback, useMemo } from "react";

export const COOKIE_PREFERENCES_COOKIE = registerCookie({
  name: "cookie_preferences",
  type: "necessary",
  description: "Stores the users cookie preferences",
});

// TODO maybe refactor
export function useCheckCookieConsent(type: CookieType) {
  const [cookies] = useCookies([COOKIE_PREFERENCES_COOKIE]);
  const cookiePreferences: CookieType[] = useMemo(
    () =>
      isValidCookieTypeArray(cookies[COOKIE_PREFERENCES_COOKIE]) ? cookies[COOKIE_PREFERENCES_COOKIE] : ["necessary"],
    [cookies]
  );

  return cookiePreferences.includes(type);
}

export function useCookiesWithConsent(dependencies?: string[]): [
  {
    [name: string]: any;
  },
  (name: string, value: any, options?: CookieSetOptions) => void,
  (name: string, options?: CookieSetOptions) => void
] {
  const fullDependencies = dependencies ? [...dependencies, COOKIE_PREFERENCES_COOKIE] : undefined;
  const [cookies, setCookieBase, removeCookieBase] = useCookies(fullDependencies);

  const cookiePreferencesCookie = cookies[COOKIE_PREFERENCES_COOKIE];
  const cookiePreferences: CookieType[] = useMemo(
    () => (isValidCookieTypeArray(cookiePreferencesCookie) ? cookiePreferencesCookie : ["necessary"]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(cookiePreferencesCookie)]
  );

  const setCookie = useCallback(
    (name: string, value: string, options?: CookieSetOptions) => {
      if (!isCookieAllowed(name, cookiePreferences)) {
        // eslint-disable-next-line no-console
        console.warn(`Consent has not been granted for cookie "${name}" to be set`);
        return;
      }

      setCookieBase(name, value, options);
    },
    [cookiePreferences, setCookieBase]
  );

  return [cookies, setCookie, removeCookieBase];
}
