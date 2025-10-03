import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import FriendlyHoverOver, { FriendlyHoverOverProps } from "./FriendlyHoverOver";
import LWTooltip, { LWTooltipProps } from "./LWTooltip";

const HoverOver = (props: LWTooltipProps & FriendlyHoverOverProps) => {
  const Tooltip = isFriendlyUI() ? FriendlyHoverOver : LWTooltip;
  return (
    <Tooltip {...props} />
  );
}

export default registerComponent(
  "HoverOver",
  HoverOver,
);


