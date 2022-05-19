import { registerComponent } from '../../lib/vulcan-lib';
import React, {useState} from 'react';
import type { Placement } from '@popperjs/core';
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
})

// This is a thin wrapper over material-UI Popper so that we can set default z-index and modifiers
const LWPopper = ({classes, children, className, tooltip=false, allowOverflow, open, anchorEl, placement, clickable = true}: {
  classes: ClassesType,
  children: any,
  tooltip?: boolean,
  allowOverflow?: boolean,
  open: boolean,
  placement?: Placement,
  anchorEl: any,
  className?: string,
  clickable?: boolean
}) => {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);

  const preventOverflowModifier = allowOverflow ? [{
    name: 'preventOverflow',
    enabled: false, 
  }] : []

  const { styles, attributes } = usePopper(anchorEl, popperElement, {
    placement,
    modifiers: [
      ...preventOverflowModifier,
      {
        name: 'fallback!',
        options: {
          fallbackPlacements: ['bottom-start'],
        },
      },
    ]
  });

  if (!open)
    return null;
  
  return (
    createPortal(
      <div
        ref={setPopperElement}
        className={classNames({[classes.tooltip]: tooltip, [classes.default]: !tooltip, [classes.noMouseEvents]: !clickable}, className)}
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
