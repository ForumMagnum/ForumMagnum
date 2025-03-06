import React, { CSSProperties } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import Card from '@material-ui/core/Card';
import { PopperPlacementType } from '@material-ui/core/Popper'
import LWPopper from "@/components/common/LWPopper";

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
