import { Cookies } from "react-cookie";
import { initDatadog } from "../../client/datadogRum";
import { CallbackChainHook } from "../vulcan-lib";
import { ALL_COOKIES, CookieType, isCookieAllowed } from "./utils";
import { initReCaptcha } from "../../client/reCaptcha";

export const cookiePreferencesChangedCallbacks = new CallbackChainHook<CookieType[], []>("cookiePreferencesChanged");
/**
 * (Re)-initialise datadog RUM and ReCaptcha with the current cookie preferences.
 * NOTE: this will not turn it OFF if they have previously accepted and are now rejecting analytics cookies, it will only turn it ON if they are now accepting.
 * There is no way to turn it off without reloading currently (see https://github.com/DataDog/browser-sdk/issues/1008)
 */
cookiePreferencesChangedCallbacks.add((cookiePreferences) => {
  void initDatadog();
  void initReCaptcha();
});

/**
 * Send a cookie_preferences_changed event to Google Tag Manager, which triggers google analytics and hotjar to start
 */
cookiePreferencesChangedCallbacks.add((cookiePreferences) => {
  const dataLayer = (window as any).dataLayer
  if (!dataLayer) {
    // eslint-disable-next-line no-console
    console.warn("Trying to call gtag before dataLayer has been initialized")
  } else {
    dataLayer.push({ event: "cookie_preferences_changed" })
  }
});

/**
 * Remove all cookies that are not allowed
 */
cookiePreferencesChangedCallbacks.add((cookiePreferences: CookieType[]) => {
  // If all cookies are allowed, don't remove any cookies (will be the case for most users)
  if (JSON.stringify(cookiePreferences) === JSON.stringify(ALL_COOKIES)) return;

  const cookies = new Cookies();

  // eslint-disable-next-line no-console
  console.log("Removing cookies that are not allowed");

  // remove all cookies that are not allowed
  for (const cookieName in cookies.getAll()) {
    if (!isCookieAllowed(cookieName, cookiePreferences)) {
      cookies.remove(cookieName);
    }
  }
});
