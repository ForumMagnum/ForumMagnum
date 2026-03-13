import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Typography } from "./Typography";
import { defineStyles } from '@/components/hooks/defineStyles';

const styles = defineStyles('NoContent', (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[600],
    margin: 16
  },
}))

const NoContent = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return <Typography variant='body2' className={classes.root}>
    {children}
  </Typography>
}

export default registerComponent('NoContent', NoContent, {styles});


