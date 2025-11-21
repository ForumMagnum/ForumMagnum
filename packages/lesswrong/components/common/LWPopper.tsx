"use client";
import React, {use, createContext, MutableRefObject, ReactNode, useState, useRef, RefObject, useEffect, useLayoutEffect} from 'react';
import type { Placement as PopperPlacementType } from "popper.js"
import classNames from 'classnames';
import { usePopper } from 'react-popper';
import { createPortal } from 'react-dom';
import type { State } from '@popperjs/core/lib/types';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("LWPopper", (theme: ThemeType) => ({
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
}))

// This is a wrapper around the Popper library so we can easily replace it with different versions and
// implementations
const LWPopper = ({
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
  const classes = useStyles(styles);
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

  const { styles: popperStyles, attributes, update } = usePopper(anchorEl, popperElement, {
    placement,
    modifiers: [
      {
        name: 'computeStyles',
        options: {
          // This misnamed option causes the emitted styles to use `transform`
          // rather than `left` and `top`. Under some browsers at some zoom
          // levels, this causes ugly resampling. (This has no effect on whether
          // GPU acceleration is used or on performance.)
          gpuAcceleration: false,
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
  
  // We use createPortal to place the tooltip element in a container a ways
  // up the tree, to avoid inheriting styles and positioning that we may not
  // want. However, we need to avoid portaling across a React <Activity>,
  // because that will cause components to remain mounted (but with their styles
  // unmounted) after page navigations.
  const tooltipContainer = use(PopperPortalContainerContext)?.current;
  if (!tooltipContainer) return null;
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
        style={popperStyles.popper}
        {...attributes.popper}
      >
        { children }
      </div>,
      tooltipContainer
    )
  }</>
};

const PopperPortalContainerContext = createContext<RefObject<HTMLDivElement|null>|null>(null);
export const PopperPortalProvider = ({children}: {
  children: React.ReactNode
}) => {
  const popperContainerRef = useRef<HTMLDivElement|null>(null);
  return <>
    <PopperPortalContainerContext.Provider value={popperContainerRef}>
      {children}
    </PopperPortalContainerContext.Provider>
    <div ref={popperContainerRef}/>
  </>
}

export default LWPopper;

