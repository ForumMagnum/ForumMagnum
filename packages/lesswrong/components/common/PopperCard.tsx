import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Card from '@material-ui/core/Card';

const PopperCard = ({children, placement="bottom-start", open, anchorEl, modifiers}: {
  children?: any,
  placement?: string,
  open: boolean,
  anchorEl: HTMLElement|null,
  modifiers?: any,
}) => {
  return <Components.LWPopper open={open} anchorEl={anchorEl} placement={placement} modifiers={modifiers}>
    <Card>
      {children}
    </Card>
  </Components.LWPopper>
}

const PopperCardComponent = registerComponent("PopperCard", PopperCard);

declare global {
  interface ComponentTypes {
    PopperCard: typeof PopperCardComponent
  }
}
