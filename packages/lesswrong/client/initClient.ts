import { CLIENT_ID_COOKIE } from "@/lib/cookies/cookies";
import { randomId } from "@/lib/random";
// import { initDatadog } from "./datadogRum";
import { googleTagManagerInit } from "./ga";
import { initReCaptcha } from "./reCaptcha";

import "@/components/momentjs";
import "./type3";
import './polyfills'

/**
 * These identifiers may or may not have been set on the server, depending on whether the request
 * needs to be cache friendly (and hence may not be unique to this client + tab). Generate them now
 * if they are not set.
 */
function ensureIdentifiers() {
  if (!document.cookie.split('; ').find(row => row.startsWith(CLIENT_ID_COOKIE))) {
    // The API here is confusing but this is the correct way to set a single cookie (and it doesn't overwrite other cookies)
    document.cookie = `${CLIENT_ID_COOKIE}=${randomId()}; path=/; max-age=315360000`;
  }

  if (!window.tabId) {
    window.tabId = randomId();
  }
}

let clientInitialized = false;

export function initClientOnce() {
  if (clientInitialized) return;
  clientInitialized = true;

  ensureIdentifiers();
  
  googleTagManagerInit();
  // void initDatadog();
  void initReCaptcha();
}
