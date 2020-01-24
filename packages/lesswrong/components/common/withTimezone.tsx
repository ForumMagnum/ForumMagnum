import React from 'react';
import { hookToHoc } from '../../lib/hocUtils';

export const TimezoneContext = React.createContext('timezone');

export const useTimezone = () => {
  const timezone = React.useContext(TimezoneContext);
  return {
    timezone: timezone ? timezone : "GMT",
    timezoneIsKnown: !!timezone,
  };
}

// Higher-order component for providing the user's timezone. Provides two
// props: timezone and timezoneIsKnown. If we know the user's timezone, then
// timezone is that timezone (a string, for use with moment-timezone, such as
// "America/New_York") and timezoneIsKnown is true; otherwise timezone is "GMT"
// and timezoneIsKnown is false.
export const withTimezone = hookToHoc(useTimezone);
export default withTimezone;
