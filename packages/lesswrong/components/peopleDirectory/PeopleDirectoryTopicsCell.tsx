import React from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { textCellStyles } from "./PeopleDirectoryTextCell";

const styles = (theme: ThemeType) => ({
  root: {
    ...textCellStyles(theme),
  },
});

export const PeopleDirectoryTopicsCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  return (
    <div className={classes.root}>
      {user.tagNames?.map((topic, index) => (<React.Fragment key={index}>{topic}</React.Fragment>))}
    </div>
  );
}

const PeopleDirectoryTopicsCellComponent = registerComponent(
  "PeopleDirectoryTopicsCell",
  PeopleDirectoryTopicsCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryTopicsCell: typeof PeopleDirectoryTopicsCellComponent
  }
}
