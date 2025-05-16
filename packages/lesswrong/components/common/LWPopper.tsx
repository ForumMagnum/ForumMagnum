import { registerComponent } from '../../lib/vulcan-lib/components';
import React, {MutableRefObject, ReactNode, useState} from 'react';
import type { Placement as PopperPlacementType } from "popper.js"
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import { createPortal } from 'react-dom';
import type { State } from '@popperjs/core/lib/types';

const styles = (theme: ThemeType) => ({
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
  overflowPadding,
  flip,
  open,
  anchorEl,
  distance=0,
  placement,
  clickable = true,
  hideOnTouchScreens,
  updateRef
}: {
  classes: ClassesType<typeof styles>,
  children: ReactNode,
  tooltip?: boolean,
  allowOverflow?: boolean,
  overflowPadding?: number,
  flip?: boolean,
  open: boolean,
  placement?: PopperPlacementType,
  anchorEl: any,
  distance?: number,
  className?: string,
  clickable?: boolean,
  hideOnTouchScreens?: boolean,
  updateRef?: MutableRefObject<(() => Promise<Partial<State>>) | null | undefined>
}) => {
  const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);

  const flipModifier = !flip && allowOverflow ? [
    {
      name: 'flip',
      enabled: false,
    }
  ] : [];

  const preventOverflowModifier = [
    {
      name: 'preventOverflow',
      enabled: !allowOverflow,
      options: {padding: overflowPadding},
    }
  ];

  const { styles, attributes, update } = usePopper(anchorEl, popperElement, {
    placement,
    modifiers: [
      {
        name: 'computeStyles',
        options: {
          gpuAcceleration: false, // true by default
        },
      },
      ...(distance>0 ? [{
        name: "offset",
        options: {
          offset: [0, distance]
        },
      }] : []),
      ...flipModifier,
      ...preventOverflowModifier
    ],
  });

  if (updateRef && update) {
    updateRef.current = update
  }

  if (!open)
    return null;
  
  // In some cases, interacting with something inside a popper will cause a rerender that detaches the anchorEl
  // This happened in hovers on in-line reacts, and the button to create a new react ended up on the top-left corner of the page
  if (anchorEl && !anchorEl.isConnected) {
    return null;
  }
  
  // We use createPortal here to avoid having to deal with overflow problems and styling from the current child
  // context, by placing the Popper element directly into the document root
  // Rest of usage from https://popper.js.org/react-popper/v2/
  return <>{
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
  }</>
};

export default registerComponent('LWPopper', LWPopper, {styles});


