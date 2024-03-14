import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { PeopleDirectoryColumn } from "./peopleDirectoryColumns";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    fontSize: 14,
    fontWeight: 600,
    padding: "8px 6px",
  },
});

export const PeopleDirectoryHeading = ({column, classes}: {
  column: PeopleDirectoryColumn,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      {column.label}
    </div>
  );
}

const PeopleDirectoryHeadingComponent = registerComponent(
  "PeopleDirectoryHeading",
  PeopleDirectoryHeading,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryHeading: typeof PeopleDirectoryHeadingComponent
  }
}
