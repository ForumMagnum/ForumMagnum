import React, { memo, ComponentType, MouseEventHandler, CSSProperties } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";
import SpeakerWaveIcon from "@heroicons/react/24/solid/SpeakerWaveIcon";
import BookmarkIcon from "@heroicons/react/24/solid/BookmarkIcon";
import StarIcon from "@heroicons/react/24/solid/StarIcon";
import UserIcon from "@heroicons/react/24/solid/UserIcon";
import LinkIcon from "@heroicons/react/20/solid/LinkIcon";
import BookmarkOutlineIcon from "@heroicons/react/24/outline/BookmarkIcon";
import StarOutlineIcon from "@heroicons/react/24/outline/StarIcon";
import CloseIcon from "@heroicons/react/24/solid/XMarkIcon";
import CommentIcon from "@heroicons/react/24/outline/ChatBubbleLeftIcon";
import LightbulbIcon from "@heroicons/react/24/outline/LightBulbIcon";
import MuiVolumeUpIcon from "@material-ui/icons/VolumeUp";
import MuiBookmarkIcon from "@material-ui/icons/Bookmark";
import MuiBookmarkBorderIcon from "@material-ui/icons/BookmarkBorder";
import MuiStarIcon from "@material-ui/icons/Star";
import MuiStarBorderIcon from "@material-ui/icons/StarBorder";
import MuiPersonIcon from "@material-ui/icons/Person";
import MuiLinkIcon from "@material-ui/icons/Link";
import NotesIcon from '@material-ui/icons/Notes';
import { PinIcon } from "../icons/pinIcon";
import { StickyIcon } from "../icons/stickyIcon";
import { ThickChevronLeftIcon } from "../icons/thickChevronLeftIcon";
import { ThickChevronRightIcon } from "../icons/thickChevronRightIcon";
import { ThickChevronDownIcon } from "../icons/thickChevronDownIcon";
import { forumSelect, ForumOptions } from "../../lib/forumTypeUtils";

/**
 * This exists to allow us to easily use different icon sets on different
 * forums. To add a new icon, add its name to `ForumIconName` and add an
 * icon component to each option in `ICONS`. `default` generally uses icons
 * from MaterialUI and `EAForum` generally uses icons from HeroIcons.
 */
export type ForumIconName =
  "VolumeUp" |
  "Bookmark" |
  "BookmarkBorder" |
  "Star" |
  "StarBorder" |
  "User" |
  "Link" |
  "Pin" |
  "Close" |
  "Comment" |
  "Shortform" |
  "ThickChevronLeft" |
  "ThickChevronRight" |
  "ThickChevronDown";

const ICONS: ForumOptions<Record<ForumIconName, IconComponent>> = {
  default: {
    VolumeUp: MuiVolumeUpIcon,
    Bookmark: MuiBookmarkIcon,
    BookmarkBorder: MuiBookmarkBorderIcon,
    Star: MuiStarIcon,
    StarBorder: MuiStarBorderIcon,
    User: MuiPersonIcon,
    Link: MuiLinkIcon,
    Pin: StickyIcon,
    Close: CloseIcon,
    Comment: CommentIcon,
    Shortform: NotesIcon,
    ThickChevronLeft: ThickChevronLeftIcon,
    ThickChevronRight: ThickChevronRightIcon,
    ThickChevronDown: ThickChevronDownIcon,
  },
  EAForum: {
    VolumeUp: SpeakerWaveIcon,
    Bookmark: BookmarkIcon,
    BookmarkBorder: BookmarkOutlineIcon,
    Star: StarIcon,
    StarBorder: StarOutlineIcon,
    User: UserIcon,
    Link: LinkIcon,
    Pin: PinIcon,
    Close: CloseIcon,
    Comment: CommentIcon,
    Shortform: LightbulbIcon,
    ThickChevronLeft: ThickChevronLeftIcon,
    ThickChevronRight: ThickChevronRightIcon,
    ThickChevronDown: ThickChevronDownIcon,
  },
};

// This is a map from forum types to icon names to keys in the `styles` object.
const CUSTOM_CLASSES: ForumOptions<Partial<Record<ForumIconName, string>>> = {
  default: {
    Link: "linkRotation",
  },
  EAForum: {
  },
};

export type IconProps = {
  className: string,
  onClick: MouseEventHandler<SVGElement>,
}

export type IconComponent = ComponentType<Partial<IconProps>>;

const styles = (_: ThemeType): JssStyles => ({
  root: {
    userSelect: "none",
    width: "1em",
    height: "1em",
    display: "inline-block",
    flexShrink: 0,
    fontSize: 24,
  },
  linkRotation: {
    transform: "rotate(-45deg)",
  },
});

type ForumIconProps = Partial<IconProps> & {
  icon: ForumIconName,
  classes: ClassesType,
  style?: CSSProperties,
};

const ForumIcon = ({icon, className, classes, ...props}: ForumIconProps) => {
  const icons = forumSelect(ICONS);
  const Icon = icons[icon] ?? ICONS.default[icon];
  if (!Icon) {
    // eslint-disable-next-line no-console
    console.error(`Invalid ForumIcon name: ${icon}`);
    return null;
  }

  const customClassKey = forumSelect(CUSTOM_CLASSES)[icon];
  const customClass = customClassKey ? classes[customClassKey] : undefined;

  return <Icon className={classNames(classes.root, customClass, className)} {...props} />;
}

const ForumIconComponent = registerComponent("ForumIcon", memo(ForumIcon), {
  styles,
  stylePriority: -1,
});

declare global {
  interface ComponentTypes {
    ForumIcon: typeof ForumIconComponent
  }
}
