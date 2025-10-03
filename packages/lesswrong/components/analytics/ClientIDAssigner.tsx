"use client";

import React from 'react';
import { backgroundTask } from '@/server/utils/backgroundTask';
import { useEffectOnce } from '../hooks/useEffectOnce';

const ClientIDAssigner = ({clientIdNewCookieExists, clientIdInvalidated}: {
  clientIdNewCookieExists: boolean,
  clientIdInvalidated: boolean
}) => {
  useEffectOnce(() => {
    backgroundTask((async () => {
      if (clientIdNewCookieExists || clientIdInvalidated) {
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

