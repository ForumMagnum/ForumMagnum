import React, { memo, ComponentType, MouseEventHandler } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import classNames from "classnames";
import SpeakerWaveIcon from "@heroicons/react/24/solid/SpeakerWaveIcon";
import BookmarkIcon from "@heroicons/react/24/solid/BookmarkIcon";
import StarIcon from "@heroicons/react/24/solid/StarIcon";
import UserIcon from "@heroicons/react/24/solid/UserIcon";
import LinkIcon from "@heroicons/react/24/solid/LinkIcon";
import BookmarkOutlineIcon from "@heroicons/react/24/outline/BookmarkIcon";
import StarOutlineIcon from "@heroicons/react/24/outline/StarIcon";
import MuiVolumeUpIcon from "@material-ui/icons/VolumeUp";
import MuiBookmarkIcon from "@material-ui/icons/Bookmark";
import MuiBookmarkBorderIcon from "@material-ui/icons/BookmarkBorder";
import MuiStarIcon from "@material-ui/icons/Star";
import MuiStarBorderIcon from "@material-ui/icons/StarBorder";
import MuiPersonIcon from "@material-ui/icons/Person";
import MuiLinkIcon from "@material-ui/icons/Link";
import { PinIcon } from "../icons/pinIcon";
import { StickyIcon } from "../icons/stickyIcon";
import useUIStyle from "../themes/useUIStyle";

/**
 * This exists to allow us to easily use different icon sets on different
 * forums. To add a new icon, add its name to `ForumIconName` and add an
 * icon component to each option in `ICONS`. `book` generally uses icons
 * from MaterialUI and `friendly` generally uses icons from HeroIcons.
 */
export type ForumIconName =
  "VolumeUp" |
  "Bookmark" |
  "BookmarkBorder" |
  "Star" |
  "StarBorder" |
  "User" |
  "Link" |
  "Pin";

const ICONS: Record<UIStyle, Record<ForumIconName, IconComponent>> = {
  book: {
    VolumeUp: MuiVolumeUpIcon,
    Bookmark: MuiBookmarkIcon,
    BookmarkBorder: MuiBookmarkBorderIcon,
    Star: MuiStarIcon,
    StarBorder: MuiStarBorderIcon,
    User: MuiPersonIcon,
    Link: MuiLinkIcon,
    Pin: StickyIcon,
  },
  friendly: {
    VolumeUp: SpeakerWaveIcon,
    Bookmark: BookmarkIcon,
    BookmarkBorder: BookmarkOutlineIcon,
    Star: StarIcon,
    StarBorder: StarOutlineIcon,
    User: UserIcon,
    Link: LinkIcon,
    Pin: PinIcon,
  },
};

export type IconProps = {
  className: string,
  onClick: MouseEventHandler<SVGElement>,
}

export type IconComponent = ComponentType<Partial<IconProps>>;

export const USE_FRIENDLY_ICONS = isEAForum; // TODO Delete this

const styles = (_: ThemeType): JssStyles => ({
  root: {
    userSelect: "none",
    width: "1em",
    height: "1em",
    display: "inline-block",
    flexShrink: 0,
    fontSize: 24,
  },
});

type ForumIconProps = Partial<IconProps> & {
  icon: ForumIconName,
  classes: ClassesType,
};

const ForumIcon = ({icon, className, classes, ...props}: ForumIconProps) => {
  const uiStyle = useUIStyle();
  const Icon = ICONS[uiStyle][icon];
  if (!Icon) {
    // eslint-disable-next-line no-console
    console.error(`Invalid ForumIcon name: ${icon}`);
    return null;
  }
  return <Icon className={classNames(classes.root, className)} {...props} />;
}

const ForumIconComponent = registerComponent("ForumIcon", memo(ForumIcon), {styles});

declare global {
  interface ComponentTypes {
    ForumIcon: typeof ForumIconComponent
  }
}
