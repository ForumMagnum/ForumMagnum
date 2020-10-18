import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: theme.spacing.unit,
    fontSize: ".85rem",
    lineHeight: "1.5em"
  }
})

const SidebarInfo = ({children, classes, className}: {
  children: React.ReactNode,
  classes: ClassesType,
  className?: string,
}) => {
  return <Typography
    component='span'
    className={classNames(classes.root, className)}
    variant='body2'
  >
    {children}
  </Typography>
}

const SidebarInfoComponent = registerComponent('SidebarInfo', SidebarInfo, {styles});

declare global {
  interface ComponentTypes {
    SidebarInfo: typeof SidebarInfoComponent
  }
}

