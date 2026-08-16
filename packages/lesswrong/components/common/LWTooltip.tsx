import React, { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { useHover } from './withHover';
import type { Placement as PopperPlacementType } from "popper.js"
import classNames from 'classnames';
import { AnalyticsProps } from '../../lib/analyticsEvents';
import LWPopper from "./LWPopper";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("LWTooltip", (_theme: ThemeType) => ({
  root: {
    // inline-block makes sure that the popper placement works properly (without flickering). "block" would also work, but there may be situations where we want to wrap an object in a tooltip that shouldn't be a block element.
    display: "inline-block",
  },
  tooltip: {
    maxWidth: 300,
    
    "& img": {
      maxWidth: "100%",
    },
  }
}), {stylePriority: -1});

export const TooltipSuggestedWidth = 270;

export type LWTooltipProps = {
  title?: ReactNode,
  placement?: PopperPlacementType,
  tooltip?: boolean,
  flip?: boolean,
  /** Keep the popper on-screen along both axes, not just its slide axis. See LWPopper. */
  overflowAltAxis?: boolean,
  /** Placements to try, in order, when `placement` doesn't fit in the viewport. See LWPopper. */
  fallbackPlacements?: PopperPlacementType[],
  clickable?: boolean,
  inlineBlock?: boolean,
  As?: 'span' | 'div',
  disabled?: boolean,
  disabledOnMobile?: boolean,
  hideOnTouchScreens?: boolean,
  className?: string,
  /** Distance in px between the anchor and the tooltip, along the placement axis */
  distance?: number,
  analyticsProps?: AnalyticsProps,
  otherEventProps?: Record<string, Json | undefined>,
  titleClassName?: string
  popperClassName?: string,
  onShow?: () => void,
  onHide?: () => void,
  children?: ReactNode,
  forceOpen?: boolean,
  /**
   * By default, LWTooltip avoids rendering the underlying LWPopper element until the first time the anchor
   * element is hovered.  If this is set to true, the LWPopper will be rendered immediately.  This allows
   * displaying tooltips by the use of `forceOpen`, without requiring the user to hover over them.
   * e.g. to display a tooltip when a user has a command palette menu item selected with their keyboard.
   */
  renderWithoutHover?: boolean,
}

const LWTooltip = ({
  title,
  placement="bottom-start",
  tooltip=true,
  flip=true,
  overflowAltAxis,
  fallbackPlacements,
  clickable=false,
  inlineBlock=true,
  As="span",
  disabled=false,
  disabledOnMobile=false,
  hideOnTouchScreens=false,
  distance,
  analyticsProps,
  otherEventProps,
  titleClassName,
  popperClassName,
  onShow,
  onHide,
  children,
  className,
  forceOpen,
  renderWithoutHover,
}: LWTooltipProps) => {
  const classes = useStyles(styles);
  const [delayedClickable, setDelayedClickable] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // In the case where we have `renderWithoutHover: true`, we want the wrapping span/div
  // to serve as the default anchor element for the tooltip, since we won't have one
  // from `useHover` unless the user manually hovers over the element with their mouse.
  const defaultAnchorElRef = useRef<HTMLDivElement>(null);

  const clearDelayTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const { hover, everHovered, anchorEl, eventHandlers } = useHover({
    eventProps: {
      pageElementContext: "tooltipHovered", // Can be overwritten by analyticsProps
      title: typeof title === "string" ? title : undefined,
      ...analyticsProps,
      ...otherEventProps,
    },
    disabledOnMobile,
    onEnter: onShow,
    onLeave: () => {
      onHide?.();
      clearDelayTimeout();
      setDelayedClickable(false);
    },
  });

  // For the clickable case, we want to delay the opening of the tooltip by 200ms
  // so that users aren't interrupted when moving their mouse rapidly over
  // clickable elements
  useEffect(() => {
    if (hover && clickable) {
      clearDelayTimeout();
      timeoutRef.current = setTimeout(() => {
        setDelayedClickable(true);
        timeoutRef.current = null;
      }, 200);
    } else {
      clearDelayTimeout();
      setDelayedClickable(false);
    }
    
    return clearDelayTimeout;
  }, [hover, clickable, clearDelayTimeout]);

  if (!title) return <>{children}</>

  return <As className={classNames(
    inlineBlock && classes.root,
    className
  )} {...eventHandlers} ref={defaultAnchorElRef}>
    { /* Only render the LWPopper if this element has ever been hovered. (But
         keep it in the React tree thereafter, so it can remember its state and
         can have a closing animation if applicable. */ }
    {(everHovered || renderWithoutHover) && <LWPopper
      placement={placement}
      open={forceOpen || (hover && !disabled)}
      anchorEl={anchorEl ?? defaultAnchorElRef.current}
      tooltip={tooltip}
      allowOverflow={!flip}
      overflowAltAxis={overflowAltAxis}
      fallbackPlacements={fallbackPlacements}
      distance={distance}
      clickable={delayedClickable}
      hideOnTouchScreens={hideOnTouchScreens}
      className={popperClassName}
    >
      <div className={classNames(
        tooltip && classes.tooltip,
        titleClassName
      )}>
        {title}
      </div>
    </LWPopper>}

    {children}
  </As>
}

export default LWTooltip;


