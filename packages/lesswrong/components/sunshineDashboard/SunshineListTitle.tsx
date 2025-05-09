import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Typography } from "../common/Typography";

const styles = (theme: ThemeType) => ({
  root: {
    borderTop: theme.palette.border.normal,
    padding: 12,
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }
})

const SunshineListTitleInner = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return <Typography variant="body2" className={classes.root}>
    { children }
  </Typography>
};

export const SunshineListTitle = registerComponent('SunshineListTitle', SunshineListTitleInner, {styles});



