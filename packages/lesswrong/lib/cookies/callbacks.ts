import { Cookies } from "react-cookie";
import { CallbackChainHook } from "../vulcan-lib";
import { ALL_COOKIES, CookieType, isCookieAllowed } from "./utils";
import { initReCaptcha } from "../../client/reCaptcha";

type CookiePreferencesChangedCallbackProps = {
  cookiePreferences: CookieType[];
  explicitlyChanged: boolean;
};
export const cookiePreferencesChangedCallbacks = new CallbackChainHook<CookiePreferencesChangedCallbackProps, []>("cookiePreferencesChanged");
cookiePreferencesChangedCallbacks.add(() => {
  void initReCaptcha();
});

/**
 * Send a cookie_preferences_changed event to Google Tag Manager, which triggers google analytics and hotjar to start
 */
cookiePreferencesChangedCallbacks.add(() => {
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
cookiePreferencesChangedCallbacks.add(({cookiePreferences, explicitlyChanged}: CookiePreferencesChangedCallbackProps) => {
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
});
