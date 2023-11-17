import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from './withUser';
import { useServerRequestStatus } from '../../lib/routeUtil'

const ErrorAccessDenied = ({explanation}: {explanation?: string}) => {
  const { SingleColumnSection, Typography } = Components;
  const serverRequestStatus = useServerRequestStatus()
  const currentUser = useCurrentUser();
  if (serverRequestStatus) serverRequestStatus.status = 403
  
  if (currentUser) {
    const message = `Sorry, you don't have access to this page.${(explanation ? ` ${explanation}` : "")}`
    return <SingleColumnSection>
      <div>{message}</div>
    </SingleColumnSection>
  } else {
    return <SingleColumnSection>
      <Typography variant='body1'>
        Please log in to access this page.
      </Typography>
      <Components.WrappedLoginForm startingState='login'/>
    </SingleColumnSection>
  }
}

const ErrorAccessDeniedComponent = registerComponent("ErrorAccessDenied", ErrorAccessDenied);

declare global {
  interface ComponentTypes {
    ErrorAccessDenied: typeof ErrorAccessDeniedComponent
  }
}
