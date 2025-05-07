import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";

const styles = defineStyles('PeopleDirectorySkeletonTextCell', (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
  },
  line: {
    background: `linear-gradient(90deg, ${theme.palette.grey[300]} 0%, ${theme.palette.grey[200]} 100%)`,
    borderRadius: "3px",
    width: "100%",
    maxWidth: 136,
    height: 8,
  },
}));

export const PeopleDirectorySkeletonTextCell = ({lines = 1}: {
  lines?: number,
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      {Array.from(Array(lines).keys()).map((i) => (
        <div key={i} className={classes.line} />
      ))}
    </div>
  );
}
