import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from './withUser';
import { useServerRequestStatus } from '../../lib/routeUtil'
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: isFriendlyUI
    ? {
      fontFamily: theme.palette.fonts.sansSerifStack,
      fontSize: 14,
      fontWeight: 500,
    }
    :{},
});

const ErrorAccessDenied = ({explanation, classes}: {
  explanation?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { SingleColumnSection, Typography } = Components;
  const serverRequestStatus = useServerRequestStatus()
  const currentUser = useCurrentUser();
  if (serverRequestStatus) serverRequestStatus.status = 403
  
  if (currentUser) {
    const message = `Sorry, you don't have access to this page.${(explanation ? ` ${explanation}` : "")}`
    return <SingleColumnSection>
      <div className={classes.root}>{message}</div>
    </SingleColumnSection>
  } else {
    return <SingleColumnSection>
      <Typography variant='body1' className={classes.root}>
        Please log in to access this page.
      </Typography>
      <Components.LoginForm startingState='login'/>
    </SingleColumnSection>
  }
}

const ErrorAccessDeniedComponent = registerComponent(
  "ErrorAccessDenied",
  ErrorAccessDenied,
  {styles},
);

declare global {
  interface ComponentTypes {
    ErrorAccessDenied: typeof ErrorAccessDeniedComponent
  }
}
