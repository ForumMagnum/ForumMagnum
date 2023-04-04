import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import classNames from "classnames";
import rng from "../../lib/seedrandom";

export type ProfileImageFallback = "initials";

const styles = (_: ThemeType): JssStyles => ({
  root: {
    borderRadius: "50%",
  },
});

const colorCutoff = 80;
const colorComponent = (rand: ReturnType<typeof rng>): number =>
  Math.abs(rand.int32()) % (255 - colorCutoff) + colorCutoff;

const userBackground = (displayName: string): string => {
  const rand = rng(displayName);
  const r = colorComponent(rand);
  const g = colorComponent(rand);
  const b = colorComponent(rand);
  return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const nameTransform = (s: string) => encodeURIComponent(s[0]);

const buildInitialFallbackSrc = (user: UsersMinimumInfo, size: number): string => {
  const api = "https://ui-avatars.com/api/";
  const name = user.displayName.split(/[\s-_\.]/).map(nameTransform).join("+");
  const actualSize = size * 2; // Allow for high-DPI screens
  const background = userBackground(user.displayName);
  return `${api}?name=${name}&size=${actualSize}&background=${background}&bold=true`;
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
          src={buildInitialFallbackSrc(user, size)}
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
