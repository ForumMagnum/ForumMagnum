import React, { FC, memo } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import classNames from "classnames";
import rng from "../../lib/seedrandom";

export type ProfileImageFallback = "initials";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    borderRadius: "50%",
  },
  initalText: {
    color: "#222", // For both light and dark mode
    fill: "#222",
    lineHeight: 1,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
});

const COLOR_CUTOFF = 80;

const colorComponent = (rand: ReturnType<typeof rng>): number =>
  (Math.abs(rand.int32()) % (255 - COLOR_CUTOFF)) + COLOR_CUTOFF;

const userBackground = (displayName: string): string => {
  const rand = rng(displayName);
  const r = colorComponent(rand);
  const g = colorComponent(rand);
  const b = colorComponent(rand);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const InitialFallback: FC<{
  displayName: string,
  size: number,
  className?: string,
  classes: ClassesType,
}> = memo(({displayName, size, className, classes}) => {
  const initials = displayName.split(/[\s-_.]/).map(
    (s) => encodeURIComponent(s[0]).toUpperCase(),
  );
  const text = initials.join("").slice(0, 3);
  const background = userBackground(displayName);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width={`${size}px`}
      height={`${size}px`}
      viewBox={`0 0 ${size} ${size}`}
      className={classNames(classes.root, className)}
    >
      <rect
        fill={background}
        width={size}
        height={size}
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
      />
      <text
        className={classes.initalText}
        x="50%"
        y="50%"
        alignmentBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.45}
        fontWeight="600"
        dy=".1em"
        dominantBaseline="middle"
      >
        {text}
      </text>
    </svg>
  );
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
        <InitialFallback
          displayName={user.displayName}
          size={size}
          className={className}
          classes={classes}
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
