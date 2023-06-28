import React, { memo, ComponentType, MouseEventHandler, CSSProperties } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { forumSelect, ForumOptions } from "../../lib/forumTypeUtils";
import classNames from "classnames";
import SpeakerWaveIcon from "@heroicons/react/24/outline/SpeakerWaveIcon";
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
import CommentIcon from "@heroicons/react/24/outline/ChatBubbleLeftIcon";
import CommentFilledIcon from "@heroicons/react/24/solid/ChatBubbleLeftIcon";
import LightbulbIcon from "@heroicons/react/24/outline/LightBulbIcon";
import WarningIcon from "@heroicons/react/24/solid/ExclamationTriangleIcon";
import ReportIcon from "@heroicons/react/24/outline/ExclamationCircleIcon";
import TagIcon from "@heroicons/react/24/outline/TagIcon";
import EyeOutlineIcon from "@heroicons/react/24/outline/EyeIcon";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import SettingsIcon from "@heroicons/react/24/solid/Cog6ToothIcon";
import EmailIcon from "@heroicons/react/24/solid/EnvelopeIcon";
import PuzzleIcon from "@heroicons/react/24/solid/PuzzlePieceIcon";
import EllipsisVerticalIcon from "@heroicons/react/20/solid/EllipsisVerticalIcon";
import ShareIcon from "@heroicons/react/24/outline/ArrowUpTrayIcon";
import ClipboardDocumentListIcon from "@heroicons/react/24/outline/ClipboardDocumentListIcon";
import ClipboardDocumentIcon from "@heroicons/react/24/outline/ClipboardDocumentIcon";
import QuestionMarkCircleIcon from "@heroicons/react/24/outline/QuestionMarkCircleIcon";
import MuiVolumeUpIcon from "@material-ui/icons/VolumeUp";
import MuiBookmarkIcon from "@material-ui/icons/Bookmark";
import MuiBookmarkBorderIcon from "@material-ui/icons/BookmarkBorder";
import MuiBookmarksIcon from "@material-ui/icons/Bookmarks";
import MuiBellBorderIcon from "@material-ui/icons/NotificationsNone";
import MuiStarIcon from "@material-ui/icons/Star";
import MuiStarBorderIcon from "@material-ui/icons/StarBorder";
import MuiPersonIcon from "@material-ui/icons/Person";
import MuiNotificationsIcon from '@material-ui/icons/Notifications';
import MuiLinkIcon from "@material-ui/icons/Link";
import MuiTagIcon from "@material-ui/icons/LocalOfferOutlined";
import MuiReportIcon from "@material-ui/icons/ReportOutlined";
import MuiVisibilityOff from "@material-ui/icons/VisibilityOff";
import MuiVisibility from "@material-ui/icons/Visibility";
import MuiEditIcon from "@material-ui/icons/Edit";
import MuiShowChartIcon from "@material-ui/icons/ShowChart";
import MuiNotesIcon from "@material-ui/icons/Notes";
import MuiWarningIcon from "@material-ui/icons/Warning";
import MuiLocationIcon from "@material-ui/icons/LocationOn";
import MuiSettingsIcon from "@material-ui/icons/Settings";
import MuiEmailIcon from "@material-ui/icons/Email";
import MuiPuzzleIcon from "@material-ui/icons/Extension";
import MuiCheckIcon from "@material-ui/icons/Check";
import MuiEllipsisVerticalIcon from "@material-ui/icons/MoreVert";
import MuiShareIcon from "@material-ui/icons/Share";

/**
 * ForumIcon can be used with custom SVG elements but you MUST pass through
 * the props using React.HTMLAttributes otherwise you will have bugs. See the
 * files below for examples
 */
import { PinIcon } from "../icons/pinIcon";
import { AuthorIcon } from "../icons/authorIcon";
import { SproutIcon } from "../icons/sproutIcon";
import { StickyIcon } from "../icons/stickyIcon";
import { ThickChevronLeftIcon } from "../icons/thickChevronLeftIcon";
import { ThickChevronRightIcon } from "../icons/thickChevronRightIcon";
import { ThickChevronDownIcon } from "../icons/thickChevronDownIcon";
import { CardIcon } from "../icons/cardIcon";
import { ListIcon } from "../icons/listIcon";
import { AddEmojiIcon } from "../icons/addEmoji";
import { SoftUpArrowIcon } from "../icons/softUpArrowIcon";

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
  "Bookmarks" |
  "Karma" |
  "KarmaOutline" |
  "Star" |
  "User" |
  "Bell" |
  "BellBorder" |
  "AddEmoji" |
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
  "CommentFilled" |
  "Shortform" |
  "Warning" |
  "Report" |
  "Eye" |
  "EyeOutline" |
  "Tag" |
  "Edit" |
  "Analytics" |
  "ThickChevronLeft" |
  "ThickChevronRight" |
  "ThickChevronDown" |
  "Plus" |
  "Check" |
  "Card" |
  "List" |
  "PlusSmall" |
  "MinusSmall" |
  "Settings" |
  "Email" |
  "Puzzle" |
  "SoftUpArrow" |
  "EllipsisVertical" |
  "Share" |
  "ClipboardDocumentList" |
  "ClipboardDocument" |
  "QuestionMarkCircle";

const ICONS: ForumOptions<Record<ForumIconName, IconComponent>> = {
  default: {
    VolumeUp: MuiVolumeUpIcon,
    Bookmark: MuiBookmarkIcon,
    BookmarkBorder: MuiBookmarkBorderIcon,
    Bookmarks: MuiBookmarksIcon,
    Karma: MuiStarIcon,
    KarmaOutline: MuiStarBorderIcon,
    Star: MuiStarIcon,
    User: MuiPersonIcon,
    Bell: MuiNotificationsIcon,
    BellBorder: MuiBellBorderIcon,
    AddEmoji: AddEmojiIcon,
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
    CommentFilled: CommentFilledIcon,
    Shortform: MuiNotesIcon,
    Warning: MuiWarningIcon,
    Report: MuiReportIcon,
    Tag: MuiTagIcon,
    Eye: MuiVisibility,
    EyeOutline: MuiVisibilityOff,
    Edit: MuiEditIcon,
    Analytics: MuiShowChartIcon,
    ThickChevronLeft: ThickChevronLeftIcon,
    ThickChevronRight: ThickChevronRightIcon,
    ThickChevronDown: ThickChevronDownIcon,
    Plus: PlusIcon,
    PlusSmall: PlusSmallIcon,
    MinusSmall: MinusSmallIcon,
    Settings: MuiSettingsIcon,
    Email: MuiEmailIcon,
    Puzzle: MuiPuzzleIcon,
    Check: MuiCheckIcon,
    Card: CardIcon,
    List: ListIcon,
    SoftUpArrow: SoftUpArrowIcon,
    EllipsisVertical: MuiEllipsisVerticalIcon,
    Share: MuiShareIcon,
    ClipboardDocumentList: ClipboardDocumentListIcon,
    ClipboardDocument: ClipboardDocumentIcon,
    QuestionMarkCircle: QuestionMarkCircleIcon,
  },
  EAForum: {
    VolumeUp: SpeakerWaveIcon,
    Bookmark: BookmarkIcon,
    BookmarkBorder: BookmarkOutlineIcon,
    Bookmarks: BookmarkIcon,
    Karma: StarIcon,
    KarmaOutline: StarOutlineIcon,
    Star: StarIcon,
    User: UserIcon,
    Bell: BellIcon,
    BellBorder: BellOutlineIcon,
    AddEmoji: AddEmojiIcon,
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
    CommentFilled: CommentFilledIcon,
    Shortform: LightbulbIcon,
    Warning: WarningIcon,
    Report: ReportIcon,
    Tag: TagIcon,
    Eye: EyeIcon,
    EyeOutline: EyeOutlineIcon,
    Edit: PencilIcon,
    Analytics: MuiShowChartIcon,
    ThickChevronLeft: ThickChevronLeftIcon,
    ThickChevronRight: ThickChevronRightIcon,
    ThickChevronDown: ThickChevronDownIcon,
    Plus: PlusIcon,
    PlusSmall: PlusSmallIcon,
    MinusSmall: MinusSmallIcon,
    Settings: SettingsIcon,
    Email: EmailIcon,
    Puzzle: PuzzleIcon,
    Check: CheckIcon,
    Card: CardIcon,
    List: ListIcon,
    SoftUpArrow: SoftUpArrowIcon,
    EllipsisVertical: EllipsisVerticalIcon,
    Share: ShareIcon,
    ClipboardDocumentList: ClipboardDocumentListIcon,
    ClipboardDocument: ClipboardDocumentIcon,
    QuestionMarkCircle: QuestionMarkCircleIcon,
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
    '&.MuiListItemIcon-root': {
      marginRight: 12
    }
  },
});

type ForumIconProps = Partial<IconProps> & {
  icon: ForumIconName,
  noDefaultStyles?: boolean,
  classes: ClassesType,
  style?: CSSProperties,
};

const ForumIcon = ({
  icon,
  noDefaultStyles,
  className,
  classes,
  ...props
}: ForumIconProps) => {
  const icons = forumSelect(ICONS);
  const Icon = icons[icon] ?? ICONS.default[icon];
  if (!Icon) {
    // eslint-disable-next-line no-console
    console.error(`Invalid ForumIcon name: ${icon}`);
    return null;
  }

  const customClassKey = forumSelect(CUSTOM_CLASSES)[icon];
  const customClass = customClassKey ? classes[customClassKey] : undefined;
  const fullClassName = classNames(className, {
    [classes.root]: !noDefaultStyles,
    [customClass]: !noDefaultStyles && customClass,
  });

  return <Icon className={fullClassName} {...props} />;
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
