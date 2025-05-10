import React, { FC, memo } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import classNames from "classnames";
import rng from "../../lib/seedrandom";
import { CloudinaryImage2 } from "../common/CloudinaryImage2";

export type ProfileImageFallback = "initials";

const styles = (theme: ThemeType) => ({
  root: {
    borderRadius: "50%",
  },
  wrapper: {
    display: "flex",
    alignItems: "center",
  },
  "@keyframes profile-image-loader": {
    "0%": {
      backgroundPosition: "right",
    },
  },
  loadingPlaceholder: {
    background: theme.palette.panelBackground.userProfileImageLoading,
    backgroundSize: "300% 100%",
    animation: "profile-image-loader 1s infinite",
  },
  initalText: {
    color: theme.palette.text.alwaysWhite, // For both light and dark mode
    fill: theme.palette.text.alwaysWhite,
    lineHeight: 1,
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
});

const MIN_HUE = 100;
const MAX_HUE = 360;
const MIN_SATURATION = 30;
const MAX_SATURATION = 65;
const MIN_LIGHTNESS = 38;
const MAX_LIGHTNESS = 40;

const randPercent = (rand: ReturnType<typeof rng>, min = 0, max = 100) =>
  (Math.abs(rand.int32()) % (max - min)) + min;

const userBackground = (displayName: string): string => {
  const rand = rng(displayName);
  const h = randPercent(rand, MIN_HUE, MAX_HUE);
  const s = randPercent(rand, MIN_SATURATION, MAX_SATURATION);
  const l = randPercent(rand, MIN_LIGHTNESS, MAX_LIGHTNESS);
  return `hsl(${h}deg ${s}% ${l}%)`;
}

const getTextSizeMultiplier = (text: string) => {
  switch (text.length) {
  case 1:  return 0.5;
  case 2:  return 0.45;
  default: return 0.34;
  }
}

const InitialFallback: FC<{
  displayName: string,
  size: number,
  className?: string,
  classes: ClassesType<typeof styles>,
}> = memo(({displayName, size, className, classes}) => {
  displayName ??= "";
  const initials = displayName
    .split(/[\s-_.()]/)
    .map((s) => s?.[0]?.toUpperCase())
    .filter((s) => s?.length && s?.match(/\p{L}/u));
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
        fontSize={size * getTextSizeMultiplier(text)}
        fontWeight="600"
        dy=".1em"
        dominantBaseline="middle"
      >
        {text}
      </text>
    </svg>
  );
});

export type UserWithProfileImage = {
  displayName: string | null,
  profileImageId?: string | null,
}

const UsersProfileImageInner = ({user, size, fallback="initials", className, classes}: {
  user?: UserWithProfileImage|null,
  size: number,
  fallback?: ProfileImageFallback,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  if (!user?.displayName) {
    return (
      <picture className={classes.wrapper}>
        <div
          className={classNames(
            classes.root,
            classes.loadingPlaceholder,
            className,
          )}
          style={{width: size, height: size}}
        />
      </picture>
    );
  }

  if (user.profileImageId) {
    return (
      <CloudinaryImage2
        width={size}
        height={size}
        imgProps={{q: "100", dpr: "2"}}
        publicId={user.profileImageId}
        className={classNames(
          classes.root,
          classes.loadingPlaceholder,
          className,
        )}
        wrapperClassName={classes.wrapper}
      />
    );
  }

  if (fallback === "initials") {
    return (
      <picture className={classes.wrapper}>
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

export const UsersProfileImage = registerComponent(
  "UsersProfileImage",
  UsersProfileImageInner,
  {styles, stylePriority: -1},
);


