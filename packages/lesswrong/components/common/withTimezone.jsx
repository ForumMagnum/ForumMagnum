import React from 'react';


export const TimezoneContext = React.createContext('timezone');

// Higher-order component for providing the user's timezone. Provides two
// props: timezone and timezoneIsKnown. If we know the user's timezone, then
// timezone is that timezone (a string, for use with moment-timezone, such as
// "America/New_York") and timezoneIsKnown is true; otherwise timezone is "GMT"
// and timezoneIsKnown is false.
export default function withTimezone(Component) {
  return function WithTimezoneComponent(props) {
    return (
      <TimezoneContext.Consumer>
        {timezone => <Component {...props}
          timezone={timezone ? timezone : "GMT"}
          timezoneIsKnown={!!timezone}
        />}
      </TimezoneContext.Consumer>
    );
  }
}
