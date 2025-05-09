import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import { FriendlyHoverOverProps, FriendlyHoverOver } from "./FriendlyHoverOver";
import { LWTooltipProps, LWTooltip } from "./LWTooltip";

const HoverOverInner = (props: LWTooltipProps & FriendlyHoverOverProps) => {
  const Tooltip = isFriendlyUI ? FriendlyHoverOver : LWTooltip;
  return (
    <Tooltip {...props} />
  );
}

export const HoverOver = registerComponent(
  "HoverOver",
  HoverOverInner,
);


