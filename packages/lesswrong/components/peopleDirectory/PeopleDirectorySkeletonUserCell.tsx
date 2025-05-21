import React from "react";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { PeopleDirectorySkeletonTextCell } from "./PeopleDirectorySkeletonTextCell";

const styles = defineStyles('PeopleDirectorySkeletonUserCell', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  image: {
    backgroundColor: theme.palette.grey[300],
    borderRadius: "50%",
    minWidth: 32,
    width: 32,
    height: 32,
  },
}));

export const PeopleDirectorySkeletonUserCell = () => {
  const classes = useStyles(styles);
  return (
    <div className={classes.root}>
      <div className={classes.image} />
      <PeopleDirectorySkeletonTextCell />
    </div>
  );
}
