import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { cellTextStyles } from "./PeopleDirectoryTextCell";

const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  name: {
    ...cellTextStyles(theme),
  },
});

export const PeopleDirectoryUserCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const {UsersProfileImage} = Components;
  return (
    <div className={classes.root}>
      <UsersProfileImage user={user} size={32} />
      <div className={classes.name}>{user.displayName}</div>
    </div>
  );
}

const PeopleDirectoryUserCellComponent = registerComponent(
  "PeopleDirectoryUserCell",
  PeopleDirectoryUserCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryUserCell: typeof PeopleDirectoryUserCellComponent
  }
}
