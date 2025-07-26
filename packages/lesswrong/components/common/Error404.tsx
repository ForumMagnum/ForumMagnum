"use client";

import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { useServerRequestStatus } from '../../lib/routeUtil'
import { isFriendlyUI } from '../../themes/forumTheme';
import SingleColumnSection from "./SingleColumnSection";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('Error404', (theme: ThemeType) => ({
  root: {
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : theme.palette.fonts.serifStack,
  },
}));

const Error404 = () => {
  const classes = useStyles(styles);
  const serverRequestStatus = useServerRequestStatus()
  if (serverRequestStatus) serverRequestStatus.status = 404
  
  return (
    <SingleColumnSection className={classes.root}>
      <h2>404 Not Found</h2>
      <h3>Sorry, we couldn't find what you were looking for.</h3>
    </SingleColumnSection>
  );
};

export default registerComponent('Error404', Error404);


