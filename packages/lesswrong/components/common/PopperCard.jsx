import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import Card from '@material-ui/core/Card';

const PopperCard = ({children, open, anchorEl}) => {
  return <Components.LWPopper open={open} anchorEl={anchorEl} placement="bottom-start">
    <Card>
      {children}
    </Card>
  </Components.LWPopper>
}

registerComponent("PopperCard", PopperCard);
