import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'

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
  return <Components.Typography
    component='span'
    className={classNames(classes.root, className)}
    variant='body2'
  >
    {children}
  </Components.Typography>
}

export const SidebarInfo = registerComponent('SidebarInfo', SidebarInfoInner, {styles});

declare global {
  interface ComponentTypes {
    SidebarInfo: typeof SidebarInfo
  }
}

