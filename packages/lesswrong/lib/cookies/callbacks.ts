import Cookies from "universal-cookie";
import { initDatadog } from "@/client/datadogRum";
import { ALL_COOKIES, CookieType, isCookieAllowed } from "./utils";
import { initReCaptcha } from "@/client/reCaptcha";

type CookiePreferencesChangedCallbackProps = {
  cookiePreferences: CookieType[];
  explicitlyChanged: boolean;
};

/**
 * (Re)-initialise datadog RUM and ReCaptcha with the current cookie preferences.
 * NOTE: this will not turn it OFF if they have previously accepted and are now rejecting analytics cookies, it will only turn it ON if they are now accepting.
 * There is no way to turn it off without reloading currently (see https://github.com/DataDog/browser-sdk/issues/1008)
 */
export function cookiePreferencesChanged({cookiePreferences, explicitlyChanged}: CookiePreferencesChangedCallbackProps) {
  void initDatadog();
  void initReCaptcha();

  // Send a cookie_preferences_changed event to Google Tag Manager, which triggers google analytics and hotjar to start
  //
  const dataLayer = (window as any).dataLayer
  if (!dataLayer) {
    // eslint-disable-next-line no-console
    console.warn("Trying to call gtag before dataLayer has been initialized")
  } else {
    dataLayer.push({ event: "cookie_preferences_changed" })
  }

  //
  // Remove all cookies that are not allowed
  //
  // Don't try to remove any cookies if:
  // - all cookies are allowed
  // - this change was not explicitly made by the user (i.e. it was made based on their location)
  if (!explicitlyChanged || JSON.stringify(cookiePreferences) === JSON.stringify(ALL_COOKIES)) return;

  const cookies = new Cookies();

  // eslint-disable-next-line no-console
  console.log("Removing cookies that are not allowed");

  // remove all cookies that are not allowed
  for (const cookieName in cookies.getAll()) {
    if (!isCookieAllowed(cookieName, cookiePreferences)) {
      cookies.remove(cookieName);
    }
  }
}
