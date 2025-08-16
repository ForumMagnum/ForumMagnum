import { registerCookie } from "./utils";

// First party cookies

export const CLIENT_ID_COOKIE = registerCookie({
  name: "clientId",
  type: "necessary",
  description: "A unique identifier for this browser",
});

export const CLIENT_ID_NEW_COOKIE = registerCookie({
  name: "clientIdUnset",
  type: "necessary",
  description: "Whether the client ID is newly assigned",
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
  description: "Whether to show the quick takes section on the EA Forum home page",
})

export const SHOW_QUICK_TAKES_SECTION_COMMUNITY_COOKIE = registerCookie({
  name: 'show_quick_takes_community',
  type: "necessary",
  description: "Whether to include quick takes tagged with community in the home page quick takes section",
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

export const SHOW_PODCAST_PLAYER_COOKIE = registerCookie({
  name: "show_post_podcast_player",
  type: "necessary",
  description: "Whether to show the podcast player on a posts pages",
});

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

export const HIDE_FORUM_EVENT_BANNER_PREFIX = "hide_forum_event_banner_";
registerCookie({
  name: `${HIDE_FORUM_EVENT_BANNER_PREFIX}[*]`,
  matches: (name: string) => name.startsWith(HIDE_FORUM_EVENT_BANNER_PREFIX),
  type: "necessary",
  description: "Stores whether a forum event banner has been hidden",
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

export const HIDE_2021_BOOK_BANNER_COOKIE = registerCookie({
  name: "hide_2021_book_banner",
  type: "necessary",
  description: "Don't show the 2021 book banner",
});

export const LAST_VISITED_FRONTPAGE_COOKIE = registerCookie({
  name: "last_visited_frontpage",
  type: "functional",
  description: "Stores the date of the user's last visit to the frontpage",
});

export const RECOMBEE_SETTINGS_COOKIE = registerCookie({
  name: "admin_recombee_settings",
  type: "functional",
  description: "Stores recombee settings for admins experimenting with latest posts"
});

export const NEW_POSTS_LIST_VIEW_TOGGLE_COOKIE = registerCookie({
  name: "new_posts_list_view_toggle",
  type: "necessary",
  description: "Tracks whether or not to show the \"NEW\" flag on the posts list view toggle"
});

export const POSTS_LIST_VIEW_TYPE_COOKIE = registerCookie({
  name: "posts_list_view_type",
  type: "necessary",
  description: "Whether to display post lists as list items or card items"
});

export const HIDE_SUBSCRIBED_FEED_SUGGESTED_USERS = registerCookie({
  name: "hide_subscribed_feed_suggested_users",
  type: "necessary",
  description: "Whether to hide the suggested users section on the subscribed tab feed"
});

export const HIDE_SURVEY_SCHEDULE_IDS = registerCookie({
  name: "hide_survey_schedule_ids",
  type: "necessary",
  description: "Stores the ids of survey schedules that the user has hidden"
});

export const SELECTED_FRONTPAGE_TAB_COOKIE = registerCookie({
  name: "selected_frontpage_tab",
  type: "functional",
  description: "Stores the selected tab for logged out users"
});

export const HIDE_EAG_BANNER_COOKIE = registerCookie({
  name: "hide_eag_banner",
  type: "necessary",
  description: "Don't show any EAG(x) banners",
});

export const HIDE_EA_FORUM_SURVEY_BANNER_COOKIE = registerCookie({
  name: "hide_ea_forum_survey_banner",
  type: "necessary",
  description: "Don't show the EA Forum survey banner",
});

export const NAV_MENU_FLAG_COOKIE_PREFIX = "nav_menu_flag_";
registerCookie({
  name: `${NAV_MENU_FLAG_COOKIE_PREFIX}[*]`,
  matches: (name: string) => name.startsWith(NAV_MENU_FLAG_COOKIE_PREFIX),
  type: "necessary",
  description: "Whether or not to show particular flags in the main navigation menu",
});

export const SHOW_LLM_CHAT_COOKIE = registerCookie({
  name: "llm_chat_conversation_open",
  type: "functional",
  description: "Whether the LLM chat conversation UI is open",
});

export const HIDE_LLM_CHAT_GUIDE_COOKIE = registerCookie({
  name: "llm_chat_guide_open",
  type: "functional",
  description: "Whether the LLM chat guide is open",
})

export const LLM_CHAT_EXPANDED = registerCookie({
  name: "llm_chat_expanded",
  type: "functional",
  description: "Whether the LLM chat has expanded size",
})

export const ULTRA_FEED_ENABLED_COOKIE = registerCookie({
  name: 'ultra_feed_enabled',
  type: "functional",
  description: "Whether the ultra feed mode is enabled, which hides QuickTakes and Popular Comments",
})

export const ULTRA_FEED_PAGE_VISITED_COOKIE = registerCookie({
  name: 'ultra_feed_page_visited',
  type: "functional",
  description: "Whether the user has ever visited the ultra feed page",
})

export const PINNED_GLOSSARY_COOKIE = registerCookie({
  name: 'pinnedGlossary',
  type: 'functional',
  description: 'Whether the glossary is pinned',
});

export const NO_ADMIN_NEXT_REDIRECT_COOKIE = registerCookie({
  name: 'no_admin_next_redirect',
  type: 'functional',
  description: `If set, admins won't be redirected to the baserates-prod-test.vercel.app domain`,
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

