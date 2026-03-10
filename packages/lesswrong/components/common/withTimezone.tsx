'use client';
import React, { createContext, useState, useEffect, useMemo, use } from 'react';
import moment from '../../lib/moment-timezone';
import { useCurrentUser } from './withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { TIMEZONE_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { EnvironmentOverrideContext, DEFAULT_TIMEZONE } from '@/lib/utils/timeUtil';

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
 */
export const TimezoneWrapper = ({children}: {
  children: React.ReactNode
}) => {
  const [cookies, setCookie] = useCookiesWithConsent([TIMEZONE_COOKIE]);
  const savedTimezone = cookies[TIMEZONE_COOKIE];
  const [timezone,setTimezone] = useState(savedTimezone);
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

