'use client';
import React, { createContext, useState, useEffect, useMemo, use } from 'react';
import moment from '../../lib/moment-timezone';
import { useCurrentUser } from './withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { TIMEZONE_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { DEFAULT_TIMEZONE } from '@/lib/utils/timeUtil';

const TimezoneContext = createContext<{
  timezone: string
  timezoneIsKnown: boolean
} | null>(null);

// If we know the user's timezone, then timezone is that timezone (a string,
// for use with moment-timezone, such as "America/New_York") and timezoneIsKnown is true;
// otherwise timezone is "GMT" and timezoneIsKnown is false.
export const useTimezone = (): {
  timezone: string
  timezoneIsKnown: boolean
} => {
  return use(TimezoneContext) ?? {
    timezone: DEFAULT_TIMEZONE,
    timezoneIsKnown: false
  };
}

/**
 * TimezoneWrapper: Wrapper which provides a timezone context (which makes useTimezone
 * usable). Also responsible for keeping a timezone cookie updated, so that we know
 * what the user's last-known timezone was so we can use it to render SSRs correctly.
 *
 * `ssrTimezone` is the timezone the server rendered with (the timezone cookie
 * it received, or null). The initial state comes from it rather than from the
 * browser's cookie, so that hydration matches the server's markup even when the
 * page came from the CDN cache, whose render carried no cookies. The browser's
 * real timezone takes over after hydration.
 */
export const TimezoneWrapper = ({ssrTimezone, children}: {
  ssrTimezone: string | null
  children: React.ReactNode
}) => {
  const [, setCookie] = useCookiesWithConsent([TIMEZONE_COOKIE]);
  const [timezone, setTimezone] = useState(ssrTimezone);
  const currentUser = useCurrentUser();
  const updateUser = useUpdateCurrentUser();
  
  useEffect(() => {
    const newTimezone = moment.tz.guess();
    if(timezone !== newTimezone || (currentUser && currentUser.lastUsedTimezone !== newTimezone)) {
      setCookie(TIMEZONE_COOKIE, newTimezone, {path: "/"});
      if (currentUser) {
        void updateUser({ lastUsedTimezone: newTimezone, })
      }
      setTimezone(newTimezone);
    }
  }, [currentUser, timezone, setCookie, updateUser]);

  const value = useMemo(() => ({
    timezone: timezone ?? DEFAULT_TIMEZONE,
    timezoneIsKnown: !!timezone,
  }), [timezone]);
  
  return <TimezoneContext.Provider value={value}>
    {children}
  </TimezoneContext.Provider>
}
