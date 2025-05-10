import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { Typography } from "../common/Typography";

const styles = (theme: ThemeType) => ({
  root: {
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: theme.spacing.unit,
    fontSize: ".85rem",
    lineHeight: "1.5em"
  }
})

const SidebarInfoInner = ({children, classes, className}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
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

export const SidebarInfo = registerComponent('SidebarInfo', SidebarInfoInner, {styles});



