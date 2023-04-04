import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import classNames from "classnames";

export type ProfileImageFallback = "initials";

const styles = (_: ThemeType): JssStyles => ({
  root: {
    borderRadius: "50%",
  },
});

const UsersProfileImage = ({user, size, fallback, className, classes}: {
  user: UsersMinimumInfo,
  size: number,
  fallback?: ProfileImageFallback,
  className?: string,
  classes: ClassesType,
}) => {
  if (user.profileImageId) {
    return (
      <Components.CloudinaryImage2
        height={size}
        width={size}
        imgProps={{q: "100"}}
        publicId={user.profileImageId}
        className={classNames(classes.root, className)}
      />
    );
  }

  if (fallback === "initials") {
    // TODO
  }

  return null;
}


const UsersProfileImageComponent = registerComponent(
  "UsersProfileImage",
  UsersProfileImage,
  {styles, stylePriority: -1},
);

declare global {
  interface ComponentTypes {
    UsersProfileImage: typeof UsersProfileImageComponent
  }
}
