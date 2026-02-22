import Cookies from "universal-cookie";
import { ALL_COOKIES, CookieType, isCookieAllowed } from "./utils";
import { initReCaptcha } from "@/client/reCaptcha";
import { backgroundTask } from "@/server/utils/backgroundTask";

type CookiePreferencesChangedCallbackProps = {
  cookiePreferences: CookieType[];
  explicitlyChanged: boolean;
};

/**
 * (Re)-initialise services which depend on cookie preferences.
 */
export function cookiePreferencesChanged({cookiePreferences, explicitlyChanged}: CookiePreferencesChangedCallbackProps) {
  backgroundTask(initReCaptcha());

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
