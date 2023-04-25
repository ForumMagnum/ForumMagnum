import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie/cjs/types";
import { CookieType, isCookieAllowed, isValidCookieTypeArray } from "../../lib/cookies/utils";
import { useCallback, useMemo } from "react";
import { CallbackChainHook } from "../../lib/vulcan-lib";
import { initDatadog } from "../../client/datadogRum";
import { COOKIE_PREFERENCES_COOKIE } from "../../lib/cookies/cookies";

// TODO move these to a better place
export const cookiePreferencesChangedCallbacks = new CallbackChainHook<CookieType[],[]>("cookiePreferencesChanged");
cookiePreferencesChangedCallbacks.add((cookiePreferences) => {
  initDatadog()
});
cookiePreferencesChangedCallbacks.add((cookiePreferences) => {
  // @ts-ignore
  window.dataLayer.push({ event: 'cookie_preferences_changed' }); // Must match event name in Google Tag Manager
});
// TODO clear disallowed cookies

export function useUpdateCookiePreferences(): [
  {
    [name: string]: any;
  },
  (newPreferences: CookieType[]) => void,
] {
  const [cookies, setCookie] = useCookies([COOKIE_PREFERENCES_COOKIE]);
  
  const updateCookiePreferences = useCallback(
    (newPreferences: CookieType[]) => {
      setCookie(COOKIE_PREFERENCES_COOKIE, newPreferences, { path: "/" });
      void cookiePreferencesChangedCallbacks.runCallbacks({iterator: newPreferences, properties: []});
    },
    [setCookie]
  );
  return [cookies, updateCookiePreferences];
}

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
