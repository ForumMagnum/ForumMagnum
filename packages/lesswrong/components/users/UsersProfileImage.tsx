import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import classNames from "classnames";

export type ProfileImageFallback = "initials";

const styles = (_: ThemeType): JssStyles => ({
  root: {
    borderRadius: "50%",
  },
});

const buildInitialFallback = (user: UsersMinimumInfo, size: number) => {
  const name = user.displayName.split(/\s/).map(encodeURIComponent).join("+")
  const actualSize = size * 2; // Allow for high-DPI screens
  return `https://ui-avatars.com/api/?name=${name}&size=${actualSize}`;
}

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
        width={size}
        height={size}
        imgProps={{q: "100"}}
        publicId={user.profileImageId}
        className={classNames(classes.root, className)}
      />
    );
  }

  if (fallback === "initials") {
    return (
      <picture>
        <img
          src={buildInitialFallback(user, size)}
          width={`${size}px`}
          height={`${size}px`}
          className={classNames(classes.root, className)}
        />
      </picture>
    );
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
