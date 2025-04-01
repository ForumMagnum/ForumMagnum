import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { useCurrentUser } from './withUser';
import { getUserEmail } from "../../lib/collections/users/helpers";
import { useLocation } from '../../lib/routeUtil';
import withErrorBoundary from './withErrorBoundary'
import Intercom from '../../lib/vendor/react-intercom';
import { useCookiePreferences } from '../hooks/useCookiesWithConsent';

const intercomAppIdSetting = new DatabasePublicSetting<string>('intercomAppId', 'wtb8z7sj')

const styles = (theme: ThemeType) => ({
  "@global": {
    ...(theme.palette.intercom ? {
      '.intercom-launcher': {
        backgroundColor: theme.palette.intercom.buttonBackground
      }
    } : null),
    ".intercom-lightweight-app": {
      zIndex: `${theme.zIndexes.intercomButton} !important`,
    },
  },
});

const IntercomWrapper = () => {
  const currentUser = useCurrentUser();
  const { currentRoute } = useLocation();

  const { cookiePreferences } = useCookiePreferences()
  const functionalCookiesAllowed = cookiePreferences.includes('functional')
  
  if (currentRoute?.standalone) {
    return null;
  }
  if (!functionalCookiesAllowed) {
    // eslint-disable-next-line no-console
    console.log("Not showing Intercom because functional cookies are not allowed")
    return null;
  }

  return null;
  
  // if (currentUser && !currentUser.hideIntercom) {
  //   return <div id="intercom-outer-frame">
  //     <Intercom
  //       appID={intercomAppIdSetting.get()}
  //       user_id={currentUser._id}
  //       email={getUserEmail(currentUser)}
  //       name={currentUser.displayName}
  //     />
  //   </div>
  // } else if (!currentUser) {
  //   return <div id="intercom-outer-frame">
  //     <Intercom appID={intercomAppIdSetting.get()} />
  //   </div>
  // } else {
  //   return null
  // }
}

const IntercomWrapperComponent = registerComponent('IntercomWrapper', IntercomWrapper, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    IntercomWrapper: typeof IntercomWrapperComponent
  }
}
