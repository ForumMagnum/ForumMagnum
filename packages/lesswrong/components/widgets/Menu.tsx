import React, { useState } from 'react';
import type { Placement as PopperPlacementType } from 'popper.js'
import { createPortal } from 'react-dom';
import { isClient } from '@/lib/executionEnvironment';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import LWClickAwayListener from "../common/LWClickAwayListener";
import { Paper } from './Paper';

const styles = defineStyles("Menu", (theme) => ({
  menu: {
    display: "inline-block",
    zIndex: theme.zIndexes.lwPopper,
  },
}));

export function Menu({open, anchorEl, onClose, onClick, minWidth, className, children}: {
  open: boolean
  anchorEl: any
  onClose?: (event: AnyBecauseTodo) => void
  onClick?: (event: AnyBecauseTodo) => void
  minWidth?: number
  className?: string,
  children?: React.ReactNode
}) {
  if (!anchorEl) return null;
  function sendCloseAndClick(ev: AnyBecauseTodo) {
    onClick?.(ev);
    onClose?.(ev);
  }
  
  return <MenuPopper
    open={open}
    anchorEl={anchorEl}
    className={className}
  >
    <div onClick={sendCloseAndClick}>
      <LWClickAwayListener onClickAway={sendCloseAndClick}>
        <Paper>
          {children}
        </Paper>
     ,</LWClickAwayListener>
    </div>
  </MenuPopper>
}

/**
 * Popper for menus (replacing the material-UI Menu class). This differs from
 * the positioning used by popperjs in that the placement covers the anchor
 * element, rather than being next to the anchor element.
 */
function MenuPopper({open, className, anchorEl, children}: {
  open: boolean
  anchorEl: HTMLElement|null,
  className?: string
  children: React.ReactNode
}) {
  const [element, setElement] = useState<HTMLDivElement|null>(null);
  const classes = useStyles(styles);

  const positioning = (anchorEl && element)
    ? getMenuPositionStyles(anchorEl, element, "bottom-start")
    : getOffScreeStyles();

  if (!open) {
    return null;
  }

  return <>
    {createPortal(<div
      className={classNames(classes.menu, className)}
      ref={setElement}
      style={positioning}
      
    >
      {children}
    </div>, document.body)}
  </>
}

function getMenuPositionStyles(anchorEl: HTMLElement, element: HTMLElement, placement: PopperPlacementType): React.CSSProperties {
  if (!isClient) {
    return getOffScreeStyles();
  }
  const anchorRect = anchorEl.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const placedRect = placeRectOverlapping(anchorRect, elementRect, placement);
  const finalRect = pushRectInFromOffScreen(placedRect);
  return rectToCSS(finalRect, placement);
}

function getOffScreeStyles(): React.CSSProperties {
  return { width: "auto", top: 0, right: -1000 };
}

function placeRectOverlapping(anchorRect: DOMRect, elementRect: DOMRect, placement: PopperPlacementType): DOMRect {
  switch(placement) {
    case "bottom-start":
    default:
      return new DOMRect(anchorRect.x, anchorRect.y, elementRect.width, elementRect.height);
  }
}

/**
 * Make CSS that places a div at the given position, using `top` and either `left` or `right`.
 */
function rectToCSS(rect: DOMRect, placement: PopperPlacementType): React.CSSProperties {
  const anchorFromRight = ["bottom-end", "top-end"].includes(placement);
  if (anchorFromRight) {
    return {
      right: window.innerWidth - rect.right - window.scrollX,
      top: rect.top + window.scrollY,
      position: "absolute",
    };
  } else {
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
      position: "absolute",
    };
  }
}

/**
 * If the given rect is fully or partially off-screen, push it into the viewport.
 */
function pushRectInFromOffScreen(rect: DOMRect): DOMRect {
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Create a new rect that we can modify
  const newRect = new DOMRect(
    rect.x,
    rect.y,
    rect.width,
    rect.height
  );
  
  // Push in from the right edge
  if (newRect.right > viewportWidth) {
    newRect.x = viewportWidth - newRect.width;
  }
  
  // Push in from the bottom edge
  if (newRect.bottom > viewportHeight) {
    newRect.y = viewportHeight - newRect.height;
  }
  
  // Push in from the left edge
  if (newRect.x < 0) {
    newRect.x = 0;
  }
  
  // Push in from the top edge
  if (newRect.y < 0) {
    newRect.y = 0;
  }
  
  // Handle case where rect is wider or taller than viewport
  if (newRect.width > viewportWidth) {
    newRect.x = 0;
    newRect.width = viewportWidth;
  }
  
  if (newRect.height > viewportHeight) {
    newRect.y = 0;
    newRect.height = viewportHeight;
  }
  
  return newRect;
}
