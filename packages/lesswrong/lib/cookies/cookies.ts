import { registerCookie } from "./utils";

// First party cookies that are used in multiple places (others are defined inline)

export const CLIENT_ID_COOKIE = registerCookie({
  name: "clientId",
  type: "necessary",
  description: "A unique identifier for this browser",
});

export const TIMEZONE_COOKIE = registerCookie({
  name: "timezone",
  type: "necessary",
  description: "Stores the user's timezone",
});

export const THEME_COOKIE = registerCookie({ name: "theme", type: "necessary", description: "Stores the user's theme preferences" });

// Third party cookies

// Intercom
registerCookie({
  name: "intercom-session-[*]",
  matches: (name: string) => name.startsWith("intercom-session-"),
  type: "functional",
  thirdPartyName: "Intercom",
  description: "Session cookie used by Intercom",
});

registerCookie({
  name: "intercom-id-[*]",
  matches: (name: string) => name.startsWith("intercom-id-"),
  type: "functional",
  thirdPartyName: "Intercom",
  description: "ID cookie used by Intercom",
});

registerCookie({
  name: "intercom-device-id-[*]",
  matches: (name: string) => name.startsWith("intercom-id-"),
  type: "functional",
  thirdPartyName: "Intercom",
  description: "Device ID cookie used by Intercom",
});

registerCookie({
  name: "intercom-[*]",
  matches: (name: string) => name.startsWith("intercom-"),
  type: "functional",
  thirdPartyName: "Intercom",
  description: "Miscellaneous cookies which may be set by Intercom",
});

// Datadog
registerCookie({
  name: "dd_cookie_test_",
  type: "analytics",
  thirdPartyName: "Datadog",
  description: "Cookie used by Datadog to test if cookies are enabled",
});

registerCookie({
  name: "_dd_s",
  type: "analytics",
  thirdPartyName: "Datadog",
  description: "Main cookie used by datadog to track sessions",
});

// Hotjar
registerCookie({
  name: "_hjTLDTest",
  type: "functional",
  thirdPartyName: "Hotjar",
  description:
    "When the Hotjar script executes we try to determine the most generic cookie path we should use, instead of the page hostname. This is done so that cookies can be shared across subdomains (where applicable). To determine this, we try to store the _hjTLDTest cookie for different URL substring alternatives until it fails. After this check, the cookie is removed.",
});

registerCookie({
  name: "_hjSessionUser_[*]",
  type: "functional",
  thirdPartyName: "Hotjar",
  description:
    "Hotjar cookie that is set when a user first lands on a page with the Hotjar script. It is used to persist the Hotjar User ID, unique to that site on the browser. This ensures that behavior in subsequent visits to the same site will be attributed to the same user ID.",
});

registerCookie({
  name: "_hjIncludedInSessionSample_[*]",
  matches: (name: string) => name.startsWith("_hjIncludedInSessionSample_"),
  type: "functional",
  thirdPartyName: "Hotjar",
  description:
    "Whether the current user is included in the session sample.",
});

registerCookie({
  name: "_hjFirstSeen",
  type: "functional",
  thirdPartyName: "Hotjar",
  description:
    "Identifies a new user's first session on a website, indicating whether or not Hotjar's seeing this user for the first time.",
});

registerCookie({
  name: "_hjAbsoluteSessionInProgress",
  type: "functional",
  thirdPartyName: "Hotjar",
  description:
    "This cookie is used by HotJar to detect the first pageview session of a user. This is a True/False flag set by the cookie.",
});

// Google
registerCookie({
  name: "_gid",
  type: "analytics",
  thirdPartyName: "Google",
  description: "This cookie name is associated with Google Universal Analytics. This appears to be a new cookie and as of Spring 2017 no information is available from Google. It appears to store and update a unique value for each page visited.",
});

registerCookie({
  name: "_ga",
  type: "analytics",
  thirdPartyName: "Google",
  description: "This cookie name is associated with Google Universal Analytics. This cookie is used to distinguish unique users by assigning a randomly generated number as a client identifier.",
});

registerCookie({
  name: "__Host-GAPS",
  type: "necessary",
  thirdPartyName: "Google",
  description: "This cookie name is associated with Google. It is set by Google to identify the user and is used in support of the Google Identity application.",
});
