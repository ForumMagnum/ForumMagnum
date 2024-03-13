import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {
  },
});

export const PeopleDirectoryPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      <div>People directory</div>
    </div>
  );
}

const PeopleDirectoryPageComponent = registerComponent(
  "PeopleDirectoryPage",
  PeopleDirectoryPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryPage: typeof PeopleDirectoryPageComponent
  }
}
