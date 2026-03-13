import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { Typography } from "../common/Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('SidebarInfo', (theme: ThemeType) => ({
  root: {
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: 8,
    fontSize: ".85rem",
    lineHeight: "1.5em"
  }
}))

const SidebarInfo = ({children, className}: {
  children: React.ReactNode,
  className?: string,
}) => {
  const classes = useStyles(styles);

  return <Typography
    component='span'
    className={classNames(classes.root, className)}
    variant='body2'
  >
    {children}
  </Typography>
}

export default SidebarInfo;



