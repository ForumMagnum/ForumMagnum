import React, { CSSProperties } from 'react';
import { Card } from "@/components/widgets/Paper";
import type { Placement as PopperPlacementType } from "popper.js"
import LWPopper from "./LWPopper";
import type { HoverAnchor } from "./withHover";

const PopperCard = ({
  children,
  placement="bottom-start",
  open,
  anchorEl,
  allowOverflow,
  flip,
  style,
  className,
}: {
  children?: React.ReactNode,
  placement?: PopperPlacementType,
  open: boolean,
  // HoverAnchor covers both real DOM elements and the popper virtual elements
  // that useHover now produces for wrapped inline anchors.
  anchorEl: HoverAnchor|null,
  allowOverflow?: boolean,
  flip?: boolean,
  style?: CSSProperties,
  className?: string,
}) => {
  return <LWPopper open={open} anchorEl={anchorEl} placement={placement} allowOverflow={allowOverflow} flip={flip}>
    <Card style={style} className={className}>
      {children}
    </Card>
  </LWPopper>
}

export default PopperCard;


