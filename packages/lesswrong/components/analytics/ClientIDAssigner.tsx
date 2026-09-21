"use client";

import { backgroundTask } from '@/server/utils/backgroundTask';
import { CLIENT_ID_NEW_COOKIE } from '@/lib/cookies/cookies';
import { useEffectOnce } from '../hooks/useEffectOnce';

function browserHasClientIdNewCookie(): boolean {
  return document.cookie.split('; ').some((cookie) => cookie.startsWith(`${CLIENT_ID_NEW_COOKIE}=`));
}

const ClientIDAssigner = ({clientIdNewCookieExists, clientIdInvalidated}: {
  clientIdNewCookieExists: boolean,
  clientIdInvalidated: boolean
}) => {
  useEffectOnce(() => {
    backgroundTask((async () => {
      // The server-derived props reflect the cookies of the request that
      // produced this HTML. For a CDN-cached page that request carried no
      // cookies, so also check the browser's actual cookies.
      if (clientIdNewCookieExists || clientIdInvalidated || browserHasClientIdNewCookie()) {
        const landingPage = window.location.href;
        const referrer = document.referrer;
        await fetch("/api/registerClientId", {
          method: "POST",
          body: JSON.stringify({
            landingPage,
            referrer,
          }),
        });
      }
    })());
  });

  return null;
}

export default ClientIDAssigner;

