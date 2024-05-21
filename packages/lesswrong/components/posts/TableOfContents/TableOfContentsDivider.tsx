import React, { CSSProperties } from 'react';
import { registerComponent } from "../../../lib/vulcan-lib";

const styles = (theme: ThemeType): JssStyles => ({
  divider: {
    width: 80,
    marginBottom:theme.spacing.unit,
    marginRight: "auto",
    borderBottom: theme.palette.border.faint,
    paddingBottom: theme.spacing.unit,
    display:"block",
  }
})

const TableOfContentsDivider = ({ offsetStyling, classes }: {
  offsetStyling?: CSSProperties
  classes: ClassesType,
}) => {
  return <div className={classes.divider} style={offsetStyling}/>
}

const TableOfContentsDividerComponent = registerComponent('TableOfContentsDivider', TableOfContentsDivider, {styles});

declare global {
  interface ComponentTypes {
    TableOfContentsDivider: typeof TableOfContentsDividerComponent
  }
}

