import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { FriendlyHoverOverProps } from "./FriendlyHoverOver";
import type { LWTooltipProps } from "./LWTooltip";

const HoverOver = (props: LWTooltipProps & FriendlyHoverOverProps) => {
  const {LWTooltip, FriendlyHoverOver} = Components;
  const Tooltip = isFriendlyUI ? FriendlyHoverOver : LWTooltip;
  return (
    <Tooltip {...props} />
  );
}

const HoverOverComponent = registerComponent(
  "HoverOver",
  HoverOver,
);

declare global {
  interface ComponentTypes {
    HoverOver: typeof HoverOverComponent
  }
}
