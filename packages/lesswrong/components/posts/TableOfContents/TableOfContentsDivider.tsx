import React, { CSSProperties } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("TableOfContentsDivider", (theme: ThemeType) => ({
  divider: {
    width: 80,
    marginBottom:8,
    marginRight: "auto",
    borderBottom: theme.palette.border.faint,
    paddingBottom: 8,
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

export default TableOfContentsDivider;



