import { registerComponent } from '../../lib/vulcan-lib';
import React, {useState} from 'react';
import Popper, { PopperPlacementType } from '@material-ui/core/Popper'
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  popper: {
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper
  },
  default: {
    position: "relative",
    zIndex: theme.zIndexes.lwPopperTooltip,
  },
  tooltip: {
    backgroundColor: theme.palette.panelBackground.tooltipBackground,
    borderRadius: 3,
    ...theme.typography.commentStyle,
    ...theme.typography.body2,
    fontSize: "1rem",
    padding: theme.spacing.unit,
    color: theme.palette.text.tooltipText,
    position: "relative",
    zIndex: theme.zIndexes.lwPopperTooltip,
  },
  noMouseEvents: {
    pointerEvents: "none",
  },
})

// This is a thin wrapper over material-UI Popper so that we can set default z-index and modifiers
const LWPopper = ({classes, children, tooltip=false, modifiers, open, clickable = true, ...props}: {
  classes: ClassesType,
  children: any,
  tooltip?: boolean,
  modifiers?: any,
  open: boolean,
  
  // Arguments destructured into ...props
  placement?: PopperPlacementType,
  anchorEl: any,
  className?: string,
  clickable?: boolean
}) => {
  const newModifiers = {computeStyle: { gpuAcceleration: false}, ...modifiers}
  const [everOpened, setEverOpened] = useState(open);
  
  if (open && !everOpened)
    setEverOpened(true);
  if (!open && !everOpened)
    return null;
  
  return (
    <Popper 
      className={classNames(classes.popper, {[classes.noMouseEvents]: !clickable})} 
      modifiers={newModifiers} 
      open={open}
      {...props}
    >
      <div className={classNames({[classes.tooltip]: tooltip, [classes.default]: !tooltip})}>
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
