import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Popper from '@material-ui/core/Popper'

const styles = theme => ({
  popper: {
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper
  },
  default: {
    position: "relative",
    top: 15,
    zIndex: theme.zIndexes.lwPopperTooltip,
  },
  tooltip: {
    backgroundColor: "rgba(75,75,75,.85)",
    borderRadius: 3,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontSize: "1rem",
    padding: theme.spacing.unit,
    color: "white",
    position: "relative",
    zIndex: theme.zIndexes.lwPopperTooltip,
  }
})

// this is a thin wrapper over MuiPopper so that we can set the zIndex however we want
const LWPopper = ({classes, children, onMouseEnter, tooltip=false, modifiers, open, ...props}) => {
  const newModifiers = {computeStyle: { gpuAcceleration: false}, ...modifiers}
  return (
    <Popper 
      className={classes.popper} 
      modifiers={newModifiers} 
      open={open}
      {...props}
    >
      <div className={tooltip ? classes.tooltip : classes.default} onMouseEnter={onMouseEnter}>
        { children }
      </div>
    </Popper>
  )
};

const LWPopperComponent = registerComponent('LWPopper', LWPopper, {styles});

declare global {
  interface ComponentTypes {
    LWPopper: typeof LWPopperComponent
  }
}
