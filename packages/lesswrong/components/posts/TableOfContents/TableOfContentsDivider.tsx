import React from 'react';
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

const TableOfContentsDivider = ({classes}: {
  classes: ClassesType,
}) => {
  return <div/>
}

const TableOfContentsDividerComponent = registerComponent('TableOfContentsDivider', TableOfContentsDivider, {styles});

declare global {
  interface ComponentTypes {
    TableOfContentsDivider: typeof TableOfContentsDividerComponent
  }
}

