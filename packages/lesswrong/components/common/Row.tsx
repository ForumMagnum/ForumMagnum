import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
  }
});

export const RowInner = ({classes, justifyContent="space-between", alignItems="center", children}: {
  classes: ClassesType<typeof styles>,
  alignItems?: "flex-start" | "flex-end" | "center" | "baseline" | "stretch",
  justifyContent?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly" | "stretch",
  children: React.ReactNode
}) => {
  return <div className={classes.root} style={{justifyContent, alignItems}}>
    {children}
  </div>;
}

export const Row = registerComponent('Row', RowInner, {styles});



