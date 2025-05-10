import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useServerRequestStatus } from '../../lib/routeUtil'
import { isFriendlyUI } from '../../themes/forumTheme';
import { SingleColumnSection } from "./SingleColumnSection";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : theme.palette.fonts.serifStack,
  },
});

const Error404Inner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const serverRequestStatus = useServerRequestStatus()
  if (serverRequestStatus) serverRequestStatus.status = 404
  
  return (
    <SingleColumnSection className={classes.root}>
      <h2>404 Not Found</h2>
      <h3>Sorry, we couldn't find what you were looking for.</h3>
    </SingleColumnSection>
  );
};

export const Error404 = registerComponent('Error404', Error404Inner, {styles});


