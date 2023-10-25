import React from "react";
import { isEAForum } from "../../lib/instanceSettings";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import type { EAHoverOverProps } from "../ea-forum/EAHoverOver";
import type { LWTooltipProps } from "./LWTooltip";

const HoverOver = (props: LWTooltipProps & EAHoverOverProps) => {
  const {LWTooltip, EAHoverOver} = Components;
  const Tooltip = isEAForum ? EAHoverOver : LWTooltip;
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
