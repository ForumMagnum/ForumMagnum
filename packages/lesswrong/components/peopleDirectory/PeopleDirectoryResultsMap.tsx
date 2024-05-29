import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

export const PeopleDirectoryResultsMap = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
    </div>
  );
}

const PeopleDirectoryResultsMapComponent = registerComponent(
  "PeopleDirectoryResultsMap",
  PeopleDirectoryResultsMap,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryResultsMap: typeof PeopleDirectoryResultsMapComponent
  }
}
