import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Typography } from "@/components/common/Typography";

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[600],
    margin: theme.spacing.unit*2
  },
})

const NoContent = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return <Typography variant='body2' className={classes.root}>
    {children}
  </Typography>
}

const NoContentComponent = registerComponent('NoContent', NoContent, {styles});

declare global {
  interface ComponentTypes {
    NoContent: typeof NoContentComponent
  }
}

export default NoContentComponent;
