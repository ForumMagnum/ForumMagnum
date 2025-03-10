import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
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
});

const PeopleDirectorySkeletonTextCell = ({lines = 1, classes}: {
  lines?: number,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      {Array.from(Array(lines).keys()).map((i) => (
        <div key={i} className={classes.line} />
      ))}
    </div>
  );
}

const PeopleDirectorySkeletonTextCellComponent = registerComponent(
  "PeopleDirectorySkeletonTextCell",
  PeopleDirectorySkeletonTextCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectorySkeletonTextCell: typeof PeopleDirectorySkeletonTextCellComponent
  }
}
