import { useCookies } from "react-cookie";
import { CookieSetOptions } from "universal-cookie/cjs/types";
import { COOKIE_CONSENT_TIMESTAMP_COOKIE, COOKIE_PREFERENCES_COOKIE, CookieType, isCookieAllowed, isValidCookieTypeArray } from "../../lib/cookies/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cookiePreferencesChangedCallbacks } from "../../lib/cookies/callbacks";
import { getExplicitConsentRequiredAsync, getExplicitConsentRequiredSync } from "../common/CookieBanner/geolocation";

export function useCookiePreferences(): {
  cookiePreferences: CookieType[];
  updateCookiePreferences: (newPreferences: CookieType[]) => void;
  explicitConsentGiven: boolean;
  explicitConsentRequired: boolean | "unknown";
} {
  const [explicitConsentRequired, setExplicitConsentRequired] = useState<boolean | "unknown">(getExplicitConsentRequiredSync());

  const [cookies, setCookie] = useCookies([COOKIE_PREFERENCES_COOKIE, COOKIE_CONSENT_TIMESTAMP_COOKIE]);
  const preferencesCookieValue = cookies[COOKIE_PREFERENCES_COOKIE];
  const explicitConsentGiven = !!cookies[COOKIE_CONSENT_TIMESTAMP_COOKIE] && isValidCookieTypeArray(preferencesCookieValue)

  const fallbackPreferences: CookieType[] = useMemo(() => explicitConsentRequired !== false ? ["necessary"] : ["necessary", "functional", "analytics"], [explicitConsentRequired]);
  const cookiePreferences = explicitConsentGiven ? preferencesCookieValue : fallbackPreferences

  // If we can't determine whether explicit consent is required synchronously (from localStorage), check via the geolocation API
  useEffect(() => {
    if (explicitConsentRequired !== "unknown") return;

    void (async () => {
      const explicitConsentRequired = await getExplicitConsentRequiredAsync();
      setExplicitConsentRequired(explicitConsentRequired);
    })();
  }, [explicitConsentRequired]);

  // If the user had not given explicit consent, but the value of COOKIE_PREFERENCES_COOKIE is different to what we are
  // using in the code (fallbackPreferences), update the cookie. This is so that Google Tag Manager handles it correctly.
  useEffect(() => {
    if (explicitConsentRequired === "unknown" || explicitConsentGiven) return;

    if (JSON.stringify(cookiePreferences) !== JSON.stringify(preferencesCookieValue)) {
      setCookie(COOKIE_PREFERENCES_COOKIE, cookiePreferences, { path: "/" });
      void cookiePreferencesChangedCallbacks.runCallbacks({iterator: cookiePreferences, properties: []});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [explicitConsentRequired, JSON.stringify(cookiePreferences), JSON.stringify(preferencesCookieValue), setCookie]);
  
  const updateCookiePreferences = useCallback(
    (newPreferences: CookieType[]) => {
      setCookie(COOKIE_CONSENT_TIMESTAMP_COOKIE, new Date(), { path: "/" });
      setCookie(COOKIE_PREFERENCES_COOKIE, newPreferences, { path: "/" });
      void cookiePreferencesChangedCallbacks.runCallbacks({iterator: newPreferences, properties: []});
    },
    [setCookie]
  );
  return { cookiePreferences, updateCookiePreferences, explicitConsentGiven, explicitConsentRequired };
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
