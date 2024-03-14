import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (_theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  name: {
    fontSize: 14,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
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
