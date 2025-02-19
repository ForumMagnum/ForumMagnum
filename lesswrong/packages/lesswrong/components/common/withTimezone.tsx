import React, { useState, useEffect } from 'react';
import { hookToHoc } from '../../lib/hocUtils';
import moment from '../../lib/moment-timezone';
import { useCurrentUser } from './withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { TIMEZONE_COOKIE } from '../../lib/cookies/cookies';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { DEFAULT_TIMEZONE, EnvironmentOverrideContext } from '../../lib/utils/timeUtil';

export const TimezoneContext = React.createContext<string|null>(null);

export const useTimezone = (): WithTimezoneProps => {
  const { timezone: overrideTimezone } = React.useContext(EnvironmentOverrideContext);
  const timezone = React.useContext(TimezoneContext);

  return {
    timezone: overrideTimezone ?? timezone ?? DEFAULT_TIMEZONE,
    timezoneIsKnown: !!(overrideTimezone ?? timezone),
  };
}

// Higher-order component for providing the user's timezone. Provides two
// props: timezone and timezoneIsKnown. If we know the user's timezone, then
// timezone is that timezone (a string, for use with moment-timezone, such as
// "America/New_York") and timezoneIsKnown is true; otherwise timezone is "GMT"
// and timezoneIsKnown is false.
export const withTimezone = hookToHoc(useTimezone);

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
  
  return <TimezoneContext.Provider value={timezone}>
    {children}
  </TimezoneContext.Provider>
}

