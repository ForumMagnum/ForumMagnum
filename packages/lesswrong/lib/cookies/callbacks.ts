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
  // @ts-ignore
  window.dataLayer.push({ event: "cookie_preferences_changed" }); // Must match event name in Google Tag Manager
});
