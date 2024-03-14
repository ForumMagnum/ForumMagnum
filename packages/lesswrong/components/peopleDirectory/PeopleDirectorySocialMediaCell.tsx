import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

export const PeopleDirectorySocialMediaCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  // TODO: Export linked/facebook/twitter/github URLs to elasticsearch
  return (
    <div className={classes.root}>
      sm
    </div>
  );
}

const PeopleDirectorySocialMediaCellComponent = registerComponent(
  "PeopleDirectorySocialMediaCell",
  PeopleDirectorySocialMediaCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectorySocialMediaCell: typeof PeopleDirectorySocialMediaCellComponent
  }
}
