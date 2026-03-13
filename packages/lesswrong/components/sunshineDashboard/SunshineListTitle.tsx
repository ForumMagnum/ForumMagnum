import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';

const styles = defineStyles('SunshineListTitle', (theme: ThemeType) => ({
  root: {
    borderTop: theme.palette.border.normal,
    padding: 12,
    fontWeight: 600,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }
}))

const SunshineListTitle = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return <Typography variant="body2" className={classes.root}>
    { children }
  </Typography>
};

export default registerComponent('SunshineListTitle', SunshineListTitle, {styles});



