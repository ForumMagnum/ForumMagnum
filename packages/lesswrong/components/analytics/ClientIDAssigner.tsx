"use client";

import { backgroundTask } from '@/server/utils/backgroundTask';
import { CLIENT_ID_NEW_COOKIE } from '@/lib/cookies/cookies';
import { useEffectOnce } from '../hooks/useEffectOnce';

// Marks that this tab has already asked the server to check its clientId, so
// a returning visitor pays for the invalidation lookup once per session rather
// than once per page load.
const CLIENT_ID_CHECKED_SESSION_KEY = 'clientIdChecked';

function browserHasClientIdNewCookie(): boolean {
  return document.cookie.split('; ').some((cookie) => cookie.startsWith(`${CLIENT_ID_NEW_COOKIE}=`));
}

function clientIdCheckedThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(CLIENT_ID_CHECKED_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

function markClientIdCheckedThisSession() {
  try {
    window.sessionStorage.setItem(CLIENT_ID_CHECKED_SESSION_KEY, 'true');
  } catch {
    // Storage unavailable (private mode, blocked site data): fall back to
    // checking on every page load.
  }
}

/**
 * Registers newly-assigned clientIds and lets the server rotate invalidated
 * ones. Everything is decided from the browser's own cookies rather than from
 * server-rendered props: the HTML may have been rendered for a request that
 * carried different cookies (CDN-cached pages), and deciding on the server
 * would put a database lookup on the render path of every page.
 */
const ClientIDAssigner = () => {
  useEffectOnce(() => {
    if (!browserHasClientIdNewCookie() && clientIdCheckedThisSession()) {
      return;
    }
    backgroundTask((async () => {
      const landingPage = window.location.href;
      const referrer = document.referrer;
      await fetch("/api/registerClientId", {
        method: "POST",
        body: JSON.stringify({
          landingPage,
          referrer,
        }),
      });
      markClientIdCheckedThisSession();
    })());
  });

  return null;
}

export default ClientIDAssigner;
