import { Components, registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import { useServerRequestStatus } from '../../lib/routeUtil'
import { isEAForum } from '../../lib/instanceSettings';
import { useCurrentUser } from './withUser';

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: isEAForum ? theme.palette.fonts.sansSerifStack : theme.palette.fonts.serifStack,
  },
});

const Error404 = ({classes}: {classes: ClassesType}) => {
  const { SingleColumnSection } = Components;
  const serverRequestStatus = useServerRequestStatus()
  const currentUser = useCurrentUser()
  if (serverRequestStatus) serverRequestStatus.status = 404

  if (!currentUser) {
    window.location.href = '/';
    return null;
  }

  return <SingleColumnSection className={classes.root}>
    <h2>404 Not Found</h2>
    <h3>Sorry, we couldn't find what you were looking for.</h3>
  </SingleColumnSection>
};

const Error404Component = registerComponent('Error404', Error404, {styles});

declare global {
  interface ComponentTypes {
    Error404: typeof Error404Component
  }
}
