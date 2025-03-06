import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "../../themes/forumTheme";
import type { FriendlyHoverOverProps } from "./FriendlyHoverOver";
import type { LWTooltipProps } from "./LWTooltip";
import LWTooltip from "@/components/common/LWTooltip";
import FriendlyHoverOver from "@/components/common/FriendlyHoverOver";

const HoverOver = (props: LWTooltipProps & FriendlyHoverOverProps) => {
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

export default HoverOverComponent;
