import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Popper from '@material-ui/core/Popper'

const styles = theme => ({
  popper: {
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper
  },
  tooltip: {
    backgroundColor: "rgba(0,0,0,.6)",
    borderRadius: 3,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontSize: "1rem",
    padding: theme.spacing.unit,
    color: "white",
    zIndex: theme.zIndexes.lwPopperTooltip,
  }
})

// this is a thin wrapper over MuiPopper so that we can set the zIndex however we want
const LWPopper = ({classes, children, onMouseEnter, tooltip=false, modifiers, ...props}) => {
  const newModifiers = {computeStyle: { gpuAcceleration: false}, ...modifiers}
  return (
    <Popper 
      className={classes.popper} 
      modifiers={newModifiers} 
      {...props}
    >
      <span className={tooltip ? classes.tooltip : null} onMouseEnter={onMouseEnter}>
        { children }
      </span>
    </Popper>
  )
};

registerComponent('LWPopper', LWPopper, withStyles(styles, {name:"LWPopper"}));
