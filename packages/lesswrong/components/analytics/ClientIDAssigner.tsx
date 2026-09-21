"use client";

import { backgroundTask } from '@/server/utils/backgroundTask';
import { CLIENT_ID_NEW_COOKIE } from '@/lib/cookies/cookies';
import { useEffectOnce } from '../hooks/useEffectOnce';

function browserHasClientIdNewCookie(): boolean {
  return document.cookie.split('; ').some((cookie) => cookie.startsWith(`${CLIENT_ID_NEW_COOKIE}=`));
}

const ClientIDAssigner = ({clientIdInvalidated}: {
  clientIdInvalidated: boolean
}) => {
  useEffectOnce(() => {
    backgroundTask((async () => {
      // Read from the browser rather than passed from the server: a CDN-cached
      // page was rendered for a request that carried no cookies.
      if (clientIdInvalidated || browserHasClientIdNewCookie()) {
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

