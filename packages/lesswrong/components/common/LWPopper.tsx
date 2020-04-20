import { registerComponent } from '../../lib/vulcan-lib';
import React from 'react';
import Popper, { PopperPlacementType } from '@material-ui/core/Popper'

const styles = theme => ({
  popper: {
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper
  },
  default: {
    position: "relative",
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

// This is a thin wrapper over material-UI Popper so that we can set default z-index and modifiers
const LWPopper = ({classes, children, onMouseEnter, tooltip=false, modifiers, open, ...props}: {
  classes: ClassesType,
  children: any,
  onMouseEnter?: any,
  tooltip?: boolean,
  modifiers?: any,
  open: boolean,
  
  // Arguments destructured into ...props
  placement?: PopperPlacementType,
  anchorEl: any,
  className?: string,
}) => {
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
