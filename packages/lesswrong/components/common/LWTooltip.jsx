import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import withHover from './withHover';

const LWTooltip = ({children, title, placement="bottom-start", hover, anchorEl, stopHover}) => {
  const { LWPopper } = Components
  return <span>
    <LWPopper placement={placement} open={hover} anchorEl={anchorEl} onMouseEnter={stopHover} tooltip>
      {title}
    </LWPopper> 
    {children}
  </span>
}

registerComponent("LWTooltip", LWTooltip, withHover);


