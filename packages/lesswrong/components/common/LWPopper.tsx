"use client";
import React, {use, createContext, MutableRefObject, ReactNode, useRef, RefObject, useLayoutEffect, useId} from 'react';
import type { Placement as PopperPlacementType } from "popper.js"
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import type { State } from '@popperjs/core/lib/types';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

/**
 * Maps PopperJS placement names to CSS anchor positioning area values.
 * 
 * CSS anchor positioning uses position-area which places the element in a cell
 * of a 3x3 grid around the anchor. The grid looks like:
 * 
 *   top-left    | top      | top-right
 *   left        | center   | right
 *   bottom-left | bottom   | bottom-right
 * 
 * For PopperJS placements:
 * - 'right' family → positioned to the right of anchor
 * - 'left' family → positioned to the left of anchor
 * - 'top' family → positioned above anchor
 * - 'bottom' family → positioned below anchor
 * 
 * We use simple position-area values and rely on align-self/justify-self
 * for the -start/-end alignment variants.
 */
function getPositionAreaForPlacement(placement: PopperPlacementType): string {
  switch (placement) {
    case 'top':
    case 'top-start':
    case 'top-end':
      return 'top';
      
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      return 'bottom';
      
    case 'left':
    case 'left-start':
    case 'left-end':
      return 'left';
      
    case 'right':
    case 'right-start':
    case 'right-end':
      return 'right';
      
    case 'auto':
    case 'auto-start':
    case 'auto-end':
    default:
      return 'bottom';
  }
}

/**
 * Returns alignment styles for -start/-end placement variants.
 * 
 * For horizontal placements (left/right), align-self controls vertical alignment:
 *   - start = top-aligned
 *   - end = bottom-aligned
 * 
 * For vertical placements (top/bottom), justify-self controls horizontal alignment:
 *   - start = left-aligned (in LTR)
 *   - end = right-aligned (in LTR)
 */
function getAlignmentStylesForPlacement(placement: PopperPlacementType): { alignSelf?: string; justifySelf?: string } {
  const isHorizontal = placement.startsWith('left') || placement.startsWith('right');
  const isStart = placement.endsWith('-start');
  const isEnd = placement.endsWith('-end');
  
  if (!isStart && !isEnd) {
    // Center alignment (default)
    return {};
  }
  
  if (isHorizontal) {
    // For left/right placements, align-self controls vertical position
    return { alignSelf: isStart ? 'start' : 'end' };
  } else {
    // For top/bottom placements, justify-self controls horizontal position
    return { justifySelf: isStart ? 'start' : 'end' };
  }
}

/**
 * Returns the CSS position-try-fallbacks value for a given placement.
 * This creates a chain of fallback positions to try when the preferred
 * position would cause overflow.
 */
function getPositionTryFallbacks(placement: PopperPlacementType): string {
  // The fallback order is designed to keep the popover visible:
  // 1. Try the opposite side first (flip)
  // 2. Then try other positions that might work
  // 3. Use flip-inline/flip-block for automatic flipping
  switch (placement) {
    case 'right':
    case 'right-start':
    case 'right-end':
      return 'flip-inline, flip-block';
    case 'left':
    case 'left-start':
    case 'left-end':
      return 'flip-inline, flip-block';
    case 'top':
    case 'top-start':
    case 'top-end':
      return 'flip-block, flip-inline';
    case 'bottom':
    case 'bottom-start':
    case 'bottom-end':
      return 'flip-block, flip-inline';
    default:
      return 'flip-block, flip-inline';
  }
}

const styles = defineStyles("LWPopper", (theme: ThemeType) => ({
  popper: {
    position: "absolute",
    zIndex: theme.zIndexes.lwPopper,
  },
  popover: {
    // Native popover styles
    margin: 0,
    padding: 0,
    border: 'none',
    background: 'transparent',
    overflow: 'visible',
    
    // Use fixed positioning for anchor positioning to work
    position: 'fixed',
    zIndex: theme.zIndexes.lwPopper,
    
    // Ensure the popover doesn't exceed viewport
    maxWidth: 'calc(100vw - 16px)',
    maxHeight: 'calc(100vh - 16px)',
    
    // Ensure the popover is rendered in the top layer
    '&::backdrop': {
      background: 'transparent',
      pointerEvents: 'none',
    },
  },
  allowOverflow: {
    maxWidth: 'none',
    maxHeight: 'none',
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

// This is a wrapper around the native Popover API with CSS anchor positioning
// for better control over positioning and fallback behavior
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
  anchorEl: HTMLElement | null,
  distance?: number,
  className?: string,
  clickable?: boolean,
  hideOnTouchScreens?: boolean,
  updateRef?: MutableRefObject<(() => Promise<Partial<State>>) | null | undefined>
}) => {
  const classes = useStyles(styles);
  const popoverRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const anchorName = `--lw-popper-anchor-${uniqueId.replace(/:/g, '-')}`;

  // Apply anchor-name to the anchor element
  useLayoutEffect(() => {
    if (anchorEl && open) {
      const previousAnchorName = anchorEl.style.getPropertyValue('anchor-name');
      anchorEl.style.setProperty('anchor-name', anchorName);
      return () => {
        if (previousAnchorName) {
          anchorEl.style.setProperty('anchor-name', previousAnchorName);
        } else {
          anchorEl.style.removeProperty('anchor-name');
        }
      };
    }
  }, [anchorEl, anchorName, open]);

  // Apply CSS anchor positioning styles to the popover element
  useLayoutEffect(() => {
    const popoverElement = popoverRef.current;
    if (!popoverElement || !open) return;
    
    const positionArea = placement ? getPositionAreaForPlacement(placement) : 'bottom';
    const positionTryFallbacks = placement ? getPositionTryFallbacks(placement) : 'flip-block, flip-inline';
    const alignmentStyles = placement ? getAlignmentStylesForPlacement(placement) : {};
    
    // Set anchor positioning CSS properties
    popoverElement.style.setProperty('position-anchor', anchorName);
    popoverElement.style.setProperty('position-area', positionArea);
    
    // Apply alignment for -start/-end variants
    if (alignmentStyles.alignSelf) {
      popoverElement.style.setProperty('align-self', alignmentStyles.alignSelf);
    }
    if (alignmentStyles.justifySelf) {
      popoverElement.style.setProperty('justify-self', alignmentStyles.justifySelf);
    }
    
    // Enable position fallbacks unless flip is explicitly disabled
    if (flip !== false && !allowOverflow) {
      popoverElement.style.setProperty('position-try-fallbacks', positionTryFallbacks);
    }
    
    // Apply distance as margin based on placement
    if (distance > 0 && placement) {
      if (placement.startsWith('top')) {
        popoverElement.style.marginBottom = `${distance}px`;
      } else if (placement.startsWith('bottom')) {
        popoverElement.style.marginTop = `${distance}px`;
      } else if (placement.startsWith('left')) {
        popoverElement.style.marginRight = `${distance}px`;
      } else if (placement.startsWith('right')) {
        popoverElement.style.marginLeft = `${distance}px`;
      }
    }
    
    return () => {
      popoverElement.style.removeProperty('position-anchor');
      popoverElement.style.removeProperty('position-area');
      popoverElement.style.removeProperty('align-self');
      popoverElement.style.removeProperty('justify-self');
      popoverElement.style.removeProperty('position-try-fallbacks');
      popoverElement.style.marginTop = '';
      popoverElement.style.marginBottom = '';
      popoverElement.style.marginLeft = '';
      popoverElement.style.marginRight = '';
    };
  }, [anchorName, placement, flip, allowOverflow, distance, open]);

  // Handle popover open/close state using native Popover API
  useLayoutEffect(() => {
    const popoverElement = popoverRef.current;
    if (!popoverElement) return;
    
    if (open) {
      // Check if the popover is already open to avoid errors
      if (!popoverElement.matches(':popover-open')) {
        try {
          popoverElement.showPopover();
        } catch {
          // Popover API might not be supported or element might already be showing
          // Silently fail - the content will still be visible via the portal
        }
      }
    } else {
      if (popoverElement.matches(':popover-open')) {
        try {
          popoverElement.hidePopover();
        } catch {
          // Silently fail
        }
      }
    }
  }, [open]);

  // Provide a no-op update function for compatibility
  if (updateRef) {
    updateRef.current = async () => ({} as Partial<State>);
  }

  if (!open) {
    return null;
  }
  
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
        ref={popoverRef}
        // eslint-disable-next-line react/no-unknown-property
        popover="manual"
        className={classNames(
          classes.popover,
          {
            [classes.allowOverflow]: allowOverflow,
            [classes.tooltip]: tooltip,
            [classes.default]: !tooltip,
            [classes.noMouseEvents]: !clickable,
            [classes.hideOnTouchScreens]: hideOnTouchScreens,
          },
          className
        )}
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
