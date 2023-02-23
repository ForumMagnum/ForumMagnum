import React, { ComponentType, MouseEventHandler } from "react";
import { registerComponent } from "../../lib/vulcan-lib";
import { isEAForum } from "../../lib/instanceSettings";
import { SpeakerWaveIcon } from "@heroicons/react/24/solid";
import MuiVolumeUpIcon from "@material-ui/icons/VolumeUp";

export type ForumIconName = "VolumeUp";

export type IconProps = {
  className: string,
  onClick: MouseEventHandler<SVGElement>,
}

export type IconComponent = ComponentType<Partial<IconProps>>;

const DEFAULT_ICONS: Record<ForumIconName, IconComponent> = {
  VolumeUp: MuiVolumeUpIcon,
};

const FRIENDLY_ICONS: Partial<Record<ForumIconName, IconComponent>> = {
  VolumeUp: SpeakerWaveIcon,
};

const USE_FRIENDLY_ICONS = isEAForum;

const getIcon = (name: ForumIconName): IconComponent =>
  USE_FRIENDLY_ICONS
    ? FRIENDLY_ICONS[name] ?? DEFAULT_ICONS[name]
    : DEFAULT_ICONS[name];

const ForumIcon = ({icon, ...props}: {icon: ForumIconName} & Partial<IconProps>) => {
  const Icon = getIcon(icon);
  return <Icon {...props} />;
}

const ForumIconComponent = registerComponent("ForumIcon", ForumIcon, {});

declare global {
  interface ComponentTypes {
    ForumIcon: typeof ForumIconComponent
  }
}
