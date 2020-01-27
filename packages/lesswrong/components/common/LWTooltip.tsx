import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import withHover from './withHover';
import { withStyles, createStyles } from '@material-ui/core/styles';

const styles = createStyles(theme => ({
  root: {
    // inline-block makes sure that the popper placement works properly (without flickering). "block" would also work, but there may be situations where we want to wrap an object in a tooltip that shouldn't be a block element.
    display: "inline-block"
  }
}))

const LWTooltip = ({classes, children, title, placement="bottom-start", hover, anchorEl, stopHover, tooltip=true, flip=true}) => {
  const { LWPopper } = Components
  return <span className={classes.root}>
    <LWPopper 
      placement={placement} 
      open={hover} 
      anchorEl={anchorEl} 
      onMouseEnter={stopHover} 
      tooltip={tooltip}
      modifiers={{
        flip: {
          enabled: flip
        }
      }}
    >
      {title}
    </LWPopper>
    {children}
  </span>
}

const LWTooltipComponent = registerComponent("LWTooltip", LWTooltip,
  withHover({pageElementContext: "tooltipHovered"}, ({title}) => ({title})),
  withStyles(styles, {name:"withStyles"}));

declare global {
  interface ComponentTypes {
    LWTooltip: typeof LWTooltipComponent
  }
}


