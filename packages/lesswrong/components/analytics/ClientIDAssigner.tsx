"use client";

import React from 'react';
import { CLIENT_ID_COOKIE, CLIENT_ID_NEW_COOKIE } from '@/lib/cookies/cookies';
import { backgroundTask } from '@/server/utils/backgroundTask';
import { useEffectOnce } from '../hooks/useEffectOnce';
import { RequestCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import keyBy from 'lodash/keyBy';

const ClientIDAssigner = ({cookieArray, clientIdInvalidated}: {
  cookieArray: RequestCookie[],
  clientIdInvalidated: boolean
}) => {
  console.log("In ClientIDAssigner");
  const cookies = keyBy(cookieArray, c=>c.name);
  useEffectOnce(() => {
    backgroundTask((async () => {
      const clientIdNewCookie = cookies[CLIENT_ID_NEW_COOKIE];
      if (clientIdNewCookie || clientIdInvalidated) {
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

