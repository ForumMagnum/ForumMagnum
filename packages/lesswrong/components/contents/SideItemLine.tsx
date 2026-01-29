import classNames from 'classnames';
import React from 'react';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("SideItemLine", (theme: ThemeType) => ({
  sidebarInlineReactMobile: {
    display: "none",
    [theme.breakpoints.down('xs')]: {
      display: "block",
    },
    width: 13,
  },
  sidebarInlineReactMobileLine: {
    width: 4,
    left: 9,

    height: 24,
    position: "relative",
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
}))

const SideItemLine = ({colorClass}: {
  colorClass: string,
}) => {
  const classes = useStyles(styles);
  return <span className={classes.sidebarInlineReactMobile}>
    <div className={classNames(classes.sidebarInlineReactMobileLine, colorClass)} />
  </span>
}

export default SideItemLine;



