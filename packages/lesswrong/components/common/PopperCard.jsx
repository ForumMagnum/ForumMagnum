import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Card from '@material-ui/core/Card';

const PopperCard = ({children, placement="bottom-start", open, anchorEl}) => {
  return <Components.LWPopper open={open} anchorEl={anchorEl} placement={placement}>
    <Card>
      {children}
    </Card>
  </Components.LWPopper>
}

registerComponent("PopperCard", PopperCard);
