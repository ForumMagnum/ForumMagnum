import React, { Ref, useCallback, useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { AnalyticsProps } from '@/lib/analyticsEvents';
import { useHover } from './withHover';
import type { PopperPlacementType } from '@/lib/vendor/@material-ui/core/src/Popper'
import classNames from 'classnames';

const styles = defineStyles("FMTooltip", (theme: ThemeType) => ({
  tooltip: {
    maxWidth: 300,
    
    "& img": {
      maxWidth: "100%",
    },
  }
}), {stylePriority: -1})

export const FMTooltip = <T extends HTMLElement>({title, placement, distance, styling="tooltip", flip, clickable, disabled, hideOnTouchScreens, analyticsProps, otherEventProps, titleClassName, popperClassName, forceOpen, children}: {
  title: React.ReactNode,
  placement?: PopperPlacementType,
  distance?: number,
  styling?: "tooltip"|"paper"|"none",
  flip?: boolean,
  clickable?: boolean,
  disabled?: boolean,
  hideOnTouchScreens?: boolean,
  analyticsProps?: AnalyticsProps,
  otherEventProps?: Record<string, Json | undefined>,
  titleClassName?: string,
  popperClassName?: string,
  forceOpen?: boolean,
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

  const { LWPopper } = Components;
  return <>
    {children(hoveredElementRef)}
    
    {everHovered && <LWPopper
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
        titleClassName
      )}>
        {title}
      </div>
    </LWPopper>}
  </>
}
