import { registerCookie } from "./utils";

// TODO go through all descriptions and make sure they are good
export const CLIENT_ID_COOKIE = registerCookie({
  name: "clientId",
  type: "necessary",
  description: "A unique identifier for this browser",
});

export const TIMEZONE_COOKIE = registerCookie({
  name: "timezone",
  type: "necessary",
  description: "TODO",
});

export const COOKIE_PREFERENCES_COOKIE = registerCookie({
  name: "cookie_preferences", // Must match variable in Google Tag Manager
  type: "necessary",
  description: "Stores the users cookie preferences",
});

export const THEME_COOKIE = registerCookie({ name: "theme", type: "necessary", description: "TODO" });

// TODO add third party cookies here?
