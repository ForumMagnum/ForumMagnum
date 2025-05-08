import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useServerRequestStatus } from '../../lib/routeUtil'
import { isFriendlyUI } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : theme.palette.fonts.serifStack,
  },
});

const Error404Inner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const { SingleColumnSection } = Components;
  const serverRequestStatus = useServerRequestStatus()
  if (serverRequestStatus) serverRequestStatus.status = 404
  
  return (
    <SingleColumnSection className={classes.root}>
      <h2>404 Not Found</h2>
      <h3>Sorry, we couldn't find what you were looking for.</h3>
    </SingleColumnSection>
  );
};

const Error404Component = registerComponent('Error404', Error404Inner, {styles});

declare global {
  interface ComponentTypes {
    Error404: typeof Error404Component
  }
}
