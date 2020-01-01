import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import withHover from './withHover';
import { withStyles } from '@material-ui/core/styles';

const styles = {
  root: {
    display: "inline-block"
  }
}

const LWTooltip = ({classes, children, title, placement="bottom-start", hover, anchorEl, stopHover}) => {
  const { LWPopper } = Components
  return <span className={classes.root}>
    <LWPopper placement={placement} open={hover} anchorEl={anchorEl} onMouseEnter={stopHover} tooltip>
      {title}
    </LWPopper> 
    {children}
  </span>
}

registerComponent("LWTooltip", LWTooltip, withHover, withStyles(styles, {name:"withStyles"}));


