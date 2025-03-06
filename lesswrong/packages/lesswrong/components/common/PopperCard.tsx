import React, { CSSProperties } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import LWPopper from "@/components/common/LWPopper";
import { Card, PopperPlacementType } from "@/components/mui-replacement";

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
  anchorEl: HTMLElement|null,
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

const PopperCardComponent = registerComponent("PopperCard", PopperCard, {stylePriority: -1});

declare global {
  interface ComponentTypes {
    PopperCard: typeof PopperCardComponent
  }
}

export default PopperCardComponent;
