import React, { memo, ComponentType, MouseEventHandler, CSSProperties } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import classNames from "classnames";
import SpeakerWaveIcon from "@heroicons/react/24/solid/SpeakerWaveIcon";
import BookmarkIcon from "@heroicons/react/24/solid/BookmarkIcon";
import StarIcon from "@heroicons/react/24/solid/StarIcon";
import StarOutlineIcon from "@heroicons/react/24/outline/StarIcon";
import UserIcon from "@heroicons/react/24/solid/UserIcon";
import BellIcon from "@heroicons/react/24/solid/BellIcon";
import LinkIcon from "@heroicons/react/20/solid/LinkIcon";
import BookmarkOutlineIcon from "@heroicons/react/24/outline/BookmarkIcon";
import PlusIcon from "@heroicons/react/20/solid/PlusIcon";
import PlusSmallIcon from "@heroicons/react/20/solid/PlusSmallIcon";
import MinusSmallIcon from "@heroicons/react/20/solid/MinusSmallIcon";
import BellOutlineIcon from "@heroicons/react/24/outline/BellIcon";
import CheckIcon from "@heroicons/react/20/solid/CheckIcon";
import CloseIcon from "@heroicons/react/24/solid/XMarkIcon";
import CalendarDaysIcon from "@heroicons/react/24/solid/CalendarDaysIcon";
import BriefcaseIcon from "@heroicons/react/24/solid/BriefcaseIcon";
import AcademicCapIcon from "@heroicons/react/24/solid/AcademicCapIcon";
import MapPinIcon from "@heroicons/react/24/solid/MapPinIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import CommentIcon from "@heroicons/react/24/outline/ChatBubbleLeftIcon";
import LightbulbIcon from "@heroicons/react/24/outline/LightBulbIcon";
import WarningIcon from "@heroicons/react/24/solid/ExclamationTriangleIcon";
import MuiVolumeUpIcon from "@material-ui/icons/VolumeUp";
import MuiBookmarkIcon from "@material-ui/icons/Bookmark";
import MuiBookmarkBorderIcon from "@material-ui/icons/BookmarkBorder";
import MuiBellBorderIcon from "@material-ui/icons/NotificationsNone";
import MuiStarIcon from "@material-ui/icons/Star";
import MuiStarBorderIcon from "@material-ui/icons/StarBorder";
import MuiPersonIcon from "@material-ui/icons/Person";
import MuiNotificationsIcon from '@material-ui/icons/Notifications';
import MuiLinkIcon from "@material-ui/icons/Link";
import MuiNotesIcon from "@material-ui/icons/Notes";
import MuiWarningIcon from "@material-ui/icons/Warning";
import MuiLocationIcon from "@material-ui/icons/LocationOn";
import { PinIcon } from "../icons/pinIcon";
import { AuthorIcon } from "../icons/authorIcon";
import { SproutIcon } from "../icons/sproutIcon";
import { StickyIcon } from "../icons/stickyIcon";
import { ThickChevronLeftIcon } from "../icons/thickChevronLeftIcon";
import { ThickChevronRightIcon } from "../icons/thickChevronRightIcon";
import { ThickChevronDownIcon } from "../icons/thickChevronDownIcon";
import { forumSelect, ForumOptions } from "../../lib/forumTypeUtils";
import { CardIcon } from "../icons/cardIcon";
import { ListIcon } from "../icons/listIcon";

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
  "BellBorder" |
  "Karma" |
  "KarmaOutline" |
  "Star" |
  "User" |
  "Bell" |
  "BellBorder" |
  "Link" |
  "Pin" |
  "Author" |
  "Sprout" |
  "Close" |
  "CalendarDays" |
  "Work" |
  "School" |
  "MapPin" |
  "Pencil" |
  "Comment" |
  "Shortform" |
  "Warning" |
  "ThickChevronLeft" |
  "ThickChevronRight" |
  "ThickChevronDown" |
  "Plus" |
  "Check" |
  "Card" |
  "List" |
  "PlusSmall" |
  "MinusSmall";

const ICONS: ForumOptions<Record<ForumIconName, IconComponent>> = {
  default: {
    VolumeUp: MuiVolumeUpIcon,
    Bookmark: MuiBookmarkIcon,
    BookmarkBorder: MuiBookmarkBorderIcon,
    BellBorder: MuiBellBorderIcon,
    Karma: MuiStarIcon,
    KarmaOutline: MuiStarBorderIcon,
    Star: MuiStarIcon,
    User: MuiPersonIcon,
    Bell: MuiNotificationsIcon,
    Link: MuiLinkIcon,
    Pin: StickyIcon,
    Author: AuthorIcon,
    Sprout: SproutIcon,
    Close: CloseIcon,
    CalendarDays: CalendarDaysIcon,
    Work: BriefcaseIcon,
    School: AcademicCapIcon,
    MapPin: MuiLocationIcon,
    Pencil: PencilIcon,
    Comment: CommentIcon,
    Shortform: MuiNotesIcon,
    Warning: MuiWarningIcon,
    ThickChevronLeft: ThickChevronLeftIcon,
    ThickChevronRight: ThickChevronRightIcon,
    ThickChevronDown: ThickChevronDownIcon,
    Plus: PlusIcon,
    PlusSmall: PlusSmallIcon,
    MinusSmall: MinusSmallIcon,
    Check: CheckIcon,
    Card: CardIcon,
    List: ListIcon,
  },
  EAForum: {
    VolumeUp: SpeakerWaveIcon,
    Bookmark: BookmarkIcon,
    BookmarkBorder: BookmarkOutlineIcon,
    BellBorder: BellOutlineIcon,
    Karma: StarIcon,
    KarmaOutline: StarOutlineIcon,
    Star: StarIcon,
    User: UserIcon,
    Bell: BellIcon,
    Link: LinkIcon,
    Pin: PinIcon,
    Author: AuthorIcon,
    Sprout: SproutIcon,
    Close: CloseIcon,
    CalendarDays: CalendarDaysIcon,
    Work: BriefcaseIcon,
    School: AcademicCapIcon,
    MapPin: MapPinIcon,
    Pencil: PencilIcon,
    Comment: CommentIcon,
    Shortform: LightbulbIcon,
    Warning: WarningIcon,
    ThickChevronLeft: ThickChevronLeftIcon,
    ThickChevronRight: ThickChevronRightIcon,
    ThickChevronDown: ThickChevronDownIcon,
    Plus: PlusIcon,
    PlusSmall: PlusSmallIcon,
    MinusSmall: MinusSmallIcon,
    Check: CheckIcon,
    Card: CardIcon,
    List: ListIcon,
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
