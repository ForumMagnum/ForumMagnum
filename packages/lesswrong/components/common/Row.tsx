import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
  }
});

export const Row = ({classes, justifyContent="space-between", alignItems="center", children, gap}: {
  classes: ClassesType<typeof styles>,
  alignItems?: "flex-start" | "flex-end" | "center" | "baseline" | "stretch",
  justifyContent?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly" | "stretch",
  gap?: number,
  children: React.ReactNode
}) => {
  return <div className={classes.root} style={{justifyContent, alignItems, gap: gap ? `${gap}px` : '0px'}}>
    {children}
  </div>;
}

const RowComponent = registerComponent('Row', Row, {styles});

declare global {
  interface ComponentTypes {
    Row: typeof RowComponent
  }
}

