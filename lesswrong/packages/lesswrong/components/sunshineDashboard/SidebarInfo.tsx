import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { Typography } from "@/components/common/Typography";

const styles = (theme: ThemeType) => ({
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

const SidebarInfoComponent = registerComponent('SidebarInfo', SidebarInfo, {styles});

declare global {
  interface ComponentTypes {
    SidebarInfo: typeof SidebarInfoComponent
  }
}

export default SidebarInfoComponent;

