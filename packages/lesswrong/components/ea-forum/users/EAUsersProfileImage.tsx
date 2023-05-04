import React from "react";
import { registerComponent, Components } from "../../../lib/vulcan-lib";

const SIZE = 96;

const styles = (_theme: ThemeType): JssStyles => ({
  root: {
    marginBottom: 14,
    position: "relative",
    width: SIZE,
    height: SIZE,
  },
  hoverOver: {
    position: "absolute",
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.5)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    opacity: 0,
    "&:hover": {
      opacity: 1,
    },
  },
});

const EAUsersProfileImage = ({user, classes}: {
  user: UsersProfile,
  classes: ClassesType,
}) => {
  const {ForumIcon, UsersProfileImage} = Components;

  return (
    <div className={classes.root}>
      <div className={classes.hoverOver}>
        <ForumIcon icon="Pencil" />
      </div>
      <UsersProfileImage user={user} size={SIZE} />
    </div>
  );
}

const EAUsersProfileImageComponent = registerComponent(
  "EAUsersProfileImage",
  EAUsersProfileImage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAUsersProfileImage: typeof EAUsersProfileImageComponent
  }
}
