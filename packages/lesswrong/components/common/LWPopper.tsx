import { registerComponent } from '../../lib/vulcan-lib';
import React, {ReactNode, useState} from 'react';
import type { PopperPlacementType } from '@material-ui/core/Popper'
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import { createPortal } from 'react-dom';

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
  hideOnTouchScreens: {
    "@media (pointer:coarse)": {
      display: "none",
    },
  },
})

// This is a wrapper around the Popper library so we can easily replace it with different versions and
// implementations
const LWPopper = ({
  classes,
  children,
  className,
  tooltip=false,
  allowOverflow,
  flip,
  open,
  anchorEl,
  placement,
  clickable = true,
  hideOnTouchScreens,
}: {
  classes: ClassesType,
  children: ReactNode,
  tooltip?: boolean,
  allowOverflow?: boolean,
  flip?: boolean,
  open: boolean,
  placement?: PopperPlacementType,
  anchorEl: any,
  className?: string,
  clickable?: boolean,
  hideOnTouchScreens?: boolean,
}) => {
  const [everOpened, setEverOpened] = useState(open);
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);

  const flipModifier = !flip && allowOverflow ? [
    {
      name: 'flip',
      enabled: false,
    }
  ] : [];

  const preventOverflowModifier = allowOverflow ? [
    {
      name: 'preventOverflow',
      enabled: false,
    }
  ] : [];

  const { styles, attributes } = usePopper(anchorEl, popperElement, {
    placement,
    modifiers: [
      {
        name: 'computeStyles',
        options: {
          gpuAcceleration: false, // true by default
        },
      },
      ...flipModifier,
      ...preventOverflowModifier
    ],
  });

  if (!open)
    return null;
  
  return (
    // We use createPortal here to avoid having to deal with overflow problems and styling from the current child
    // context, by placing the Popper element directly into the document root
    // Rest of usage from https://popper.js.org/react-popper/v2/
    createPortal(
      <div
        ref={setPopperElement}
        className={classNames({
          [classes.tooltip]: tooltip,
          [classes.default]: !tooltip,
          [classes.noMouseEvents]: !clickable,
          [classes.hideOnTouchScreens]: hideOnTouchScreens},
          className
        )}
        style={styles.popper}
        {...attributes.popper}
      >
        { children }
      </div>,
      document.body
    )
  )
};

const LWPopperComponent = registerComponent('LWPopper', LWPopper, {styles});

declare global {
  interface ComponentTypes {
    LWPopper: typeof LWPopperComponent
  }
}
