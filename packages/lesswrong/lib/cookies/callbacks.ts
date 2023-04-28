import { initDatadog } from "../../client/datadogRum";
import { CallbackChainHook } from "../vulcan-lib";
import { CookieType } from "./utils";

export const cookiePreferencesChangedCallbacks = new CallbackChainHook<CookieType[], []>("cookiePreferencesChanged");
/**
 * (Re)-initialise datadog RUM with the current cookie preferences.
 * NOTE: this will not turn it OFF if they have previously accepted and are now rejecting analytics cookies, it will only turn it ON if they are now accepting.
 * There is no way to turn it off without reloading currently (see https://github.com/DataDog/browser-sdk/issues/1008)
 */
cookiePreferencesChangedCallbacks.add((cookiePreferences) => {
  void initDatadog();
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
