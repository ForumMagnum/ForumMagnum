import { getCookiePreferences } from '../lib/cookies/utils';
import { isServer } from '../lib/executionEnvironment';
import { reCaptchaSiteKeySetting } from '@/lib/instanceSettings';

declare global {
  interface Window {
    onReCaptchaLoaded: () => void;
    recaptchaLoaded: boolean;
  }
}

window.onReCaptchaLoaded = function() {
  window.recaptchaLoaded = true;
}

let reCaptchaInitialized = false;

/**
 * Check for cookie preferences and initialize ReCaptcha if analytics cookies are allowed.
 * Unfortunately checking for cookie preferences makes it a lot less useful for preventing spam,
 * but it will still work outside GDPR countries at least.
 */
export async function initReCaptcha() {
  if (isServer || reCaptchaInitialized) {
    return;
  }

  const { cookiePreferences } = await getCookiePreferences();

  const analyticsCookiesAllowed = cookiePreferences.includes("analytics");

  if (!analyticsCookiesAllowed) {
    // eslint-disable-next-line no-console
    console.log("Not initializing ReCaptcha because analytics cookies are not allowed");
    return;
  }

  // Load and run ReCaptcha script on client
  const script = document.createElement('script');
  script.src = `https://www.google.com/recaptcha/api.js?onload=onReCaptchaLoaded&render=${reCaptchaSiteKeySetting.get()}`;
  document.body.appendChild(script);

  reCaptchaInitialized = true;
}
