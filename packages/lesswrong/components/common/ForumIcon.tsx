import React, { ComponentType, MouseEventHandler, CSSProperties } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { forumSelect, ForumOptions } from "../../lib/forumTypeUtils";
import classNames from "classnames";
import { SpeakerWaveIcon } from "../icons/speakerWaveIcon";
import BookmarkIcon from "@heroicons/react/24/solid/BookmarkIcon";
import SparklesIcon from "@heroicons/react/24/solid/SparklesIcon";
import StarIcon from "@heroicons/react/24/solid/StarIcon";
import StarOutlineIcon from "@heroicons/react/24/outline/StarIcon";
import UserIcon from "@heroicons/react/24/solid/UserIcon";
import UserOutlineIcon from "@heroicons/react/24/outline/UserIcon";
import UserCircleIcon from "@heroicons/react/24/outline/UserCircleIcon";
import UsersIcon from "@heroicons/react/24/solid/UsersIcon";
import UsersOutlineIcon from "@heroicons/react/24/outline/UsersIcon";
import GiftIcon from "@heroicons/react/24/solid/GiftIcon";
import BellIcon from "@heroicons/react/24/solid/BellIcon";
import BellAlertIcon from "@heroicons/react/24/solid/BellAlertIcon";
import LinkIcon from "@heroicons/react/20/solid/LinkIcon";
import BookmarkOutlineIcon from "@heroicons/react/24/outline/BookmarkIcon";
import PlusIcon from "@heroicons/react/20/solid/PlusIcon";
import PlusSmallIcon from "@heroicons/react/20/solid/PlusSmallIcon";
import MinusSmallIcon from "@heroicons/react/20/solid/MinusSmallIcon";
import HeartIcon from "@heroicons/react/24/solid/HeartIcon";
import HeartOutlineIcon from "@heroicons/react/24/outline/HeartIcon";
import BellOutlineIcon from "@heroicons/react/24/outline/BellIcon";
import CheckIcon from "@heroicons/react/20/solid/CheckIcon";
import CheckCircleIcon from "@heroicons/react/20/solid/CheckCircleIcon";
import ChevronLeftIcon from "@heroicons/react/24/solid/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/react/24/solid/ChevronRightIcon";
import CloseIcon from "@heroicons/react/24/solid/XMarkIcon";
import ClockIcon from "@heroicons/react/24/outline/ClockIcon";
import NoSymbolIcon from "@heroicons/react/24/solid/NoSymbolIcon";
import CalendarIcon from "@heroicons/react/24/solid/CalendarIcon";
import CalendarDaysIcon from "@heroicons/react/24/solid/CalendarDaysIcon";
import BriefcaseIcon from "@heroicons/react/24/solid/BriefcaseIcon";
import AcademicCapIcon from "@heroicons/react/24/solid/AcademicCapIcon";
import MapPinIcon from "@heroicons/react/24/solid/MapPinIcon";
import MapIcon from "@heroicons/react/24/outline/MapIcon";
import CommentIcon from "@heroicons/react/24/outline/ChatBubbleLeftIcon";
import CommentFilledIcon from "@heroicons/react/24/solid/ChatBubbleLeftIcon";
import ChatBubbleLeftRightIcon from "@heroicons/react/24/outline/ChatBubbleLeftRightIcon";
import ChatBubbleLeftRightFilledIcon from "@heroicons/react/24/solid/ChatBubbleLeftRightIcon";
import LightbulbIcon from "@heroicons/react/24/outline/LightBulbIcon";
import WarningIcon from "@heroicons/react/24/solid/ExclamationTriangleIcon";
import ReportIcon from "@heroicons/react/24/outline/ExclamationCircleIcon";
import ListBulletIcon from "@heroicons/react/24/outline/ListBulletIcon";
import TagIcon from "@heroicons/react/24/outline/TagIcon";
import TagFilledIcon from "@heroicons/react/24/solid/TagIcon";
import EyeOutlineIcon from "@heroicons/react/24/outline/EyeIcon";
import EyeIcon from "@heroicons/react/24/solid/EyeIcon";
import EyeSlashIcon from "@heroicons/react/24/solid/EyeSlashIcon";
import PencilIcon from "@heroicons/react/24/solid/PencilIcon";
import PencilSquareIcon from "@heroicons/react/24/outline/PencilSquareIcon";
import SettingsIcon from "@heroicons/react/24/outline/Cog6ToothIcon";
import EnvelopeIcon from "@heroicons/react/24/outline/EnvelopeIcon";
import EmailIcon from "@heroicons/react/24/solid/EnvelopeIcon";
import PhotoIcon from "@heroicons/react/24/outline/PhotoIcon";
import DocumentTextIcon from "@heroicons/react/24/outline/DocumentTextIcon";
import DocumentIcon from "@heroicons/react/24/solid/DocumentIcon";
import PuzzleIcon from "@heroicons/react/24/solid/PuzzlePieceIcon";
import ChartBarIcon from "@heroicons/react/24/solid/ChartBarIcon";
import ChartBarOutlineIcon from "@heroicons/react/24/outline/ChartBarIcon";
import EllipsisVerticalIcon from "@heroicons/react/20/solid/EllipsisVerticalIcon";
import ShareIcon from "@heroicons/react/24/outline/ArrowUpTrayIcon";
import ClipboardDocumentListIcon from "@heroicons/react/24/outline/ClipboardDocumentListIcon";
import ClipboardDocumentIcon from "@heroicons/react/24/outline/ClipboardDocumentIcon";
import QuestionMarkCircleIcon from "@heroicons/react/24/outline/QuestionMarkCircleIcon";
import QuestionMarkCircleFilledIcon from "@heroicons/react/24/solid/QuestionMarkCircleIcon";
import SearchIcon from "@heroicons/react/24/outline/MagnifyingGlassIcon";
import ArrowLongDown from "@heroicons/react/20/solid/ArrowLongDownIcon";
import ArrowLongUp from "@heroicons/react/20/solid/ArrowLongUpIcon";
import BookOpenIcon from "@heroicons/react/24/outline/BookOpenIcon";
import ComputerDesktopIcon from "@heroicons/react/24/outline/ComputerDesktopIcon";
import ArrowRightIcon from "@heroicons/react/24/solid/ArrowRightIcon";
import ArrowRightOutlineIcon from "@heroicons/react/24/outline/PaperAirplaneIcon";
import ArrowLeftIcon from "@heroicons/react/24/solid/ArrowLeftIcon";
import ArrowCircleIcon from "@heroicons/react/20/solid/ArrowPathRoundedSquareIcon";
import FunnelIcon from "@heroicons/react/24/outline/FunnelIcon";
import BarsArrowDown from "@heroicons/react/24/outline/BarsArrowDownIcon";
import Bars3 from "@heroicons/react/24/outline/Bars3Icon";
import ViewColumnsIcon from "@heroicons/react/24/outline/ViewColumnsIcon";
import InformationCircleIcon from '@heroicons/react/24/solid/InformationCircleIcon';
import ArrowDownOnSquareIcon from '@heroicons/react/24/outline/ArrowDownOnSquareIcon';
import ArrowDownRightIcon from '@heroicons/react/24/outline/ArrowDownRightIcon';
import ChevronUpDownIcon from "@heroicons/react/24/outline/ChevronUpDownIcon";
import ArrowsUpDownIcon from "@heroicons/react/20/solid/ArrowsUpDownIcon";
import MuiBookmarkIcon from "@/lib/vendor/@material-ui/icons/src/Bookmark";
import MuiBookmarkBorderIcon from "@/lib/vendor/@material-ui/icons/src/BookmarkBorder";
import MuiBookmarksIcon from "@/lib/vendor/@material-ui/icons/src/Bookmarks";
import MuiBellBorderIcon from "@/lib/vendor/@material-ui/icons/src/NotificationsNone";
import MuiStarIcon from "@/lib/vendor/@material-ui/icons/src/Star";
import MuiStarBorderIcon from "@/lib/vendor/@material-ui/icons/src/StarBorder";
import MuiPersonIcon from "@/lib/vendor/@material-ui/icons/src/Person";
import MuiPeopleIcon from "@/lib/vendor/@material-ui/icons/src/People";
import MuiNotificationsIcon from '@/lib/vendor/@material-ui/icons/src/Notifications';
import MuiLinkIcon from "@/lib/vendor/@material-ui/icons/src/Link";
import MuiTagIcon from "@/lib/vendor/@material-ui/icons/src/LocalOfferOutlined";
import MuiReportIcon from "@/lib/vendor/@material-ui/icons/src/ReportOutlined";
import MuiVisibilityOff from "@/lib/vendor/@material-ui/icons/src/VisibilityOff";
import MuiVisibility from "@/lib/vendor/@material-ui/icons/src/Visibility";
import MuiEditIcon from "@/lib/vendor/@material-ui/icons/src/Edit";
import MuiShowChartIcon from "@/lib/vendor/@material-ui/icons/src/ShowChart";
import MuiNotesIcon from "@/lib/vendor/@material-ui/icons/src/Notes";
import MuiWarningIcon from "@/lib/vendor/@material-ui/icons/src/Warning";
import MuiLocationIcon from "@/lib/vendor/@material-ui/icons/src/LocationOn";
import MuiSettingsIcon from "@/lib/vendor/@material-ui/icons/src/Settings";
import MuiEmailIcon from "@/lib/vendor/@material-ui/icons/src/Email";
import MuiPuzzleIcon from "@/lib/vendor/@material-ui/icons/src/Extension";
import MuiCheckIcon from "@/lib/vendor/@material-ui/icons/src/Check";
import MuiEllipsisVerticalIcon from "@/lib/vendor/@material-ui/icons/src/MoreVert";
import MuiShareIcon from "@/lib/vendor/@material-ui/icons/src/Share";
import MuiSearchIcon from '@/lib/vendor/@material-ui/icons/src/Search';
import MuiMenuIcon from "@/lib/vendor/@material-ui/icons/src/Menu";
import MuiForumIcon from '@/lib/vendor/@material-ui/icons/src/Forum';
import MuiVoteIcon from '@/lib/vendor/@material-ui/icons/src/HowToVote'
import MuiNotInterestedIcon from '@/lib/vendor/@material-ui/icons/src/NotInterested';
import MuiExpandMoreIcon from "@/lib/vendor/@material-ui/icons/src/ExpandMore";
import MuiExpandLessIcon from "@/lib/vendor/@material-ui/icons/src/ExpandLess";
import MuiPlaylistAddIcon from "@/lib/vendor/@material-ui/icons/src/PlaylistAdd";
import PlusOneIcon from '@/lib/vendor/@material-ui/icons/src/PlusOne';
import MuiReplayIcon from "@/lib/vendor/@material-ui/icons/src/Replay";
import UndoIcon from '@/lib/vendor/@material-ui/icons/src/Undo';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import FullscreenIcon from '@/lib/vendor/@material-ui/icons/src/Fullscreen';
import FullscreenExitIcon from '@/lib/vendor/@material-ui/icons/src/FullscreenExit';
import MuiArrowDownRightIcon from '@/lib/vendor/@material-ui/icons/src/SubdirectoryArrowRight';
import MuiDragIndicatorIcon from '@/lib/vendor/@material-ui/icons/src/DragIndicator';
import MuiNoteAddOutlinedIcon from '@/lib/vendor/@material-ui/icons/src/NoteAddOutlined';
import ThumbsUpIcon from '@/lib/vendor/@material-ui/icons/src/ThumbUp';
import ThumbUpOutlineIcon from '@/lib/vendor/@material-ui/icons/src/ThumbUpOutlined';

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
import { MenuIcon } from "../icons/menuIcon";
import { CloseMenuIcon } from "../icons/closeMenuIcon";
import { BoldLinkIcon } from "../icons/boldLink";
import { QIcon } from "../icons/qIcon";
import { FilterAlt } from "../icons/filteralt";
import { VotedIcon } from "../icons/votedIcon";
import { LightbulbChatIcon } from "../icons/lightbulbChatIcon";
import { AddReactionIcon } from "../icons/AddReactionIcon";
import { LabBeakerIcon } from "../icons/LabBeakerIcon";
import { SparkleIcon } from "../icons/sparkleIcon";
import { ListViewIcon } from "../icons/ListViewIcon";
import { CardViewIcon } from "../icons/CardViewIcon";
import { CheckSmallIcon } from "../icons/CheckSmallIcon";
import { FilterBarsIcon } from "../icons/FilterBarsIcon";
import { EAEnvelopeIcon } from "../icons/EAEnvelopeIcon";
import { RobotIcon } from '../icons/RobotIcon';
import { TickReactionIcon } from "../icons/reactions/TickReactionIcon";
import { CrossReactionIcon } from "../icons/reactions/CrossReactionIcon";
import { CrossReactionCapIcon } from "../icons/CrossReactionCapIcon";
import { GivingHandIcon } from "../icons/GivingHandIcon";
import { DictionaryIcon } from "../icons/Dictionary";
import { QuestionMarkIcon } from "../icons/QuestionMarkIcon";
import { defineStyles, useStyles } from "../hooks/useStyles";

/**
 * This exists to allow us to easily use different icon sets on different
 * forums. To add a new icon, add its name to `ForumIconName` and add an
 * icon component to each option in `ICONS`. `default` generally uses icons
 * from MaterialUI and `EAForum` generally uses icons from HeroIcons.
 */
export type ForumIconName =
  "VolumeUp" |
  "GivingHand" |
  "BookOpen" |
  "Bookmark" |
  "BookmarkBorder" |
  "Bookmarks" |
  "Sparkles" |
  "Karma" |
  "KarmaOutline" |
  "Star" |
  "User" |
  "UserOutline" |
  "UserCircle" |
  "Users" |
  "UsersOutline" |
  "Gift" |
  "Bell" |
  "BellAlert" |
  "BellBorder" |
  "AddEmoji" |
  "Link" |
  "BoldLink" |
  "Pin" |
  "Author" |
  "Sprout" |
  "Close" |
  "Clock" |
  "No" |
  "Calendar" |
  "CalendarDays" |
  "Work" |
  "School" |
  "MapPin" |
  "Map" |
  "Pencil" |
  "PencilSquare" |
  "Comment" |
  "CommentFilled" |
  "ChatBubbleLeftRight" |
  "ChatBubbleLeftRightFilled" |
  "Shortform" |
  "Warning" |
  "Report" |
  "ListBullet" |
  "Eye" |
  "EyeSlash" |
  "EyeOutline" |
  "Tag" |
  "TagFilled" |
  "Edit" |
  "Analytics" |
  "ChevronLeft" |
  "ChevronRight" |
  "ThickChevronLeft" |
  "ThickChevronRight" |
  "ThickChevronDown" |
  "ChevronUpDown" |
  "ArrowsUpDown" |
  "NarrowArrowDown" |
  "NarrowArrowUp" |
  "Plus" |
  "Check" |
  "CheckCircle" |
  "CheckSmall" |
  "Card" |
  "List" |
  "PlusSmall" |
  "MinusSmall" |
  "Heart" |
  "HeartOutline" |
  "Settings" |
  "Email" |
  "Envelope" |
  "EAEnvelope" |
  "Puzzle" |
  "Image" |
  "Document" |
  "DocumentFilled" |
  "SoftUpArrow" |
  "ArrowLeft" |
  "ArrowRight" |
  "ArrowRightOutline" |
  "ArrowCircle" |
  "Autorenew" |
  "EllipsisVertical" |
  "Share" |
  "ClipboardDocumentList" |
  "ClipboardDocument" |
  "QuestionMarkCircle" |
  "QuestionMarkCircleFilled" |
  "QuestionMark" |
  "Search" |
  "ComputerDesktop" |
  "Menu" |
  "CloseMenu" |
  "Q" |
  "BarChart" |
  "Funnel" |
  "FilterBars" |
  "Voted" |
  "InfoCircle" |
  "BarsArrowDown" |
  "Bars3" |
  "ViewColumns" |
  "ListView" |
  "CardView" |
  "LightbulbChat" |
  "VoteBallot" |
  "Import" |
  "AddReaction" |
  "LabBeaker" |
  "Sparkle" |
  "NotInterested" |
  "Robot" |
  "ExpandMore" |
  "ExpandLess" |
  "PlaylistAdd"|
  "PlusOne" |
  "Undo" |
  "Clear" |
  "Fullscreen" |
  "FullscreenExit" |
  "TickReaction" |
  "CrossReaction" |
  "CrossReactionCap" |
  "Dictionary" |
  "ArrowDownRight" |
  "DragIndicator" |
  "NoteAdd" |
  "ThumbUp" |
  "ThumbUpOutline";

const ICONS: ForumOptions<Record<ForumIconName, IconComponent>> = {
  LWAF: {
    VolumeUp: SpeakerWaveIcon,
    GivingHand: GivingHandIcon,
    BookOpen: BookOpenIcon,
    Bookmark: MuiBookmarkIcon,
    BookmarkBorder: MuiBookmarkBorderIcon,
    Bookmarks: MuiBookmarksIcon,
    Sparkles: SparklesIcon,
    Karma: MuiStarIcon,
    KarmaOutline: MuiStarBorderIcon,
    Star: MuiStarIcon,
    User: MuiPersonIcon,
    UserOutline: UserOutlineIcon,
    UserCircle: UserCircleIcon,
    Users: MuiPeopleIcon,
    UsersOutline: UsersOutlineIcon,
    Gift: GiftIcon,
    Bell: MuiNotificationsIcon,
    BellAlert: BellAlertIcon,
    BellBorder: MuiBellBorderIcon,
    AddEmoji: AddEmojiIcon,
    Link: MuiLinkIcon,
    BoldLink: BoldLinkIcon,
    Pin: StickyIcon,
    Author: AuthorIcon,
    Sprout: SproutIcon,
    Close: CloseIcon,
    Clock: ClockIcon,
    No: NoSymbolIcon,
    Calendar: CalendarIcon,
    CalendarDays: CalendarDaysIcon,
    Work: BriefcaseIcon,
    School: AcademicCapIcon,
    MapPin: MuiLocationIcon,
    Map: MapIcon,
    Pencil: PencilIcon,
    PencilSquare: PencilSquareIcon,
    Comment: CommentIcon,
    CommentFilled: CommentFilledIcon,
    ChatBubbleLeftRight: ChatBubbleLeftRightIcon,
    ChatBubbleLeftRightFilled: MuiForumIcon,
    Shortform: MuiNotesIcon,
    Warning: MuiWarningIcon,
    ListBullet: ListBulletIcon,
    Report: MuiReportIcon,
    Tag: MuiTagIcon,
    TagFilled: TagFilledIcon,
    Eye: MuiVisibility,
    EyeSlash: EyeSlashIcon,
    EyeOutline: MuiVisibilityOff,
    Edit: MuiEditIcon,
    Analytics: MuiShowChartIcon,
    ChevronLeft: ChevronLeftIcon,
    ChevronRight: ChevronRightIcon,
    ThickChevronLeft: ThickChevronLeftIcon,
    ThickChevronRight: ThickChevronRightIcon,
    ThickChevronDown: ThickChevronDownIcon,
    ChevronUpDown: ChevronUpDownIcon,
    ArrowsUpDown: ArrowsUpDownIcon,
    NarrowArrowDown: ArrowLongDown,
    NarrowArrowUp: ArrowLongUp,
    Plus: PlusIcon,
    PlusSmall: PlusSmallIcon,
    MinusSmall: MinusSmallIcon,
    Heart: HeartIcon,
    HeartOutline: HeartOutlineIcon,
    Settings: MuiSettingsIcon,
    Email: MuiEmailIcon,
    Envelope: EnvelopeIcon,
    EAEnvelope: EAEnvelopeIcon,
    Image: PhotoIcon,
    Document: DocumentTextIcon,
    DocumentFilled: DocumentIcon,
    Puzzle: MuiPuzzleIcon,
    Check: MuiCheckIcon,
    CheckCircle: CheckCircleIcon,
    CheckSmall: CheckSmallIcon,
    Card: CardIcon,
    List: ListIcon,
    SoftUpArrow: SoftUpArrowIcon,
    ArrowRight: ArrowRightIcon,
    ArrowLeft: ArrowLeftIcon,
    ArrowRightOutline: ArrowRightOutlineIcon,
    ArrowCircle: ArrowCircleIcon,
    Autorenew: MuiReplayIcon,
    EllipsisVertical: MuiEllipsisVerticalIcon,
    Share: MuiShareIcon,
    ClipboardDocumentList: ClipboardDocumentListIcon,
    ClipboardDocument: ClipboardDocumentIcon,
    QuestionMarkCircle: QuestionMarkCircleIcon,
    QuestionMarkCircleFilled: QuestionMarkCircleFilledIcon,
    QuestionMark: QuestionMarkIcon,
    Search: MuiSearchIcon,
    ComputerDesktop: ComputerDesktopIcon,
    Menu: MuiMenuIcon,
    CloseMenu: CloseMenuIcon,
    Q: QIcon,
    BarChart: ChartBarIcon,
    Funnel: FilterAlt,
    FilterBars: FilterBarsIcon,
    Voted: VotedIcon,
    InfoCircle: InformationCircleIcon,
    BarsArrowDown: BarsArrowDown,
    Bars3: Bars3,
    ViewColumns: ViewColumnsIcon,
    ListView: ListViewIcon,
    CardView: CardViewIcon,
    LightbulbChat: LightbulbChatIcon,
    VoteBallot: MuiVoteIcon,
    Import: ArrowDownOnSquareIcon,
    AddReaction: AddReactionIcon,
    LabBeaker: LabBeakerIcon,
    Sparkle: SparkleIcon,
    NotInterested: MuiNotInterestedIcon,
    Robot: RobotIcon,
    ExpandMore: MuiExpandMoreIcon,
    ExpandLess: MuiExpandLessIcon,
    PlaylistAdd: MuiPlaylistAddIcon,
    PlusOne: PlusOneIcon,
    Undo: UndoIcon,
    Clear: ClearIcon,
    Fullscreen: FullscreenIcon,
    FullscreenExit: FullscreenExitIcon,
    TickReaction: TickReactionIcon,
    CrossReaction: CrossReactionIcon,
    CrossReactionCap: CrossReactionCapIcon,
    Dictionary: DictionaryIcon,
    ArrowDownRight: MuiArrowDownRightIcon,
    DragIndicator: MuiDragIndicatorIcon,
    NoteAdd: MuiNoteAddOutlinedIcon,
    ThumbUp: ThumbsUpIcon,
    ThumbUpOutline: ThumbUpOutlineIcon,
  },
  default: {
    VolumeUp: SpeakerWaveIcon,
    GivingHand: GivingHandIcon,
    BookOpen: BookOpenIcon,
    Bookmark: BookmarkIcon,
    BookmarkBorder: BookmarkOutlineIcon,
    Bookmarks: BookmarkIcon,
    Sparkles: SparklesIcon,
    Karma: StarIcon,
    KarmaOutline: StarOutlineIcon,
    Star: StarIcon,
    User: UserIcon,
    UserOutline: UserOutlineIcon,
    UserCircle: UserCircleIcon,
    Users: UsersIcon,
    UsersOutline: UsersOutlineIcon,
    Gift: GiftIcon,
    Bell: BellIcon,
    BellAlert: BellAlertIcon,
    BellBorder: BellOutlineIcon,
    AddEmoji: AddEmojiIcon,
    Link: LinkIcon,
    BoldLink: BoldLinkIcon,
    Pin: PinIcon,
    Author: AuthorIcon,
    Sprout: SproutIcon,
    Close: CloseIcon,
    Clock: ClockIcon,
    No: NoSymbolIcon,
    Calendar: CalendarIcon,
    CalendarDays: CalendarDaysIcon,
    Work: BriefcaseIcon,
    School: AcademicCapIcon,
    MapPin: MapPinIcon,
    Map: MapIcon,
    Pencil: PencilIcon,
    PencilSquare: PencilSquareIcon,
    Comment: CommentIcon,
    CommentFilled: CommentFilledIcon,
    ChatBubbleLeftRight: ChatBubbleLeftRightIcon,
    ChatBubbleLeftRightFilled: ChatBubbleLeftRightFilledIcon,
    Shortform: LightbulbIcon,
    Warning: WarningIcon,
    ListBullet: ListBulletIcon,
    Report: ReportIcon,
    Tag: TagIcon,
    TagFilled: TagFilledIcon,
    Eye: EyeIcon,
    EyeSlash: EyeSlashIcon,
    EyeOutline: EyeOutlineIcon,
    Edit: PencilIcon,
    Analytics: MuiShowChartIcon,
    ChevronLeft: ChevronLeftIcon,
    ChevronRight: ChevronRightIcon,
    ThickChevronLeft: ThickChevronLeftIcon,
    ThickChevronRight: ThickChevronRightIcon,
    ThickChevronDown: ThickChevronDownIcon,
    ChevronUpDown: ChevronUpDownIcon,
    ArrowsUpDown: ArrowsUpDownIcon,
    NarrowArrowDown: ArrowLongDown,
    NarrowArrowUp: ArrowLongUp,
    Plus: PlusIcon,
    PlusSmall: PlusSmallIcon,
    MinusSmall: MinusSmallIcon,
    Heart: HeartIcon,
    HeartOutline: HeartOutlineIcon,
    Settings: SettingsIcon,
    Email: EmailIcon,
    Envelope: EnvelopeIcon,
    EAEnvelope: EAEnvelopeIcon,
    Image: PhotoIcon,
    Document: DocumentTextIcon,
    DocumentFilled: DocumentIcon,
    Puzzle: PuzzleIcon,
    Check: CheckIcon,
    CheckCircle: CheckCircleIcon,
    CheckSmall: CheckSmallIcon,
    Card: CardIcon,
    List: ListIcon,
    SoftUpArrow: SoftUpArrowIcon,
    ArrowLeft: ArrowLeftIcon,
    ArrowRight: ArrowRightIcon,
    ArrowRightOutline: ArrowRightOutlineIcon,
    ArrowCircle: ArrowCircleIcon,
    Autorenew: MuiReplayIcon,
    EllipsisVertical: EllipsisVerticalIcon,
    Share: ShareIcon,
    ClipboardDocumentList: ClipboardDocumentListIcon,
    ClipboardDocument: ClipboardDocumentIcon,
    QuestionMarkCircle: QuestionMarkCircleIcon,
    QuestionMarkCircleFilled: QuestionMarkCircleFilledIcon,
    QuestionMark: QuestionMarkIcon,
    Search: SearchIcon,
    ComputerDesktop: ComputerDesktopIcon,
    Menu: MenuIcon,
    CloseMenu: CloseMenuIcon,
    Q: QIcon,
    BarChart: ChartBarOutlineIcon,
    Funnel: FunnelIcon,
    FilterBars: FilterBarsIcon,
    Voted: VotedIcon,
    InfoCircle: InformationCircleIcon,
    BarsArrowDown: BarsArrowDown,
    Bars3: Bars3,
    ViewColumns: ViewColumnsIcon,
    ListView: ListViewIcon,
    CardView: CardViewIcon,
    LightbulbChat: LightbulbChatIcon,
    VoteBallot: MuiVoteIcon,
    Import: ArrowDownOnSquareIcon,
    AddReaction: AddReactionIcon,
    LabBeaker: LabBeakerIcon,
    Sparkle: SparkleIcon,
    NotInterested: MuiNotInterestedIcon,
    Robot: RobotIcon,
    ExpandMore: MuiExpandMoreIcon,
    ExpandLess: MuiExpandLessIcon,
    PlaylistAdd: MuiPlaylistAddIcon,
    PlusOne: PlusOneIcon,
    Undo: UndoIcon,
    Clear: ClearIcon,
    Fullscreen: FullscreenIcon,
    FullscreenExit: FullscreenExitIcon,
    TickReaction: TickReactionIcon,
    CrossReaction: CrossReactionIcon,
    CrossReactionCap: CrossReactionCapIcon,
    Dictionary: DictionaryIcon,
    ArrowDownRight: ArrowDownRightIcon,
    DragIndicator: MuiDragIndicatorIcon,
    NoteAdd: MuiNoteAddOutlinedIcon,
    ThumbUp: ThumbsUpIcon,
    ThumbUpOutline: ThumbUpOutlineIcon,
  },
};

type IconProps = {
  className?: string,
  onClick?: MouseEventHandler<SVGElement>,
  onMouseDown?: MouseEventHandler<SVGElement>,
}

type IconComponent = ComponentType<Partial<IconProps>>;

const styles = defineStyles("ForumIcon", (_: ThemeType) => ({
  root: {
    userSelect: "none",
    display: "inline-block",
    flexShrink: 0,
    width: "var(--icon-size, 1em)",
    height: "var(--icon-size, 1em)",
    fontSize: "var(--icon-size, 24px)",
  },
  linkRotation: {
    transform: "rotate(-45deg)",
    '&.MuiListItemIcon-root': {
      marginRight: 12
    }
  },
}), {
  stylePriority: -2,
});

type IconClassName = "root"|"linkRotation"

// This is a map from forum types to icon names to keys in the `styles` object.
const CUSTOM_CLASSES: ForumOptions<Partial<Record<ForumIconName, IconClassName>>> = {
  default: {
    Link: "linkRotation",
  },
  EAForum: {
  },
};

type ForumIconProps = IconProps & {
  icon: ForumIconName,
  noDefaultStyles?: boolean,
  style?: CSSProperties,
};

/**
 * An icon, drawn from a table of icons with some forum/theme-specific variants.
 *
 * WARNING: There is a Safari-specific bug, which affects what styles you can
 * safely use in a `className` that you pass in. Historically, the default was
 * that an icon had a default fontSize of 24px and a default width and height
 * of 1em, which is equal to the font size, so you could override fontSize alone
 * to get a square icon of any size. Unfortunately, in Safari, an `em` on an
 * SVG is an inconsistent unit which fails to scale with the zoom level.
 *
 * In the common case of a square icon, you can override the CSS variable
 * --icon-size and this will adjust all three attributes at once. Eg:
 *     myClassname: {
 *       "--icon-size": "18px"
 *     }
 * Note that you must specify the unit (px); a number alone will not work.
 */
const ForumIcon = ({
  icon,
  noDefaultStyles,
  className,
  ...props
}: ForumIconProps) => {
  const classes = useStyles(styles);
  const icons = forumSelect(ICONS);
  const Icon = icons[icon] ?? ICONS.default[icon];
  if (!Icon) {
    // eslint-disable-next-line no-console
    console.error(`Invalid ForumIcon name: ${icon}`);
    return null;
  }

  const customClassKey = forumSelect(CUSTOM_CLASSES)[icon];
  const customClass = customClassKey ? classes[customClassKey] : undefined;
  const fullClassName = classNames(
    className,
    !noDefaultStyles && classes.root,
    !noDefaultStyles && customClass
  );

  return <Icon className={fullClassName} {...props} />;
}

export default registerComponent("ForumIcon", ForumIcon, {
  areEqual: "auto",
});


