import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { DatabasePublicSetting } from '../../lib/publicSettings';
import { useCurrentUser } from './withUser';
import { getUserEmail } from "../../lib/collections/users/helpers";
import { useLocation } from '../../lib/routeUtil';
import withErrorBoundary from './withErrorBoundary'
import Intercom from 'react-intercom';

const intercomAppIdSetting = new DatabasePublicSetting<string>('intercomAppId', 'wtb8z7sj')

const styles = (theme: ThemeType): JssStyles => ({
  "@global": {
    ...(theme.palette.intercom ? {
      '.intercom-launcher': {
        backgroundColor: theme.palette.intercom.buttonBackground
      }
    } : null),
  },
});

const IntercomWrapper = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { currentRoute } = useLocation();
  
  if (currentRoute?.standalone) {
    return null;
  }
  
  if (currentUser && !currentUser.hideIntercom) {
    return <div id="intercome-outer-frame">
      <Intercom
        appID={intercomAppIdSetting.get()}
        user_id={currentUser._id}
        email={getUserEmail(currentUser)}
        name={currentUser.displayName}
      />
    </div>
  } else if (!currentUser) {
    return <div id="intercome-outer-frame">
      <Intercom appID={intercomAppIdSetting.get()}/>
    </div>
  } else {
    return null
  }
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
