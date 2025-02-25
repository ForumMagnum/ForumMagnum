import React, { CSSProperties } from 'react';
import { registerComponent } from "../../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
  divider: {
    width: 80,
    marginBottom:theme.spacing.unit,
    marginRight: "auto",
    borderBottom: theme.palette.border.faint,
    paddingBottom: theme.spacing.unit,
    display:"block",
  }
})

const TableOfContentsDivider = ({ scaleStyling, classes }: {
  scaleStyling?: CSSProperties
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.divider} style={scaleStyling}/>
}

const TableOfContentsDividerComponent = registerComponent('TableOfContentsDivider', TableOfContentsDivider, {styles});

declare global {
  interface ComponentTypes {
    TableOfContentsDivider: typeof TableOfContentsDividerComponent
  }
}

