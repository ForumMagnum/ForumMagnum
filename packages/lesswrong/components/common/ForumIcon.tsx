import React, { ComponentType, MouseEventHandler } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import {
  SpeakerWaveIcon,
  BookmarkIcon,
} from "@heroicons/react/24/solid";
import {
  BookmarkIcon as BookmarkBorderIcon,
} from "@heroicons/react/24/outline";
import MuiVolumeUpIcon from "@material-ui/icons/VolumeUp";
import MuiBookmarkIcon from '@material-ui/icons/Bookmark'
import MuiBookmarkBorderIcon from '@material-ui/icons/BookmarkBorder'

/**
 * This exists to allow us to easily use different icon sets on different
 * forums. To add a new icon, add its name to `ForumIconName` and add a
 * default icon component to `DEFAULT_ICONS`, which generally uses icons
 * from MaterialUI. It is optional (but strongly encouraged) to also add
 * a "friendly" icon to `FRIENDLY_ICONS`, which generally uses icons from
 * HeroIcons.
 */
export type ForumIconName =
  "VolumeUp" |
  "Bookmark" |
  "BookmarkBorder";

const DEFAULT_ICONS: Record<ForumIconName, IconComponent> = {
  VolumeUp: MuiVolumeUpIcon,
  Bookmark: MuiBookmarkIcon,
  BookmarkBorder: MuiBookmarkBorderIcon,
};

const FRIENDLY_ICONS: Partial<Record<ForumIconName, IconComponent>> = {
  VolumeUp: SpeakerWaveIcon,
  Bookmark: BookmarkIcon,
  BookmarkBorder: BookmarkBorderIcon,
};

export type IconProps = {
  className: string,
  onClick: MouseEventHandler<SVGElement>,
}

export type IconComponent = ComponentType<Partial<IconProps>>;

const USE_FRIENDLY_ICONS = isEAForum;

export const useFriendlyIcons = () => USE_FRIENDLY_ICONS;

const getIcon = (name: ForumIconName): IconComponent =>
  USE_FRIENDLY_ICONS
    ? FRIENDLY_ICONS[name] ?? DEFAULT_ICONS[name]
    : DEFAULT_ICONS[name];

const ForumIcon = ({icon, ...props}: {icon: ForumIconName} & Partial<IconProps>) => {
  const Icon = getIcon(icon);
  if (!Icon) {
    // eslint-disable-next-line no-console
    console.error(`Invalid ForumIcon name: ${icon}`);
    return null;
  }
  return <Icon {...props} />;
}

const ForumIconComponent = registerComponent("ForumIcon", ForumIcon, {});

declare global {
  interface ComponentTypes {
    ForumIcon: typeof ForumIconComponent
  }
}
