import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";

const styles = (theme: ThemeType) => ({
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
});

const PeopleDirectorySkeletonUserCell = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {PeopleDirectorySkeletonTextCell} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.image} />
      <PeopleDirectorySkeletonTextCell />
    </div>
  );
}

const PeopleDirectorySkeletonUserCellComponent = registerComponent(
  "PeopleDirectorySkeletonUserCell",
  PeopleDirectorySkeletonUserCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectorySkeletonUserCell: typeof PeopleDirectorySkeletonUserCellComponent
  }
}
