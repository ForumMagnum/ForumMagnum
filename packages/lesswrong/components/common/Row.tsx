import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles('Row', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
  }
}));

export const Row = ({justifyContent="space-between", alignItems="center", children, gap=0}: {
  alignItems?: "flex-start" | "flex-end" | "center" | "baseline" | "stretch",
  justifyContent?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly" | "stretch",
  children: React.ReactNode,
  gap?: number
}) => {
  const classes = useStyles(styles);
  return <div className={classes.root} style={{justifyContent, alignItems, gap}}>
    {children}
  </div>;
}

export default registerComponent('Row', Row);



