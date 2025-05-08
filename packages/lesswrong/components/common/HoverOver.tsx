import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { FriendlyHoverOverProps } from "./FriendlyHoverOver";
import type { LWTooltipProps } from "./LWTooltip";

const HoverOverInner = (props: LWTooltipProps & FriendlyHoverOverProps) => {
  const {LWTooltip, FriendlyHoverOver} = Components;
  const Tooltip = isFriendlyUI ? FriendlyHoverOver : LWTooltip;
  return (
    <Tooltip {...props} />
  );
}

export const HoverOver = registerComponent(
  "HoverOver",
  HoverOverInner,
);

declare global {
  interface ComponentTypes {
    HoverOver: typeof HoverOver
  }
}
