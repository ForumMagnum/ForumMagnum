import React, { CSSProperties } from 'react';
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("TableOfContentsDivider", (theme: ThemeType) => ({
  divider: {
    width: 80,
    marginBottom:theme.spacing.unit,
    marginRight: "auto",
    borderBottom: theme.palette.border.faint,
    paddingBottom: theme.spacing.unit,
    display:"block",
  }
}))
export type TableOfContentsDividerStyles = typeof styles;

const TableOfContentsDivider = ({ scaleStyling }: {
  scaleStyling?: CSSProperties
}) => {
  const classes = useStyles(styles);
  return <div className={classes.divider} style={scaleStyling}/>
}

const TableOfContentsDividerComponent = registerComponent('TableOfContentsDivider', TableOfContentsDivider);

declare global {
  interface ComponentTypes {
    TableOfContentsDivider: typeof TableOfContentsDividerComponent
  }
}

