import { registerCookie } from "./utils";

// First party cookies

export const CLIENT_ID_COOKIE = registerCookie({
  name: "clientId",
  type: "necessary",
  description: "A unique identifier for this browser",
});

export const LOGIN_TOKEN_COOKIE = registerCookie({
  name: "loginToken",
  type: "necessary",
  description: "The user's login token",
});

export const TIMEZONE_COOKIE = registerCookie({
  name: "timezone",
  type: "necessary",
  description: "Stores the user's timezone",
});

export const THEME_COOKIE = registerCookie({ name: "theme", type: "necessary", description: "Stores the user's theme preferences" });

export const HIDE_FEATURED_RESOURCE_COOKIE = registerCookie({
  name: "hide_featured_resource",
  type: "necessary",
  description: "Controls whether the featured resource banner in the left sidebar is hidden",
});

export const SHOW_COMMUNITY_POSTS_SECTION_COOKIE = registerCookie({
  name: 'show_community_posts_section',
  type: "necessary",
  description: "Whether to show the community posts section on the EA Forum home page",
})

export const SHOW_QUICK_TAKES_SECTION_COOKIE = registerCookie({
  name: 'show_quick_takes_section',
  type: "necessary",
  description: "Whether to show the Quick takes section on the EA Forum home page",
})

export const SHOW_QUICK_TAKES_SECTION_COMMUNITY_COOKIE = registerCookie({
  name: 'show_quick_takes_community',
  type: "necessary",
  description: "Whether to include Quick takes tagged with community in the home page quick takes section",
})

export const SHOW_POPULAR_COMMENTS_SECTION_COOKIE = registerCookie({
  name: 'show_popular_comments_section',
  type: "necessary",
  description: "Whether to show the popular comments section on the EA Forum home page",
})

export const HIDE_HANDBOOK_COOKIE = registerCookie({
  name: "hide_home_handbook",
  type: "necessary",
  description: "Whether to hide the EA Handbook on the EA Forum home page",
});

export const HIDE_JOB_AD_COOKIE = registerCookie({name: 'hide_job_ad', type: "necessary", description: 'Controls whether job ads are hidden'});

export const SHOW_PODCAST_PLAYER_COOKIE = registerCookie({
  name: "show_post_podcast_player",
  type: "necessary",
  description: "Whether to show the podcast player on a posts pages",
});

export const PODCAST_TOOLTIP_SEEN_COOKIE = registerCookie({name: 'podcast_tooltip_seen', type: "necessary", description: "Stores whether the user has seen the podcast 'new feature' tooltip"})

export const HIDE_WELCOME_BOX_COOKIE = registerCookie({
  name: "hide_welcome_box",
  type: "necessary",
  description: "Controls whether the welcome box on a post page is hidden",
});

export const HIDE_MAP_COOKIE = registerCookie({name: `hideMapFromFrontpage`, type: "necessary", description: "Stores whether the user has hidden the map from the frontpage."});

export const HIDE_COLLECTION_ITEM_PREFIX = 'hide_collection_item_';
registerCookie({
  name: `${HIDE_COLLECTION_ITEM_PREFIX}[*]`,
  matches: (name: string) => name.startsWith(HIDE_COLLECTION_ITEM_PREFIX),
  type: "necessary",
  description: "Stores whether a collection item has been hidden (for a specific collection item id)",
});

export const HIDE_SPOTLIGHT_ITEM_PREFIX = "hide_spotlight_item_";
registerCookie({
  name: `${HIDE_SPOTLIGHT_ITEM_PREFIX}[*]`,
  matches: (name: string) => name.startsWith(HIDE_SPOTLIGHT_ITEM_PREFIX),
  type: "necessary",
  description: "Stores whether a spotlight item has been hidden (for a specific spotlight item id)",
});

export const SHOW_RECOMMENDATIONS_SECTION_COOKIE = registerCookie({
  name: "show_recommendations_section",
  type: "necessary",
  description: "Controls whether the recommendations ('Classic posts') section on the frontpage is shown or hidden",
});

export const HIDE_IMPORT_EAG_PROFILE = registerCookie({
  name: "hide_import_eag_profile",
  type: "necessary",
  description: "Controls whether the EAG profile import banner is shown or hidden on the edit profile page",
});

export const HIDE_MORE_FROM_THE_FORUM_RECOMMENDATIONS_COOKIE = registerCookie({
  name: "hide_more_from_the_forum_recommendations",
  type: "necessary",
  description: "Don't show the \"More from the forum\" recommendations section",
});

export const HIDE_NEW_POST_HOW_TO_GUIDE_COOKIE = registerCookie({
  name: "hide_new_post_how_to_guide",
  type: "necessary",
  description: "Don't show the how-to guide on the new post page",
});


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
  matches: (name: string) => name.startsWith("_hjSessionUser_"),
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
  name: "_dc_gtm_UA[*]",
  matches: (name: string) => name.startsWith("_dc_gtm_UA"),
  type: "analytics",
  thirdPartyName: "Google",
  description: "Used by Google Tag Manager to control the loading of a Google Analytics script tag.",
});

registerCookie({
  name: "__Host-GAPS",
  type: "necessary",
  thirdPartyName: "Google",
  description: "This cookie name is associated with Google. It is set by Google to identify the user and is used in support of the Google Identity application.",
});

// Google Recaptcha
registerCookie({
  name: "(various)",
  type: "analytics",
  thirdPartyName: "Google ReCaptcha",
  description: "Google ReCaptcha may set a number of cookies under the 'google.com' domain in order to check for suspicious activity. " +
               "The full list of known possible cookies are: __Secure-3PSIDCC, __Secure-1PSIDCC, SIDCC, __Secure-3PAPISID, SSID, " +
               "__Secure-1PAPISID, HSID, __Secure-3PSID, __Secure-1PSID, SID, SAPISID, APISID, NID, OTZ, 1P_JAR, AEC, DV, __Secure-ENID",
});
