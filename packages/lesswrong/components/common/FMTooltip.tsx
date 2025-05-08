import React, { Ref, useCallback, useEffect, useRef, useState } from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { AnalyticsProps } from '@/lib/analyticsEvents';
import { useHover } from './withHover';
import type { Placement as PopperPlacementType } from "popper.js"
import classNames from 'classnames';
import { LWPopper } from "./LWPopper";

const styles = defineStyles("TooltipRef", (theme: ThemeType) => ({
  tooltip: {
    maxWidth: 300,
    
    backgroundColor: theme.palette.panelBackground.tooltipBackground,
    color: theme.palette.text.tooltipText,
    fontSize: 13,
    padding: "9.1px",
    zIndex: 10000000,
    
    "& img": {
      maxWidth: "100%",
    },
  }
}), {stylePriority: -1})

interface FMTooltipProps {
  title: React.ReactNode,
  placement?: PopperPlacementType,
  distance?: number,
  styling?: "tooltip"|"none",
  flip?: boolean,
  clickable?: boolean,
  disabled?: boolean,
  hideOnTouchScreens?: boolean,
  analyticsProps?: AnalyticsProps,
  otherEventProps?: Record<string, Json | undefined>,
  className?: string,
  popperClassName?: string,
  forceOpen?: boolean,
  
  /**
   * If set, once the tooltip has been hovered and unhovered, its contents are
   * kept mounted in the tree (but hidden) and reused for later hovers. This
   * preserves the state of the contents, if there is any state.
   *
   * For tooltips close to the edge of the screen, this triggers a bug in
   * popperjs, which will cause tooltips to get narrower each time you re-hover
   * them. So, sadly, it must be used sparingly.
   */
  preserve?: boolean,
}

export const TooltipRef = <T extends HTMLElement>({
  title, placement="bottom", distance=16, styling="tooltip", flip, clickable,
  disabled, hideOnTouchScreens, analyticsProps, otherEventProps, className,
  popperClassName, forceOpen, preserve, children
}: FMTooltipProps & {
  children: (hoveredElementRef: Ref<T>) => React.ReactNode
}) => {
  const classes = useStyles(styles);
  const hoveredElementRef = useRef<T|null>(null);
  const [delayedClickable, setDelayedClickable] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clearDelayTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const { eventHandlers, hover, everHovered, anchorEl } = useHover<any>({
    eventProps: {
      pageElementContext: "tooltipHovered", // Can be overwritten by analyticsProps
      title: typeof title === "string" ? title : undefined,
      ...analyticsProps,
      ...otherEventProps,
    },
    disabledOnMobile: hideOnTouchScreens,
    //onEnter: onShow,
    onLeave: () => {
      //onHide?.();
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

  useEffect(() => {
    const hoveredElement = hoveredElementRef.current;
    if (hoveredElement) {
      hoveredElement.addEventListener("mouseover", eventHandlers.onMouseOver);
      hoveredElement.addEventListener("mouseleave", eventHandlers.onMouseLeave);
      return () => {
        hoveredElement.removeEventListener("mouseover", eventHandlers.onMouseOver);
        hoveredElement.removeEventListener("mouseleave", eventHandlers.onMouseLeave);
      }
    }
  });
  return <>
    {children(hoveredElementRef)}
    
    {(hover || (everHovered && preserve)) && <LWPopper
      placement={placement}
      open={forceOpen || (hover && !disabled)}
      anchorEl={anchorEl}
      tooltip={styling==="tooltip"}
      allowOverflow={!flip}
      clickable={delayedClickable}
      hideOnTouchScreens={hideOnTouchScreens}
      distance={distance}
      className={popperClassName}
    >
      <div className={classNames(
        styling==="tooltip" && classes.tooltip,
        className
      )}>
        {title}
      </div>
    </LWPopper>}
  </>
}

export const TooltipSpan = (props: FMTooltipProps & {
  className?: string
  children: React.ReactNode
}) => {
  const { className, ...rest } = props;
  return <TooltipRef {...rest}>
    {(ref: Ref<HTMLSpanElement>) => <span ref={ref} className={className}>
      {props.children}
    </span>}
  </TooltipRef>
}
