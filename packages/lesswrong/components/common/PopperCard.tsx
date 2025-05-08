import React, { CSSProperties } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { Card } from "@/components/widgets/Paper";
import type { Placement as PopperPlacementType } from "popper.js"

const PopperCardInner = ({
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
  anchorEl: HTMLElement|null,
  allowOverflow?: boolean,
  flip?: boolean,
  style?: CSSProperties,
  className?: string,
}) => {
  return <Components.LWPopper open={open} anchorEl={anchorEl} placement={placement} allowOverflow={allowOverflow} flip={flip}>
    <Card style={style} className={className}>
      {children}
    </Card>
  </Components.LWPopper>
}

export const PopperCard = registerComponent("PopperCard", PopperCardInner, {stylePriority: -1});

declare global {
  interface ComponentTypes {
    PopperCard: typeof PopperCard
  }
}
