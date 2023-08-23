import React, { FC } from "react";
import { SvgProps, NumberProp } from "react-native-svg";
import CommentIcon from "react-native-heroicons/outline/ChatBubbleLeftIcon";

const mobileIcons = {
  Comment: CommentIcon,
} as const;

export type MobileIconName = keyof typeof mobileIcons;

const MobileIcon: FC<{
  icon: MobileIconName,
  size?: NumberProp,
} & SvgProps> = ({icon, ...props}) => {
  const Icon = mobileIcons[icon];
  return (
    <Icon {...props} />
  );
}

export default MobileIcon;
