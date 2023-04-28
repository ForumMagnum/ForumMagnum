import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie/cjs/types";
import { COOKIE_PREFERENCES_COOKIE, CookieType, isCookieAllowed, isValidCookieTypeArray } from "../../lib/cookies/utils";
import { useCallback } from "react";
import { cookiePreferencesChangedCallbacks } from "../../lib/cookies/callbacks";

export function useCookiePreferences(): {
  cookiePreferences: CookieType[];
  updateCookiePreferences: (newPreferences: CookieType[]) => void;
  explicitConsentGiven: boolean;
} {
  const [cookies, setCookie] = useCookies([COOKIE_PREFERENCES_COOKIE]);
  const preferencesValue = cookies[COOKIE_PREFERENCES_COOKIE];
  const explicitConsentGiven = isValidCookieTypeArray(preferencesValue)

  // TODO this should only be ["necessary"] in the UK + EU
  const fallbackPreferences = ["necessary"] as CookieType[]
  const cookiePreferences = explicitConsentGiven ? preferencesValue : fallbackPreferences
  
  const updateCookiePreferences = useCallback(
    (newPreferences: CookieType[]) => {
      setCookie(COOKIE_PREFERENCES_COOKIE, newPreferences, { path: "/" });
      void cookiePreferencesChangedCallbacks.runCallbacks({iterator: newPreferences, properties: []});
    },
    [setCookie]
  );
  return { cookiePreferences, updateCookiePreferences, explicitConsentGiven };
}

export function useCookiesWithConsent(dependencies?: string[]): [
  {
    [name: string]: any;
  },
  (name: string, value: any, options?: CookieSetOptions) => void,
  (name: string, options?: CookieSetOptions) => void
] {
  const { cookiePreferences } = useCookiePreferences();
  
  const [cookies, setCookieBase, removeCookieBase] = useCookies(dependencies);

  const setCookie = useCallback(
    (name: string, value: string, options?: CookieSetOptions) => {
      if (!isCookieAllowed(name, cookiePreferences)) {
        // eslint-disable-next-line no-console
        console.warn(`Consent has not been granted for cookie "${name}" to be set`);
        return;
      }

      setCookieBase(name, value, options);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(cookiePreferences), setCookieBase]
  );

  return [cookies, setCookie, removeCookieBase];
}
